import { TimeTable } from "./classes.js";
import { createScheduleTable } from "./createTables.js";
import { toPng } from "html-to-image";

export function generateCombinedSchedules(activityManager) {
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  combinedSchedulesContainer.innerHTML = "";

  const activeActivities = getActiveActivitiesAndScheduleOptions(activityManager);

  if (activeActivities.length === 0) {
    return;
  }

  const combinedSchedules = getAllCombinations(activeActivities, 0);

  combinedSchedules.forEach((combinedSchedule, index) => {
    const table = createScheduleTable();
    const hasConflict = populateScheduleTable(table, combinedSchedule);

    if (hasConflict) {
      table.classList.add("hasConflict");
    }

    const header = document.createElement("h3");
    header.textContent = `Horario ${index + 1}${
      hasConflict ? " (Cruce de Horarios)" : ""
    }`;

    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Descargar Imagen";
    downloadButton.onclick = function () {
      const clone = table.cloneNode(true);
      clone.style.background = "white";
      clone.style.width = table.offsetWidth + "px";
      document.body.appendChild(clone);

      toPng(clone, {
        pixelRatio: 3,
        backgroundColor: "white",
      }).then(function (dataUrl) {
        let link = document.createElement("a");
        link.download = `horario-combinado-${index + 1}.png`;
        link.href = dataUrl;
        link.click();
        document.body.removeChild(clone);
      });
    };

    const headerDiv = document.createElement("div");
    headerDiv.appendChild(header);
    headerDiv.appendChild(downloadButton);

    combinedSchedulesContainer.appendChild(headerDiv);
    combinedSchedulesContainer.appendChild(table);
  });
  toggleConflictSchedules();
}

function getActiveActivitiesAndScheduleOptions(activityManager) {
  let activeActivities = [];
  activityManager.activities.forEach((activity) => {
    if (activity.isActive) {
      const activeScheduleOptions = activity.scheduleOptions.filter(
        (option) => option.isActive && !isScheduleOptionEmpty(option)
      );
      if (activeScheduleOptions.length > 0) {
        activeActivities.push({
          name: activity.name,
          scheduleOptions: activeScheduleOptions,
          color: activity.color,
        });
      }
    }
  });
  return activeActivities;
}

function isScheduleOptionEmpty(scheduleOption) {
  return !Object.values(scheduleOption.timeTable).some((day) =>
    Object.values(day).some((slot) => slot === "x")
  );
}

function getAllCombinations(
  activities,
  index,
  currentCombination = [],
  allCombinations = []
) {
  if (index >= activities.length) {
    allCombinations.push([...currentCombination]);
    return;
  }

  const activity = activities[index];
  for (const scheduleOption of activity.scheduleOptions) {
    currentCombination.push({
      ...scheduleOption,
      name: activity.name,
      color: activity.color,
      totalScheduleOptions: activity.scheduleOptions.length,
    });
    getAllCombinations(activities, index + 1, currentCombination, allCombinations);
    currentCombination.pop();
  }
  return allCombinations;
}

function populateScheduleTable(table, schedules) {
  let hasScheduleConflict = false;

  for (let i = 1; i < table.rows.length; i++) {
    for (let j = 1; j < table.rows[i].cells.length; j++) {
      const day = TimeTable.days[j - 1];
      const timeSlot = TimeTable.timeSlots[i - 1];
      const cell = table.rows[i].cells[j];
      
      const schedulesInCell = schedules.filter(
        (schedule) => schedule.timeTable[day]?.[timeSlot] === "x"
      );

      if (schedulesInCell.length > 0) {
        if (schedulesInCell.length > 1) {
          hasScheduleConflict = true;
          cell.style.backgroundColor = "red";
        } else {
          cell.style.backgroundColor = schedulesInCell[0].color;
        }
        cell.innerHTML = schedulesInCell
          .map((schedule) =>
            schedule.totalScheduleOptions > 1
              ? `${schedule.name} H${schedule.index + 1}`
              : schedule.name
          )
          .join(" - ");
      }
    }
  }
  return hasScheduleConflict;
}

export function toggleConflictSchedules() {
  const showConflicts = document.getElementById("toggleConflicts").checked;
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  const tables = combinedSchedulesContainer.getElementsByTagName("table");
  const conflictLabel = document.getElementById("conflictLabel");

  conflictLabel.textContent = showConflicts
    ? "Mostrar horarios con cruces:"
    : "Ocultar horarios con cruces:";

  for (let table of tables) {
    const shouldHide = table.classList.contains("hasConflict") && showConflicts;
    table.style.display = shouldHide ? "none" : "";
    table.previousSibling.style.display = shouldHide ? "none" : "";
  }
}

export function updateCombinedSchedules(activityManager) {
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  if (combinedSchedulesContainer.innerHTML !== "") {
    generateCombinedSchedules(activityManager);
  }
}
