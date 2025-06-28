import { TimeTable } from "./classes.js";
import { updateCombinedSchedules } from "./combinations.js";
import { apiService } from "./api.js";

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
let dragValue = null; // Track whether we're adding or removing cells

export function createInitialTable(scheduleManager) {
  const tableContainer = document.getElementById(
    "scheduleOptionTableContainer"
  );
  if (!tableContainer) return;

  const table = document.createElement("table");
  table.id = "scheduleOptionTable";

  // Limpiar el contenedor antes de agregar la nueva tabla, preservando otros elementos
  const oldTable = tableContainer.querySelector("#scheduleOptionTable");
  if (oldTable) {
    oldTable.remove();
  }

  tableContainer.appendChild(table);

  createTable(table);

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const cell = row.cells[j];
      
      // Touch and mouse events
      cell.addEventListener("mousedown", async (e) => {
        e.preventDefault();
        isDragging = true;
        dragValue = !cell.classList.contains("selected");
        await toggleCell(scheduleManager, e.target, dragValue);
      });
      
      cell.addEventListener("mouseover", async (e) => {
        if (isDragging && dragValue !== null) {
          await toggleCell(scheduleManager, e.target, dragValue);
        }
      });

      // Touch events for mobile
      cell.addEventListener("touchstart", async (e) => {
        e.preventDefault();
        isDragging = true;
        dragValue = !cell.classList.contains("selected");
        await toggleCell(scheduleManager, e.target, dragValue);
      });

      cell.addEventListener("touchmove", async (e) => {
        e.preventDefault();
        if (isDragging && dragValue !== null) {
          const touch = e.touches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          if (element && element.tagName === 'TD' && element !== e.target) {
            await toggleCell(scheduleManager, element, dragValue);
          }
        }
      });
    }
  }

  // Global event listeners
  const stopDragging = () => {
    isDragging = false;
    dragValue = null;
  };

  window.addEventListener("mouseup", stopDragging);
  window.addEventListener("touchend", stopDragging);
  window.addEventListener("touchcancel", stopDragging);
}

async function toggleCell(scheduleManager, cell, forceValue = null) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) return;
  const activityManager = activeSchedule.activityManager;

  let editingActivityScheduleOption;
  let editingActivity;

  activityManager.activities.forEach((activity) => {
    activity.activityScheduleOptions.forEach((activityScheduleOption) => {
      if (activityScheduleOption.isEditing) {
        editingActivityScheduleOption = activityScheduleOption;
        editingActivity = activity;
      }
    });
  });

  if (!editingActivityScheduleOption) {
    alert("Selecciona primero una actividad y una opción de horario");
    return;
  }

  const selectedColor = editingActivity.color;
  const isCurrentlySelected = cell.classList.contains("selected");
  const shouldSelect = forceValue !== null ? forceValue : !isCurrentlySelected;

  // Visual feedback for touch
  cell.style.transform = "scale(0.95)";
  setTimeout(() => {
    cell.style.transform = "";
  }, 100);

  if (shouldSelect) {
    cell.classList.add("selected");
    cell.style.backgroundColor = selectedColor;
  } else {
    cell.classList.remove("selected");
    cell.style.backgroundColor = "";
  }

  saveActivityScheduleOption(scheduleManager);
  await updateCombinedSchedules(scheduleManager);
}

function saveActivityScheduleOption(scheduleManager) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) return;
  const activityManager = activeSchedule.activityManager;

  let editingActivityScheduleOption;
  activityManager.activities.forEach((activity) => {
    activity.activityScheduleOptions.forEach((activityScheduleOption) => {
      if (activityScheduleOption.isEditing) {
        editingActivityScheduleOption = activityScheduleOption;
      }
    });
  });

  if (!editingActivityScheduleOption) return;

  const table = document.getElementById("scheduleOptionTable");
  editingActivityScheduleOption.timeTable = TimeTable.initializeTimeTable(); // Reiniciar

  for (let i = 1; i < table.rows.length; i++) {
    for (let j = 1; j < table.rows[i].cells.length; j++) {
      if (table.rows[i].cells[j].classList.contains("selected")) {
        const day = TimeTable.days[j - 1];
        const timeSlot = TimeTable.timeSlots[i - 1];
        editingActivityScheduleOption.timeTable[day][timeSlot] = true;
      }
    }
  }
  
  // Auto-save when activity schedule option is modified
  apiService.scheduleAutoSave(scheduleManager);
}

export function loadActivityScheduleOption(scheduleManager) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) return;
  const activityManager = activeSchedule.activityManager;

  let editingActivityScheduleOption;
  let editingActivity;

  activityManager.activities.forEach((activity) => {
    activity.activityScheduleOptions.forEach((activityScheduleOption) => {
      if (activityScheduleOption.isEditing) {
        editingActivityScheduleOption = activityScheduleOption;
        editingActivity = activity;
      }
    });
  });

  const table = document.getElementById("scheduleOptionTable");
  if (!table) return;

  // Clear all editing highlights first
  for (let i = 1; i < table.rows.length; i++) {
    for (let j = 1; j < table.rows[i].cells.length; j++) {
      const cell = table.rows[i].cells[j];
      cell.classList.remove("editing-highlight");
    }
  }

  for (let i = 1; i < table.rows.length; i++) {
    for (let j = 1; j < table.rows[i].cells.length; j++) {
      const cell = table.rows[i].cells[j];
      const day = TimeTable.days[j - 1];
      const timeSlot = TimeTable.timeSlots[i - 1];

      const isSelected =
        editingActivityScheduleOption?.timeTable[day]?.[timeSlot] === true;

      cell.classList.toggle("selected", isSelected);
      cell.style.backgroundColor = isSelected ? editingActivity?.color : "";
      
      // Add editing highlight to show which activity is being edited
      if (editingActivityScheduleOption) {
        cell.classList.add("editing-highlight");
      }
    }
  }
}