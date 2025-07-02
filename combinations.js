import { TimeTable } from "./classes.js";
import { createScheduleTable } from "./createTables.js";
import { toPng } from "html-to-image";
import { apiService } from "./api.js";

export async function generateCombinedSchedules(scheduleManager) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) return;
  const activityManager = activeSchedule.activityManager;

  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  combinedSchedulesContainer.innerHTML = "";

  const activeActivities = getActiveActivitiesAndActivityScheduleOptions(activityManager);

  if (activeActivities.length === 0) {
    return;
  }

  // Try server-side generation first, fallback to client-side
  let combinedSchedules;
  try {
    const serverCombinations = await apiService.generateCombinations(
      activeActivities, 
      TimeTable.days, 
      TimeTable.timeSlots
    );
    
    if (serverCombinations) {
      combinedSchedules = serverCombinations;
    } else {
      // Fallback to client-side generation
      combinedSchedules = getAllCombinations(activeActivities, 0);
    }
  } catch (error) {
    console.warn('Server-side combination generation failed, using client-side:', error);
    combinedSchedules = getAllCombinations(activeActivities, 0);
  }

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
    downloadButton.onclick = () => downloadScheduleAsImage(table, index);

    const headerDiv = document.createElement("div");
    headerDiv.classList.add("combined-schedule-header");
    headerDiv.appendChild(header);
    headerDiv.appendChild(downloadButton);

    combinedSchedulesContainer.appendChild(headerDiv);
    combinedSchedulesContainer.appendChild(table);
  });
  toggleConflictSchedules();
}

function getActiveActivitiesAndActivityScheduleOptions(activityManager) {
  let activeActivities = [];
  activityManager.activities.forEach((activity) => {
    if (activity.isActive) {
      const activeActivityScheduleOptions = activity.activityScheduleOptions.filter(
        (option) => option.isActive && !isActivityScheduleOptionEmpty(option)
      );
      if (activeActivityScheduleOptions.length > 0) {
        activeActivities.push({
          name: activity.name,
          activityScheduleOptions: activeActivityScheduleOptions,
          color: activity.color,
        });
      }
    }
  });
  return activeActivities;
}

function isActivityScheduleOptionEmpty(activityScheduleOption) {
  return !Object.values(activityScheduleOption.timeTable).some((day) =>
    Object.values(day).some((slot) => slot)
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
  for (const activityScheduleOption of activity.activityScheduleOptions) {
    currentCombination.push({
      ...activityScheduleOption,
      name: activity.name,
      color: activity.color,
      totalActivityScheduleOptions: activity.activityScheduleOptions.length,
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
        (schedule) => schedule.timeTable[day]?.[timeSlot]
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
            schedule.totalActivityScheduleOptions > 1
              ? `${schedule.name} H${schedule.index + 1}`
              : schedule.name
          )
          .join(" - ");
      }
    }
  }
  return hasScheduleConflict;
}

function triggerDownload(dataUrl, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

async function downloadScheduleAsImage(table, index) {
  const clone = table.cloneNode(true);
  clone.style.background = "white";
  clone.style.width = `${table.offsetWidth}px`;
  clone.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  document.body.appendChild(clone);

  try {
    let dataUrl;
    try {
      dataUrl = await toPng(clone, {
        pixelRatio: 3,
        backgroundColor: "white",
        useCORS: false,
        allowTaint: false,
        preferredFontFormat: "woff2",
      });
    } catch (error) {
      console.warn("Error al generar imagen, reintentando con configuración simple:", error);
      dataUrl = await toPng(clone, {
        pixelRatio: 2,
        backgroundColor: "white",
      });
    }
    triggerDownload(dataUrl, `horario-combinado-${index + 1}.png`);
  } catch (error) {
    console.error("Fallo la generación de la imagen del horario:", error);
    // Aquí podrías notificar al usuario que la descarga falló.
  } finally {
    document.body.removeChild(clone);
  }
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

export async function updateCombinedSchedules(scheduleManager) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) return;

  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  if (combinedSchedulesContainer.innerHTML !== "") {
    await generateCombinedSchedules(scheduleManager);
  }
}
