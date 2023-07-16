//parte de anadir asignaturas y horarios

class Schedule {
  constructor(index) {
    this.index = index;
    this.days = {};
    this.isActive = true;
    this.isEditing = true;
    this.wasEditing = false;
  }

  deactivate() {
    this.isActive = !this.isActive;

    // Si el horario se está desactivando, guarda su estado de edición
    if (!this.isActive) {
      this.wasEditing = this.isEditing;
      this.isEditing = false;
    }
    // Si el horario se está reactivando, restaura su estado de edición
    else {
      this.isEditing = this.wasEditing;
    }
  }

  edit() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }
}

class Subject {
  constructor(name, color, credits) {
    this.name = name;
    this.color = color;
    this.schedules = [new Schedule(0)];
    this.isActive = true;
    this.credits = credits;
  }

  addSchedule() {
    this.schedules.forEach((schedule) => {
      schedule.stopEditing();
    });
    this.schedules.push(new Schedule(this.schedules.length));
    return this.schedules.length - 1;
  }

  deactivate() {
    this.isActive = !this.isActive;
    this.schedules.forEach((schedule) => (schedule.isActive = this.isActive));
  }

  deleteSchedule(scheduleIndex) {
    this.schedules.splice(scheduleIndex, 1);

    // Se retorna el nuevo horario a ser editado
    let newScheduleIndex = scheduleIndex > 0 ? scheduleIndex - 1 : 0;

    return newScheduleIndex;
  }
}

class TimeTable {
  constructor() {
    this.subjects = [];
  }

  addSubject(name, color, credits) {
    this.subjects.forEach((subject) => {
      subject.schedules.forEach((schedule) => {
        schedule.stopEditing();
      });
    });
    this.subjects.push(new Subject(name, color, credits));
  }

  deleteSubject(subjectIndex) {
    this.subjects.splice(subjectIndex, 1);

    // Se retrna el nuevo indice a ser editado
    let newSubjectIndex = subjectIndex > 0 ? subjectIndex - 1 : 0;

    return newSubjectIndex;
  }
}

const horarios = new TimeTable();

function createSubject() {
  const newSubjectName = document.getElementById("newSubjectName").value;
  let subjectCredits = document.getElementById("subjectCredits").value;

  if (!newSubjectName || !subjectCredits) {
    alert(
      "Por favor ingrese un nombre de asignatura válido y la cantidad de créditos"
    );
    return;
  }

  horarios.addSubject(newSubjectName, generatePastelColor(), subjectCredits);

  updateSubjectsAndSchedules();

  // Poner el nuevo horario en estado de edición
  editingSchedule(horarios.subjects.length - 1, 0);

  document.getElementById("newSubjectName").value = "";
  document.getElementById("subjectCredits").value = "";
}

function sumCredits() {
  const showCredits = document.getElementById("showCredits");

  let sumCredits = 0;
  horarios.subjects.forEach((subject) => {
    if (subject.isActive) {
      sumCredits += parseInt(subject.credits);
    }
  });
  showCredits.innerHTML =
    sumCredits > 0 ? "<h4>Suma de creditos:</h4>" + sumCredits : "";
}

