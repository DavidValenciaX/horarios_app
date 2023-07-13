//parte de anadir asignaturas y horarios

class Schedule {
  constructor() {
    this.days = {};
    this.isActive = true;
    this.isEditing = true; 
  }

  deactivate() {
    this.isActive = !this.isActive;
  }

  edit() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }

}

class Subject {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.schedules = [new Schedule()];
    this.isActive = true;
  }

  addSchedule() {
    this.schedules.forEach((schedule) => { schedule.stopEditing(); });
    this.schedules.push(new Schedule());
    // Aquí podrías retornar el índice del nuevo horario, por si lo necesitas.
    return this.schedules.length - 1;
  }

  deactivate() {
    this.isActive = !this.isActive;
    this.schedules.forEach(schedule => schedule.isActive = this.isActive);
  }
}

class TimeTable {
  constructor() {
    this.subjects = [];
  }

  addSubject(name, color) {
    this.subjects.forEach((subject) => {
      subject.schedules.forEach((schedule) => {
        schedule.stopEditing();
      });
    });
    this.subjects.push(new Subject(name, color));
  }
  
  deleteSubject(index) {
    this.subjects.splice(index, 1);
  }
}

const horarios = new TimeTable();

function createSubject() {
  const newSubjectName = document.getElementById("newSubjectName").value;

  if (!newSubjectName) {
    alert("Por favor ingrese un nombre de asignatura válido");
    return;
  }

  horarios.addSubject(newSubjectName, generatePastelColor());

  updateSubjectsAndSchedules();

  // Poner el nuevo horario en estado de edición
  editingSchedule(horarios.subjects.length - 1, 0);

  document.getElementById("newSubjectName").value = "";
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
    subjectChip.textContent = subject.name;
    subjectChip.id = `subjectChip-${subjectIndex}`;

    const closeIcon = document.createElement("span");
    closeIcon.classList.add("close-icon");
    closeIcon.textContent = "x";
    closeIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSubject(subjectIndex);
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

    subjectChip.appendChild(closeIcon);
    subjectChip.appendChild(disableIcon);
    parentDiv.appendChild(subjectChip);

    subject.schedules.forEach((schedule, scheduleIndex) => {
      const scheduleChip = document.createElement("div");
      scheduleChip.classList.add("chip");
      scheduleChip.textContent = `Horario ${scheduleIndex + 1}`;
      scheduleChip.id = `scheduleChip-${subjectIndex}-${scheduleIndex}`;
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
        deleteSchedule(subjectIndex, scheduleIndex);
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
}

function deleteSubject(subjectIndex) {
  horarios.deleteSubject(subjectIndex);
  updateSubjectsAndSchedules();

  if (horarios.subjects.length == 0) {
    // Si no hay más asignaturas, no hacemos nada más.
    createInitialTable();
    return;
  }

  // Escogemos una nueva asignatura para editar.
  // Si la asignatura eliminada no era la primera, editamos la anterior.
  // Si la asignatura eliminada era la primera, editamos la siguiente (ahora la primera asignatura en la lista).
  let newSubjectIndex = subjectIndex > 0 ? subjectIndex - 1 : 0;

  // Ahora que tenemos la nueva asignatura, vamos a editar su primer horario.
  // Si no hay horarios para esta asignatura, no hacemos nada más.
  if (horarios.subjects[newSubjectIndex].schedules.length == 0) {
    return;
  }

  editingSchedule(newSubjectIndex, 0);
}

function deleteSchedule(subjectIndex, scheduleIndex) {
  horarios.subjects[subjectIndex].schedules.splice(scheduleIndex, 1);

  updateSubjectsAndSchedules();

  if (horarios.subjects[subjectIndex].schedules.length == 0) {
    // Si no hay más horarios para esta asignatura, la eliminamos.
    deleteSubject(subjectIndex);
  } else {
    // Escogemos un nuevo horario para editar.
    // Si el horario eliminado no era el primero, editamos el horario anterior.
    // Si el horario eliminado era el primero, editamos el siguiente (ahora el primer horario en la lista).
    let newScheduleIndex = scheduleIndex > 0 ? scheduleIndex - 1 : 0;

    editingSchedule(subjectIndex, newScheduleIndex);
  }
}

function addSchedule(subjectIndex) {
  horarios.subjects.forEach(subject => {
    subject.schedules.forEach(schedule => {
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
  horarios.subjects.forEach(subject => {
    subject.schedules.forEach(schedule => {
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

let editingSubjectIndex = null;
let editingScheduleIndex = null;

function deactivateSubject(subjectIndex) {
  // No hay necesidad de buscar y manipular el chip del sujeto en el DOM.
  // En lugar de eso, simplemente modifica los datos y luego actualiza la UI.
  horarios.subjects[subjectIndex].deactivate();
  updateSubjectsAndSchedules();

  // Si el sujeto actualmente está en edición, cambia el enfoque de edición al primer horario de la asignatura si está activa y tiene horarios.
  if (editingSubjectIndex === subjectIndex && horarios.subjects[subjectIndex].isActive && horarios.subjects[subjectIndex].schedules.length > 0) {
    editingSchedule(subjectIndex, 0);
  }
  // Si otro horario está en edición, mantén su enfoque.
  else if (editingSubjectIndex !== null && editingScheduleIndex !== null) {
    editingSchedule(editingSubjectIndex, editingScheduleIndex);
  }
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

  // Regresa al horario que estaba siendo editado si existe y no es el que se acaba de desactivar
  if (editingSubjectIndex !== null && editingScheduleIndex !== null && !(editingSubjectIndex === subjectIndex && editingScheduleIndex === scheduleIndex)) {
    editingSchedule(editingSubjectIndex, editingScheduleIndex);
  } else if(horarios.subjects[subjectIndex].schedules[scheduleIndex].isActive) { // verifica si el horario está activo
    editingSchedule(subjectIndex, scheduleIndex); // edita este horario
  }
}

//parte de guardar y cargar el horario de la tabla

let selectedSubjectIndex = null;
let selectedScheduleIndex = null;

function loadSchedule() {
  let editingSchedule;
  let editingSubject;

  // Busca el horario que se está editando
  horarios.subjects.forEach(subject => {
    subject.schedules.forEach(schedule => {
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
  horarios.subjects.forEach((subject, subjectIndex) => {
    let activeSchedules = [];
    if (subject.isActive) {
      subject.schedules.forEach((schedule, scheduleIndex) => {
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
          cellContent.push(schedule.name);
          subjectsInCell++;
          cellColor = schedule.color; // Usar el color de la asignatura
        }
      });

      if (subjectsInCell > 1) {
        hasScheduleConflict = true;
        row.cells[j].style.backgroundColor = "red";
        row.cells[j].innerHTML = cellContent.join(" - "); // Unir nombres con guion
      } else if (cellContent.length > 0) {
        let subjectName = cellContent[0];
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
    horarios.subjects[selectedSubjectIndex].schedules[
      selectedScheduleIndex
    ] === undefined
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