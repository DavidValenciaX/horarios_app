//parte de anadir asignaturas y horarios

const horarios = { asignaturas: [] };

function saveSchedule() {
  if (
    selectedSubjectIndex == null ||
    selectedScheduleIndex == null ||
    horarios.asignaturas[selectedSubjectIndex] === undefined ||
    horarios.asignaturas[selectedSubjectIndex].schedules[
      selectedScheduleIndex
    ] === undefined
  ) {
    alert("Selecciona primero una asignatura y un horario");
    return;
  }

  const selectedSchedule =
    horarios.asignaturas[selectedSubjectIndex].schedules[selectedScheduleIndex];

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

function loadSchedule() {
  if (
    selectedSubjectIndex == null ||
    selectedScheduleIndex == null ||
    horarios.asignaturas[selectedSubjectIndex] === undefined ||
    horarios.asignaturas[selectedSubjectIndex].schedules[
      selectedScheduleIndex
    ] === undefined
  ) {
    alert("Selecciona primero una asignatura y un horario");
    return;
  }

  const selectedSchedule =
    horarios.asignaturas[selectedSubjectIndex].schedules[selectedScheduleIndex];

  const table = document.getElementById("scheduleTable");

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const day = days[j - 1];
      const timeSlot = timeSlots[i - 1];
      if (
        selectedSchedule.days[day] &&
        selectedSchedule.days[day][timeSlot] === "x"
      ) {
        row.cells[j].classList.add("selected");
      } else {
        row.cells[j].classList.remove("selected");
      }
    }
  }
}

let selectedSubjectIndex = null;
let selectedScheduleIndex = null;

function createSubject() {
  const newSubjectName = document.getElementById("newSubjectName").value;

  if (!newSubjectName) {
    alert("Por favor ingrese un nombre de asignatura válido");
    return;
  }

  const subject = {
    subjectName: newSubjectName,
    schedules: [{ days: {} }],
    color: generatePastelColor(),
  };

  horarios.asignaturas.push(subject);

  updateSubjectsAndSchedules();

  // Poner el nuevo horario en estado de edición
  editingSchedule(horarios.asignaturas.length - 1, 0);

  // Cargar el nuevo horario
  loadSchedule();

  document.getElementById("newSubjectName").value = "";
}

function updateSubjectsAndSchedules() {
  const subjectsAndSchedulesDiv = document.getElementById(
    "subjectsAndSchedules"
  );
  subjectsAndSchedulesDiv.innerHTML = "";
  horarios.asignaturas.forEach((subject, subjectIndex) => {
    const parentDiv = document.createElement("div");
    const subjectChip = document.createElement("div");
    subjectChip.classList.add("chip");
    subjectChip.style.backgroundColor = subject.color;
    subjectChip.style.color = "black";
    subjectChip.textContent = subject.subjectName;
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
    disableIcon.textContent = "🛇";
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
        loadSchedule();
      });

      const closeIcon = document.createElement("span");
      closeIcon.classList.add("close-icon");
      closeIcon.textContent = "x";
      closeIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteSchedule(subjectIndex, scheduleIndex);
      });

      const disableIcon = document.createElement("span");
      disableIcon.classList.add("disable-icon");
      disableIcon.textContent = "🛇";
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
    addScheduleChip.textContent = "Añadir Horario";
    addScheduleChip.addEventListener("click", () => {
      addSchedule(subjectIndex);
    });

    parentDiv.appendChild(addScheduleChip);
    subjectsAndSchedulesDiv.appendChild(parentDiv);
    subjectsAndSchedulesDiv.appendChild(document.createElement("hr"));
  });
}

function deleteSubject(subjectIndex) {
  horarios.asignaturas.splice(subjectIndex, 1);
  updateSubjectsAndSchedules();
}

function deleteSchedule(subjectIndex, scheduleIndex) {
  horarios.asignaturas[subjectIndex].schedules.splice(scheduleIndex, 1);
  updateSubjectsAndSchedules();
}

function addSchedule(subjectIndex) {
  horarios.asignaturas[subjectIndex].schedules.push({ days: {} });

  updateSubjectsAndSchedules();

  // Poner el nuevo horario en estado de edición
  editingSchedule(
    subjectIndex,
    horarios.asignaturas[subjectIndex].schedules.length - 1
  );

  // Cargar el nuevo horario
  loadSchedule();
  
}