function updateSubjectsAndSchedules() {
  const subjectsAndSchedulesDiv = document.getElementById(
    "subjectsAndSchedules"
  );
  subjectsAndSchedulesDiv.innerHTML = "";

  const inactiveIcon = "🛇";
  const activeIcon = "✓";

  horarios.subjects.forEach((subject, subjectIndex) => {
    const parentDiv = document.createElement("div");

    const subjectChip = document.createElement("div");
    subjectChip.classList.add("chip");
    subjectChip.style.backgroundColor = subject.color;
    subjectChip.style.color = "black";
    // Creamos dos elementos diferentes para el nombre y los créditos
    const subjectName = document.createElement("div");
    subjectName.textContent = subject.name;

    const subjectCredits = document.createElement("div");
    subjectCredits.classList.add("credits");
    subjectCredits.textContent = "Créditos: " + subject.credits;

    const closeIcon = document.createElement("span");
    closeIcon.classList.add("close-icon");
    closeIcon.textContent = "x";
    closeIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      // Verifica si algún horario de la asignatura está en edición antes de eliminarla
      let isAnyScheduleEditing = horarios.subjects[subjectIndex].schedules.some(
        (schedule) => schedule.isEditing
      );
      const newSubjectIndex = horarios.deleteSubject(subjectIndex);
      if (horarios.subjects.length <= 0) {
        createInitialTable();
      } else if (isAnyScheduleEditing) {
        editingSchedule(newSubjectIndex, 0);
      }
      updateSubjectsAndSchedules();
    });

    const disableIcon = document.createElement("span");
    disableIcon.classList.add("disable-icon");

    if (!subject.isActive) {
      subjectChip.classList.add("inactive");
      disableIcon.textContent = activeIcon;
    } else {
      subjectChip.classList.remove("inactive");
      disableIcon.textContent = inactiveIcon;
    }

    disableIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      deactivateSubject(subjectIndex);
    });

    // Añadimos los elementos al chip de la asignatura
    subjectChip.appendChild(subjectName);
    subjectChip.appendChild(subjectCredits);
    subjectChip.appendChild(closeIcon);
    subjectChip.appendChild(disableIcon);
    parentDiv.appendChild(subjectChip);

    subject.schedules.forEach((schedule, scheduleIndex) => {
      const scheduleChip = document.createElement("div");
      scheduleChip.classList.add("chip");
      scheduleChip.textContent = `Horario ${scheduleIndex + 1}`;
      scheduleChip.addEventListener("click", () => {
        editingSchedule(subjectIndex, scheduleIndex);
      });

      if (schedule.isEditing) {
        scheduleChip.classList.add("editing");
      }

      const closeIcon = document.createElement("span");
      closeIcon.classList.add("close-icon");
      closeIcon.textContent = "x";
      closeIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        const newScheduleIndex =
          horarios.subjects[subjectIndex].deleteSchedule(scheduleIndex);
        if (horarios.subjects[subjectIndex].schedules.length > 0) {
          if (schedule.isEditing) {
            // Si todavía hay horarios para esta asignatura, editamos el primero.
            editingSchedule(subjectIndex, newScheduleIndex);
          }
        } else {
          // Si no hay más horarios para esta asignatura, eliminamos la asignatura
          const newSubjectIndex = horarios.deleteSubject(subjectIndex);
          if (horarios.subjects.length > 0) {
            if (schedule.isEditing) {
              editingSchedule(newSubjectIndex, 0);
            }
          } else {
            createInitialTable();
          }
        }

        updateSubjectsAndSchedules();
      });

      const disableIcon = document.createElement("span");
      disableIcon.classList.add("disable-icon");

      if (!schedule.isActive) {
        scheduleChip.classList.add("inactive");
        disableIcon.textContent = activeIcon;
      } else {
        disableIcon.textContent = inactiveIcon;
      }

      disableIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deactivateSchedule(subjectIndex, scheduleIndex);
      });

      scheduleChip.appendChild(closeIcon);
      scheduleChip.appendChild(disableIcon);
      parentDiv.appendChild(scheduleChip);
    });

    const addScheduleChip = document.createElement("div");
    addScheduleChip.classList.add("chip");
    addScheduleChip.classList.add("add-schedule");
    addScheduleChip.textContent = "+ Añadir Horario";
    addScheduleChip.addEventListener("click", () => {
      addSchedule(subjectIndex);
    });

    parentDiv.appendChild(addScheduleChip);
    subjectsAndSchedulesDiv.appendChild(parentDiv);
    subjectsAndSchedulesDiv.appendChild(document.createElement("hr"));
  });
  sumCredits();
}

