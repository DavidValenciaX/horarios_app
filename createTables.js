import { TimeTable } from "./classes.js";
import { updateCombinedSchedules } from "./combinations.js";
import { apiService } from "./api.js";
import Swal from "sweetalert2";

function darkenHex(color, factor) {
  const hex = color.slice(1);
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - factor)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - factor)));
  const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - factor)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function darkenRgb(color, factor) {
  const matches = color.match(/\d+/g);
  if (!matches) return color;

  const r = Math.max(0, Math.floor(parseInt(matches[0]) * (1 - factor)));
  const g = Math.max(0, Math.floor(parseInt(matches[1]) * (1 - factor)));
  const b = Math.max(0, Math.floor(parseInt(matches[2]) * (1 - factor)));
  const a = matches.length > 3 ? parseFloat(matches[3]) : 1;
  
  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenHsl(color, factor) {
  const matches = color.match(/(\d+(?:\.\d+)?)/g);
  if (!matches || matches.length < 3) return color;

  const h = parseFloat(matches[0]);
  const s = parseFloat(matches[1]);
  const l = Math.max(0, parseFloat(matches[2]) * (1 - factor));
  const a = matches.length > 3 ? parseFloat(matches[3]) : 1;

  if (a < 1) {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  }
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function darkenNamedColor(color, factor) {
  const temp = document.createElement("div");
  temp.style.color = color;
  document.body.appendChild(temp);
  const computedColor = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);

  return computedColor && computedColor !== color
    ? darkenColor(computedColor, factor)
    : color;
}

// Utility function to darken a color
function darkenColor(color, factor) {
  if (color.startsWith("#")) return darkenHex(color, factor);
  if (color.startsWith("rgb")) return darkenRgb(color, factor);
  if (color.startsWith("hsl")) return darkenHsl(color, factor);
  if (/^[a-zA-Z]+$/.test(color)) return darkenNamedColor(color, factor);
  return color;
}

export function createScheduleTable() {
  const table = document.createElement("table");
  createTable(table);
  return table;
}

function createTable(table) {
  let header = "<thead><tr><th>Horas / Días</th>";
  for (let day of TimeTable.days) {
    const initial = day.charAt(0);
    header += `<th><span class="day-full">${day}</span><span class="day-initial">${initial}</span></th>`;
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
    Swal.fire({
      icon: 'info',
      title: 'Actividad requerida',
      text: 'Selecciona primero una actividad y una opción de horario',
      confirmButtonText: 'Entendido'
    });
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
    // Set border color to a darker version of the background color
    cell.style.outline = `1px solid ${darkenColor(selectedColor, 0.1)}`;
    cell.style.outlineOffset = "-1px";
    cell.style.zIndex = "2";
  } else {
    cell.classList.remove("selected");
    cell.style.backgroundColor = "";
    cell.style.outline = "";
    cell.style.outlineOffset = "";
    cell.style.zIndex = "";
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

function getEditingInfo(activityManager) {
  for (const activity of activityManager.activities) {
    const editingOption = activity.activityScheduleOptions.find(o => o.isEditing);
    if (editingOption) {
      return { editingActivity: activity, editingActivityScheduleOption: editingOption };
    }
  }
  return { editingActivity: null, editingActivityScheduleOption: null };
}

function styleCell(cell, isSelected, color, hasEditingOption) {
  cell.classList.toggle("selected", isSelected);
  cell.style.backgroundColor = isSelected ? color : "";
  cell.style.outline = isSelected
    ? `1px solid ${darkenColor(color, 0.1)}`
    : "";
  cell.style.outlineOffset = isSelected ? "-1px" : "";
  cell.style.zIndex = isSelected ? "2" : "";
  cell.classList.toggle("editing-highlight", hasEditingOption);
}

export function loadActivityScheduleOption(scheduleManager) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) return;

  const { editingActivity, editingActivityScheduleOption } = getEditingInfo(
    activeSchedule.activityManager
  );

  const table = document.getElementById("scheduleOptionTable");
  if (!table) return;

  const hasEditingOption = !!editingActivityScheduleOption;
  const selectedColor = editingActivity?.color || "";

  for (let i = 1; i < table.rows.length; i++) {
    for (let j = 1; j < table.rows[i].cells.length; j++) {
      const cell = table.rows[i].cells[j];
      const day = TimeTable.days[j - 1];
      const timeSlot = TimeTable.timeSlots[i - 1];

      const isSelected =
        editingActivityScheduleOption?.timeTable[day]?.[timeSlot] === true;

      styleCell(cell, isSelected, selectedColor, hasEditingOption);
    }
  }
}