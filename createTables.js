import { TimeTable } from "./classes.js";
import { updateCombinedSchedules } from "./combinations.js";

export function createScheduleTable() {
  const table = document.createElement("table");
  createTable(table);
  return table;
}

function createTable(table) {
  let header = "<thead><tr><th>Horas/días</th>";
  for (let day of TimeTable.days) {
    header += `<th>${day}</th>`;
  }
  header += "</tr></thead>";
  table.innerHTML = header;

  let body = "<tbody>";
  let row = "";
  for (let time of TimeTable.timeSlots) {
    row += `<tr><th>${time}</th>`;
    row += `<td></td>`.repeat(TimeTable.days.length);
    row += "</tr>";
  }
  body += row + "</tbody>";
  table.innerHTML += body;
}

let isDragging = false;

export function createInitialTable(scenarioManager) {
  const tableContainer = document.getElementById(
    "scheduleOptionTableContainer"
  );
  if (!tableContainer) return;

  const table = document.createElement("table");
  table.id = "scheduleOptionTable";

  tableContainer.innerHTML = ""; // Limpiar el contenedor antes de agregar la nueva tabla
  tableContainer.appendChild(table);

  createTable(table);

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const cell = row.cells[j];
      cell.addEventListener("mousedown", (e) => {
        isDragging = true;
        toggleCell(scenarioManager, e.target);
      });
      cell.addEventListener("mouseover", (e) => {
        if (isDragging) {
          toggleCell(scenarioManager, e.target);
        }
      });
    }
  }

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function toggleCell(scenarioManager, cell) {
  const activeScenario = scenarioManager.getActiveScenario();
  if (!activeScenario) return;
  const activityManager = activeScenario.activityManager;

  let editingScheduleOption;
  let editingActivity;

  activityManager.activities.forEach((activity) => {
    activity.scheduleOptions.forEach((scheduleOption) => {
      if (scheduleOption.isEditing) {
        editingScheduleOption = scheduleOption;
        editingActivity = activity;
      }
    });
  });

  if (!editingScheduleOption) {
    alert("Selecciona primero una actividad y una opción de horario");
    return;
  }

  const selectedColor = editingActivity.color;
  cell.classList.toggle("selected");
  cell.style.backgroundColor = cell.classList.contains("selected")
    ? selectedColor
    : "";

  saveScheduleOption(scenarioManager);
  updateCombinedSchedules(scenarioManager);
}

function saveScheduleOption(scenarioManager) {
  const activeScenario = scenarioManager.getActiveScenario();
  if (!activeScenario) return;
  const activityManager = activeScenario.activityManager;

  let editingScheduleOption;
  activityManager.activities.forEach((activity) => {
    activity.scheduleOptions.forEach((scheduleOption) => {
      if (scheduleOption.isEditing) {
        editingScheduleOption = scheduleOption;
      }
    });
  });

  if (!editingScheduleOption) return;

  const table = document.getElementById("scheduleOptionTable");
  editingScheduleOption.timeTable = new TimeTable().initializeTimeTable(); // Reiniciar

  for (let i = 1; i < table.rows.length; i++) {
    for (let j = 1; j < table.rows[i].cells.length; j++) {
      if (table.rows[i].cells[j].classList.contains("selected")) {
        const day = TimeTable.days[j - 1];
        const timeSlot = TimeTable.timeSlots[i - 1];
        editingScheduleOption.timeTable[day][timeSlot] = "x";
      }
    }
  }

  const saveIcon = document.getElementById("saveScheduleOptionIcon");
  saveIcon.textContent = "✔";
  setTimeout(() => (saveIcon.style.opacity = "0"), 500);
  setTimeout(() => {
    saveIcon.textContent = "";
    saveIcon.style.opacity = "1";
  }, 1500);
}

export function loadScheduleOption(scenarioManager) {
  const activeScenario = scenarioManager.getActiveScenario();
  if (!activeScenario) return;
  const activityManager = activeScenario.activityManager;

  let editingScheduleOption;
  let editingActivity;

  activityManager.activities.forEach((activity) => {
    activity.scheduleOptions.forEach((scheduleOption) => {
      if (scheduleOption.isEditing) {
        editingScheduleOption = scheduleOption;
        editingActivity = activity;
      }
    });
  });

  const table = document.getElementById("scheduleOptionTable");
  if (!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    for (let j = 1; j < table.rows[i].cells.length; j++) {
      const cell = table.rows[i].cells[j];
      const day = TimeTable.days[j - 1];
      const timeSlot = TimeTable.timeSlots[i - 1];

      const isSelected =
        editingScheduleOption?.timeTable[day]?.[timeSlot] === "x";

      cell.classList.toggle("selected", isSelected);
      cell.style.backgroundColor = isSelected ? editingActivity?.color : "";
    }
  }
}