function addSchedule(subjectIndex) {
  horarios.subjects.forEach((subject) => {
    subject.schedules.forEach((schedule) => {
      schedule.stopEditing();
    });
  });
  const scheduleIndex = horarios.subjects[subjectIndex].addSchedule();
  updateSubjectsAndSchedules();
  // Poner el nuevo horario en estado de edición
  editingSchedule(subjectIndex, scheduleIndex);
}

function editingSchedule(subjectIndex, scheduleIndex) {
  // Asegúrate de que todos los horarios no estén siendo editados
  horarios.subjects.forEach((subject) => {
    subject.schedules.forEach((schedule) => {
      schedule.stopEditing();
    });
  });

  // Verifica si el horario seleccionado está inactivo
  if (!horarios.subjects[subjectIndex].schedules[scheduleIndex].isActive) {
    return; // Si el horario está inactivo, retorna y no hagas nada más
  }

  selectedSubjectIndex = subjectIndex;
  selectedScheduleIndex = scheduleIndex;

  // Edita el horario seleccionado
  horarios.subjects[subjectIndex].schedules[scheduleIndex].edit();

  updateSubjectsAndSchedules();

  loadSchedule();
}

function deactivateSubject(subjectIndex) {
  horarios.subjects[subjectIndex].deactivate();
  updateSubjectsAndSchedules();
}

function deactivateSchedule(subjectIndex, scheduleIndex) {
  selectedSubjectIndex = subjectIndex;
  selectedScheduleIndex = scheduleIndex;

  // Cambia el estado del horario
  horarios.subjects[subjectIndex].schedules[scheduleIndex].deactivate();

  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  if (combinedSchedulesContainer.innerHTML !== "") {
    generateCombinedSchedules();
  }

  updateSubjectsAndSchedules();

  // Si el horario está activo y estaba en edición antes de ser desactivado
  if (
    horarios.subjects[subjectIndex].schedules[scheduleIndex].isActive &&
    horarios.subjects[subjectIndex].schedules[scheduleIndex].wasEditing
  ) {
    editingSchedule(subjectIndex, scheduleIndex);
  }
}

//parte de guardar y cargar el horario de la tabla

let selectedSubjectIndex = null;
let selectedScheduleIndex = null;

