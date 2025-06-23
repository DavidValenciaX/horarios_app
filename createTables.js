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

export function createInitialTable(subjectManager) {
  const tableContainer = document.getElementById("classTimeTableContainer");
  if (!tableContainer) return;

  const table = document.createElement("table");
  table.id = "classTimeTable";

  tableContainer.appendChild(table);

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
  let editingClassTime;
  let editingSubject;

  // Busca el horario que se está editando
  subjectManager.subjects.forEach((subject) => {
    subject.classTimes.forEach((classTime) => {
      if (classTime.isEditing) {
        editingClassTime = classTime;
        editingSubject = subject;
      }
    });
  });

  if (!editingClassTime) {
    alert("Selecciona primero una asignatura y una hora de clase");
    return;
  }

  const selectedColor = editingSubject.color;

  cell.classList.toggle("selected");

  cell.style.backgroundColor = cell.style.backgroundColor ? "" : selectedColor;

  //guardar horario
  saveClassTime(subjectManager);

  updateCombinedSchedules(subjectManager);
}

//parte de guardar y cargar la hora de clase de la tabla

//función para guardar las horas de clase de la tabla
function saveClassTime(subjectManager) {
  let editingClassTime;

  // Busca el horario que se está editando
  subjectManager.subjects.forEach((subject) => {
    subject.classTimes.forEach((classTime) => {
      if (classTime.isEditing) {
        editingClassTime = classTime;
      }
    });
  });

  if (!editingClassTime) {
    alert("Selecciona primero una asignatura y una hora de clase");
    return;
  }

  const table = document.getElementById("classTimeTable");

  editingClassTime.timeTable = {};
  for (let day of TimeTable.days) {
    editingClassTime.timeTable[day] = {};
    for (let timeSlot of TimeTable.timeSlots) {
      editingClassTime.timeTable[day][timeSlot] = "";
    }
  }

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      if (row.cells[j].classList.contains("selected")) {
        editingClassTime.timeTable[TimeTable.days[j - 1]][
          TimeTable.timeSlots[i - 1]
        ] = "x";
      }
    }
  }

  loadClassTime(subjectManager);

  // muestra el icono de verificación.
  const saveClassTimeIcon = document.getElementById("saveClassTimeIcon");
  saveClassTimeIcon.textContent = "✔";

  // Eliminar el icono después de 1 segundos
  setTimeout(function () {
    saveClassTimeIcon.style.opacity = "0";
  }, 500);

  setTimeout(function () {
    saveClassTimeIcon.textContent = "";
    saveClassTimeIcon.style.opacity = "1";
  }, 1500);
}

//función que carga la tabla con la hora de clase
export function loadClassTime(subjectManager) {
  let editingClassTime;
  let editingSubject;

  // Busca el horario que se está editando
  subjectManager.subjects.forEach((subject) => {
    subject.classTimes.forEach((classTime) => {
      if (classTime.isEditing) {
        editingClassTime = classTime;
        editingSubject = subject;
      }
    });
  });

  // Si no se está editando ningún horario, muestra una alerta y retorna
  if (!editingClassTime) {
    alert("Selecciona primero una asignatura y una hora de clase");
    return;
  }

  const selectedColor = editingSubject.color;

  const table = document.getElementById("classTimeTable");

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const day = TimeTable.days[j - 1];
      const timeSlot = TimeTable.timeSlots[i - 1];
      if (
        editingClassTime.timeTable[day] &&
        editingClassTime.timeTable[day][timeSlot] === "x"
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
