import { TimeTable } from "./classes.js";
import { updateCombinedSchedules } from "./UI.js";

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
  header += "</thead></tr>";
  table.innerHTML = header;

  let body = "<tbody>";
  let row = "";
  for (let time of TimeTable.timeSlots) {
    row += `<tr><th>${time}</th>`;
    for (let day of TimeTable.days) {
      row += `<td></td>`;
    }
    row += "</tr>";
  }
  body += row + "</tbody>";
  table.innerHTML += body;
}

let isDragging = false;

export function createInitialTable(subjectManager) {
  const table = document.getElementById("scheduleTable");

  createTable(table);

  // Agrega los listeners a las celdas
  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const cell = row.cells[j];

      cell.addEventListener("mousedown", (e) => {
        isDragging = true;
        toggleCell(subjectManager, e.target);
      });

      cell.addEventListener("mouseover", (e) => {
        if (isDragging) {
          toggleCell(subjectManager, e.target);
        }
      });
    }
  }

  // Escucha el evento mouseup en el objeto window
  window.addEventListener("mouseup", (e) => {
    isDragging = false;
  });
}

function toggleCell(subjectManager, cell) {
  let editingSchedule;
  let editingSubject;

  // Busca el horario que se está editando
  subjectManager.subjects.forEach((subject) => {
    subject.schedules.forEach((schedule) => {
      if (schedule.isEditing) {
        editingSchedule = schedule;
        editingSubject = subject;
      }
    });
  });

  if (!editingSchedule) {
    alert("Selecciona primero una asignatura y un horario");
    return;
  }

  const selectedColor = editingSubject.color;

  cell.classList.toggle("selected");

  cell.style.backgroundColor = cell.style.backgroundColor ? "" : selectedColor;

  //guardar horario
  saveSchedule(subjectManager);

  updateCombinedSchedules(subjectManager);
}

//parte de guardar y cargar el horario de la tabla

//función para guardar las horas de clase de la tabla
function saveSchedule(subjectManager) {
  let editingSchedule;

  // Busca el horario que se está editando
  subjectManager.subjects.forEach((subject) => {
    subject.schedules.forEach((schedule) => {
      if (schedule.isEditing) {
        editingSchedule = schedule;
      }
    });
  });

  if (!editingSchedule) {
    alert("Selecciona primero una asignatura y un horario");
    return;
  }

  const table = document.getElementById("scheduleTable");

  editingSchedule.timeTable = {};
  for (let day of TimeTable.days) {
    editingSchedule.timeTable[day] = {};
    for (let timeSlot of TimeTable.timeSlots) {
      editingSchedule.timeTable[day][timeSlot] = "";
    }
  }

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      if (row.cells[j].classList.contains("selected")) {
        editingSchedule.timeTable[TimeTable.days[j - 1]][
          TimeTable.timeSlots[i - 1]
        ] = "x";
      }
    }
  }

  loadSchedule(subjectManager);

  // Cuando todo está hecho, muestra el icono de verificación.
  const scheduleSavedIcon = document.getElementById("scheduleSavedIcon");
  scheduleSavedIcon.textContent = "✔";

  // Eliminar el icono después de 1 segundos
  setTimeout(function () {
    scheduleSavedIcon.style.opacity = "0";
  }, 500);

  setTimeout(function () {
    scheduleSavedIcon.textContent = "";
    scheduleSavedIcon.style.opacity = "1";
  }, 1500);
}

//función que carga la tabla con las horas de clase
export function loadSchedule(subjectManager) {
  let editingSchedule;
  let editingSubject;

  // Busca el horario que se está editando
  subjectManager.subjects.forEach((subject) => {
    subject.schedules.forEach((schedule) => {
      if (schedule.isEditing) {
        editingSchedule = schedule;
        editingSubject = subject;
      }
    });
  });

  // Si no se está editando ningún horario, muestra una alerta y retorna
  if (!editingSchedule) {
    alert("Selecciona primero una asignatura y un horario");
    return;
  }

  const selectedColor = editingSubject.color;

  const table = document.getElementById("scheduleTable");

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const day = TimeTable.days[j - 1];
      const timeSlot = TimeTable.timeSlots[i - 1];
      if (
        editingSchedule.timeTable[day] &&
        editingSchedule.timeTable[day][timeSlot] === "x"
      ) {
        row.cells[j].classList.add("selected");
        row.cells[j].style.backgroundColor = selectedColor;
      } else {
        row.cells[j].classList.remove("selected");
        row.cells[j].style.backgroundColor = "";
      }
    }
  }
}