function loadSchedule() {
  let editingSchedule;
  let editingSubject;

  // Busca el horario que se está editando
  horarios.subjects.forEach((subject) => {
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
      const day = days[j - 1];
      const timeSlot = timeSlots[i - 1];
      if (
        editingSchedule.days[day] &&
        editingSchedule.days[day][timeSlot] === "x"
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

function saveSchedule() {
  const selectedSchedule =
    horarios.subjects[selectedSubjectIndex].schedules[selectedScheduleIndex];

  const table = document.getElementById("scheduleTable");

  selectedSchedule.days = {};
  for (let day of days) {
    selectedSchedule.days[day] = {};
    for (let timeSlot of timeSlots) {
      selectedSchedule.days[day][timeSlot] = "";
    }
  }

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      if (row.cells[j].classList.contains("selected")) {
        selectedSchedule.days[days[j - 1]][timeSlots[i - 1]] = "x";
      }
    }
  }

  loadSchedule();

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

//parte de guardar y cargar archivos json

function saveToFile() {
  const dataStr = JSON.stringify(horarios);
  const dataBlob = new Blob([dataStr], {
    type: "application/json;charset=utf-8",
  });
  const dataUrl = URL.createObjectURL(dataBlob);

  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = dataUrl;
  downloadAnchor.download = "horarios.json";
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

function loadFromFile() {
  const fileInput = document.getElementById("fileInput");
  const fileNameElement = document.getElementById("fileName");
  const file = fileInput.files[0];

  if (file) {
    // Actualizar el nombre del archivo seleccionado
    fileNameElement.textContent = " " + file.name;

    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);

        // Validación del formato
        if (!Array.isArray(data.subjects)) {
          throw new Error("Formato no válido");
        }

        // Si la validación es exitosa, reemplazar el objeto horarios
        horarios.subjects = data.subjects;

        // Actualizar el selector de asignaturas
        updateSubjectsAndSchedules();
      } catch (error) {
        alert("Error al subir el archivo: " + error.message);
      }
    };

    reader.readAsText(file);
  } else {
    // Limpiar el nombre del archivo en caso de que no haya archivo seleccionado
    fileNameElement.textContent = "";
  }
}

//parte de generar las combinaciones de horarios

function isScheduleEmpty(schedule) {
  for (let day in schedule.days) {
    for (let timeSlot in schedule.days[day]) {
      if (schedule.days[day][timeSlot] === "x") {
        return false;
      }
    }
  }
  return true;
}

let subjectColors = {};

function getActiveSubjectsAndSchedules() {
  let activeSubjects = [];
  horarios.subjects.forEach((subject) => {
    let activeSchedules = [];
    if (subject.isActive) {
      subject.schedules.forEach((schedule) => {
        if (schedule.isActive && !isScheduleEmpty(schedule)) {
          activeSchedules.push(schedule);
        }
      });
      if (activeSchedules.length > 0) {
        activeSubjects.push({
          name: subject.name,
          schedules: activeSchedules,
          color: subject.color,
        });
      }
    }
  });
  return activeSubjects;
}

function generateCombinedSchedules() {
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  combinedSchedulesContainer.innerHTML = "";

  const activeSubjects = getActiveSubjectsAndSchedules();

  // Si no hay asignaturas activas, detén la ejecución de la función
  if (activeSubjects.length === 0) {
    return;
  }

  const combinedSchedules = getAllCombinations(activeSubjects, 0);

  combinedSchedules.forEach((combinedSchedule, index) => {
    const table = createScheduleTable();
    const hasConflict = populateScheduleTable(table, combinedSchedule);

    if (hasConflict) {
      table.classList.add("hasConflict");
    }

    const header = document.createElement("h3");
    header.textContent = `Horario Combinado ${index + 1}${
      hasConflict ? " (Cruce de Horarios)" : ""
    }`;

    // Crea un botón de descarga
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Descargar Imagen";
    downloadButton.onclick = function () {
      html2canvas(table).then(function (canvas) {
        const link = document.createElement("a");
        link.href = canvas.toDataURL();
        link.download = `horario-combinado-${index + 1}.png`;
        link.click();
      });
    };

    // Crea un div para agrupar el encabezado y el botón
    const headerDiv = document.createElement("div");
    headerDiv.appendChild(header);
    headerDiv.appendChild(downloadButton);

    // Añade el div y la tabla al contenedor
    combinedSchedulesContainer.appendChild(headerDiv);
    combinedSchedulesContainer.appendChild(table);
  });
  toggleConflictSchedules();
}

function getAllCombinations(
  subjects,
  index,
  currentSchedule = [],
  allCombinations = []
) {
  if (index >= subjects.length) {
    allCombinations.push(currentSchedule.slice());
    return;
  }

  for (let i = 0; i < subjects[index].schedules.length; i++) {
    let scheduleWithSubjectName = {
      ...subjects[index].schedules[i],
      name: subjects[index].name,
      color: subjects[index].color,
    };
    currentSchedule.push(scheduleWithSubjectName);
    getAllCombinations(subjects, index + 1, currentSchedule, allCombinations);
    currentSchedule.pop();
  }
  return allCombinations;
}

function createScheduleTable() {
  const table = document.createElement("table");
  createTable(table);
  return table;
}

function generatePastelColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 20) + 80;
  const lightness = Math.floor(Math.random() * 20) + 70;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function populateScheduleTable(table, schedules) {
  let hasScheduleConflict = false;

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const day = days[j - 1];
      const timeSlot = timeSlots[i - 1];

      let cellContent = [];
      let subjectsInCell = 0;

      schedules.forEach((schedule) => {
        if (schedule.days[day] && schedule.days[day][timeSlot] === "x") {
          cellContent.push(schedule.name + " H" + (schedule.index + 1));
          subjectsInCell++;
          cellColor = schedule.color; // Usar el color de la asignatura
        }
      });

      if (subjectsInCell > 1) {
        hasScheduleConflict = true;
        row.cells[j].style.backgroundColor = "red";
        row.cells[j].innerHTML = cellContent.join(" - "); // Unir nombres con guion
      } else if (cellContent.length > 0) {
        row.cells[j].style.backgroundColor = cellColor;
        row.cells[j].innerHTML = cellContent.join(""); // Solo un nombre, sin guion
      }
    }
  }
  return hasScheduleConflict;
}