function editingSchedule(subjectIndex, scheduleIndex) {
  const editingChips = document.querySelectorAll(".chip.editing");

  editingChips.forEach((chip) => {
    chip.classList.remove("editing");
  });

  const selectedScheduleChip = document.querySelector(
    `#scheduleChip-${subjectIndex}-${scheduleIndex}`
  );

  // Verifica si el chip seleccionado está inactivo
  if (
    selectedScheduleChip &&
    selectedScheduleChip.classList.contains("inactive")
  ) {
    return; // Si el chip está inactivo, retorna y no hagas nada más
  }

  selectedSubjectIndex = subjectIndex;
  selectedScheduleIndex = scheduleIndex;

  if (selectedScheduleChip) {
    selectedScheduleChip.classList.add("editing");
  }
}

function deactivateSubject(subjectIndex) {
  const selectedSubjectChip = document.querySelector(
    `#subjectChip-${subjectIndex}`
  );

  selectedSubjectIndex = subjectIndex;
  selectedScheduleIndex = null;

  if (selectedSubjectChip) {
    if (selectedSubjectChip.classList.contains("inactive")) {
      selectedSubjectChip.classList.remove("inactive");

      // Desactivar todos los horarios de esta asignatura
      horarios.asignaturas[subjectIndex].schedules.forEach(
        (_, scheduleIndex) => {
          const selectedScheduleChip = document.querySelector(
            `#scheduleChip-${subjectIndex}-${scheduleIndex}`
          );
          if (selectedScheduleChip) {
            selectedScheduleChip.classList.remove("inactive");
          }
        }
      );
    } else {
      selectedSubjectChip.classList.add("inactive");

      horarios.asignaturas[subjectIndex].schedules.forEach(
        (_, scheduleIndex) => {
          const selectedScheduleChip = document.querySelector(
            `#scheduleChip-${subjectIndex}-${scheduleIndex}`
          );
          if (selectedScheduleChip) {
            selectedScheduleChip.classList.add("inactive");
          }
        }
      );
    }
  }
}

function deactivateSchedule(subjectIndex, scheduleIndex) {
  const selectedScheduleChip = document.querySelector(
    `#scheduleChip-${subjectIndex}-${scheduleIndex}`
  );

  selectedSubjectIndex = subjectIndex;
  selectedScheduleIndex = scheduleIndex;

  if (selectedScheduleChip) {
    if (selectedScheduleChip.classList.contains("editing")) {
      selectedScheduleChip.classList.remove("editing");
    }
    if (selectedScheduleChip.classList.contains("inactive")) {
      selectedScheduleChip.classList.remove("inactive");
    } else {
      selectedScheduleChip.classList.add("inactive");
    }
  }
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  if (combinedSchedulesContainer.innerHTML !== "") {
    generateCombinedSchedules();
  }
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
        if (!Array.isArray(data.asignaturas)) {
          throw new Error("Formato no válido");
        }

        // Si la validación es exitosa, reemplazar el objeto horarios
        horarios.asignaturas = data.asignaturas;

        // Actualizar el selector de asignaturas
        updateSubjectSelect();
      } catch (error) {
        alert("El archivo no tiene el formato adecuado.");
      }
    };

    reader.readAsText(file);
  } else {
    // Limpiar el nombre del archivo en caso de que no haya archivo seleccionado
    fileNameElement.textContent = "";
  }
}

//parte de generar las combinaciones de horarios

let subjectColors = {};

function getActiveSubjectsAndSchedules() {
  let activeSubjects = [];
  horarios.asignaturas.forEach((subject, subjectIndex) => {
    let activeSchedules = [];
    const subjectChip = document.querySelector(`#subjectChip-${subjectIndex}`);
    if (!subjectChip.classList.contains("inactive")) {
      subject.schedules.forEach((schedule, scheduleIndex) => {
        const scheduleChip = document.querySelector(
          `#scheduleChip-${subjectIndex}-${scheduleIndex}`
        );
        if (!scheduleChip.classList.contains("inactive")) {
          activeSchedules.push(schedule);
        }
      });
      if (activeSchedules.length > 0) {
        activeSubjects.push({
          subjectName: subject.subjectName,
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
    console.log(subjects[index].color);
    let scheduleWithSubjectName = {
      ...subjects[index].schedules[i],
      subjectName: subjects[index].subjectName,
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
          cellContent.push(schedule.subjectName);
          subjectsInCell++;

          // Asignar un color si no se ha asignado antes
          /* if (!subjectColors[schedule.subjectName]) {
            subjectColors[schedule.subjectName] = generatePastelColor();
          } */
          console.log(schedule.color);
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
  cell.classList.toggle("selected");
  //guardar horario
  saveSchedule();
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

      cell.addEventListener("mouseup", (e) => {
        isDragging = false;
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  createInitialTable();
});

/* document.getElementById('numberOfSchedules').addEventListener('change', function() {
    if (this.value < 1) {
        this.value = 1;
    }
});
 */