//codigo que muestra u oculta los cruces de horarios

function toggleConflictSchedules() {
  const showConflicts = document.getElementById("toggleConflicts").checked;
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  const tables = combinedSchedulesContainer.getElementsByTagName("table");

  for (let table of tables) {
    if (table.classList.contains("hasConflict") && !showConflicts) {
      table.style.display = "none";
      // Ocultar el encabezado y el botón de descarga asociado
      table.previousSibling.style.display = "none";
    } else {
      table.style.display = "";
      // Mostrar el encabezado y el botón de descarga asociado
      table.previousSibling.style.display = "";
    }
  }
}

//codigo para crear las tablas

const days = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const timeSlots = [
  "6:00AM - 6:45AM",
  "7:00AM - 7:45AM",
  "8:00AM - 8:45AM",
  "9:00AM - 9:45AM",
  "10:00AM - 10:45AM",
  "11:00AM - 11:45AM",
  "12:00PM - 12:45PM",
  "1:00PM - 1:45PM",
  "2:00PM - 2:45PM",
  "3:00PM - 3:45PM",
  "4:00PM - 4:45PM",
  "5:00PM - 5:45PM",
  "5:45PM - 6:30PM",
  "6:30PM - 7:15PM",
  "7:15PM - 8:00PM",
  "8:15PM - 9:00PM",
  "9:00PM - 9:45PM",
  "9:45PM - 10:30PM",
];

function createTable(table) {
  let header = "<thead><tr><th>Horas/días</th>";
  for (let day of days) {
    header += `<th>${day}</th>`;
  }
  header += "</thead></tr>";
  table.innerHTML = header;

  let body = "<tbody>";
  let row = "";
  for (let time of timeSlots) {
    row += `<tr><th>${time}</th>`;
    for (let day of days) {
      row += `<td></td>`;
    }
    row += "</tr>";
  }
  body += row + "</tbody>";
  table.innerHTML += body;
}

function toggleCell(cell) {
  if (
    selectedSubjectIndex == null ||
    selectedScheduleIndex == null ||
    horarios.subjects[selectedSubjectIndex] === undefined ||
    horarios.subjects[selectedSubjectIndex].schedules[selectedScheduleIndex] ===
      undefined
  ) {
    alert("Selecciona primero una asignatura y un horario");
    return;
  }

  const selectedColor = horarios.subjects[selectedSubjectIndex].color;

  cell.classList.toggle("selected");

  cell.style.backgroundColor = cell.style.backgroundColor ? "" : selectedColor;

  //guardar horario
  saveSchedule();

  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  if (combinedSchedulesContainer.innerHTML !== "") {
    generateCombinedSchedules();
  }
}

let isDragging = false;

function createInitialTable() {
  const table = document.getElementById("scheduleTable");

  createTable(table);

  // Agrega los listeners a las celdas
  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const cell = row.cells[j];

      cell.addEventListener("mousedown", (e) => {
        isDragging = true;
        toggleCell(e.target);
      });

      cell.addEventListener("mouseover", (e) => {
        if (isDragging) {
          toggleCell(e.target);
        }
      });
    }
  }

  // Escucha el evento mouseup en el objeto window
  window.addEventListener("mouseup", (e) => {
    isDragging = false;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  createInitialTable();
});
