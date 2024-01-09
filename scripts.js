import { TimeTable, SubjectManager } from "./subjects.js";
import generatePastelColor from "./colors.js";
import {
  toggleConflictSchedules,
  generateCombinedSchedules,
} from "./combinations.js";
import { createInitialTable } from "./createTables.js";

let horarios = new SubjectManager();

function createSubject() {
  const newSubjectName = document.getElementById("newSubjectName").value;
  let subjectCredits = document.getElementById("subjectCredits").value;

  if (!newSubjectName) {
    alert("Por favor ingrese un nombre de asignatura válido");
    return;
  }

  if (!subjectCredits || isNaN(subjectCredits)) {
    alert("Por favor ingrese la cantidad de créditos");
    return;
  }

  // Convertir a número y validar el rango
  subjectCredits = Number(subjectCredits);
  if (subjectCredits < 0 || subjectCredits > 10) {
    alert("Por favor ingrese un valor de créditos entre 0 y 10");
    return;
  }

  horarios.addSubject(
    newSubjectName,
    generatePastelColor(newSubjectName),
    subjectCredits
  );

  updateSubjectsAndSchedules();

  // Poner el primer horario de la nueva asignatura en estado de edición
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

  let textColor = sumCredits > 20 ? "red" : "inherit";

  showCredits.innerHTML =
    sumCredits > 0
      ? `<h4 style="color: ${textColor};">Suma de creditos: ${sumCredits}</h4>`
      : "";
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
    subjectChip.classList.add("chip", "subject");
    subjectChip.style.backgroundColor = subject.color;
    subjectChip.addEventListener("click", () => {
      editingSchedule(subjectIndex, 0);
    });
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
  sumCredits();
}

function addSchedule(subjectIndex) {
  const scheduleIndex = horarios.subjects[subjectIndex].addSchedule();
  updateSubjectsAndSchedules();
  // Poner el nuevo horario en estado de edición
  editingSchedule(subjectIndex, scheduleIndex);
}

function editingSchedule(subjectIndex, scheduleIndex) {
  // Verifica si el horario seleccionado está inactivo
  if (!horarios.subjects[subjectIndex].schedules[scheduleIndex].isActive) {
    return; // Si el horario está inactivo, retorna y no hagas nada más
  }

  // Asegúrate de que todos los horarios no estén siendo editados
  horarios.subjects.forEach((subject) => {
    subject.schedules.forEach((schedule) => {
      schedule.stopEditing();
    });
  });

  // Edita el horario seleccionado
  horarios.subjects[subjectIndex].schedules[scheduleIndex].edit();

  updateSubjectsAndSchedules();

  loadSchedule();
}

function updateCombinedSchedules() {
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  if (combinedSchedulesContainer.innerHTML !== "") {
    generateCombinedSchedules();
  }
}

function deactivateSubject(subjectIndex) {
  horarios.subjects[subjectIndex].deactivate();

  updateCombinedSchedules();

  updateSubjectsAndSchedules();
}

function deactivateSchedule(subjectIndex, scheduleIndex) {
  // Cambia el estado del horario
  horarios.subjects[subjectIndex].schedules[scheduleIndex].deactivate();

  updateCombinedSchedules();

  updateSubjectsAndSchedules();
}

function deleteSubject(subjectIndex) {
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

  updateCombinedSchedules();

  updateSubjectsAndSchedules();
}

function deleteSchedule(subjectIndex, scheduleIndex) {
  const schedule = horarios.subjects[subjectIndex].schedules[scheduleIndex];

  const newScheduleIndex =
    horarios.subjects[subjectIndex].deleteSchedule(scheduleIndex);
  if (horarios.subjects[subjectIndex].schedules.length > 0) {
    if (schedule.isEditing) {
      // Si todavía hay horarios para esta asignatura, editamos el siguiente horario
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

  updateCombinedSchedules();

  updateSubjectsAndSchedules();
}
//parte de guardar y cargar el horario de la tabla

//función que carga la tabla con las horas de clase
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

//función para guardar las horas de clase de la tabla
function saveSchedule() {
  let editingSchedule;

  // Busca el horario que se está editando
  horarios.subjects.forEach((subject) => {
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

async function saveToFile() {
  const dataStr = JSON.stringify(horarios);
  const dataBlob = new Blob([dataStr], {
    type: "application/json;charset=utf-8",
  });

  // Verificar si showSaveFilePicker está disponible
  if (window.showSaveFilePicker) {
    try {
      // Configuración para el archivo a guardar
      const options = {
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
        suggestedName: "horarios.json",
      };

      // Mostrar el cuadro de diálogo para guardar el archivo
      const fileHandle = await window.showSaveFilePicker(options);
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(dataBlob);
      await writableStream.close();
      alert("Archivo guardado con éxito.");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el archivo.");
    }
  } else {
    // Método clásico para navegadores que no soportan showSaveFilePicker
    const dataUrl = URL.createObjectURL(dataBlob);

    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = dataUrl;
    downloadAnchor.download = "horarios.json";
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }
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
        horarios = SubjectManager.fromJSON(data);

        // Actualizar el selector de asignaturas
        updateSubjectsAndSchedules();

        loadSchedule();
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
  for (let day in schedule.timeTable) {
    for (let timeSlot in schedule.timeTable[day]) {
      if (schedule.timeTable[day][timeSlot] === "x") {
        return false;
      }
    }
  }
  return true;
}

export function getActiveSubjectsAndSchedules() {
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

export function toggleCell(cell) {
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

  if (!editingSchedule) {
    alert("Selecciona primero una asignatura y un horario");
    return;
  }

  const selectedColor = editingSubject.color;

  cell.classList.toggle("selected");

  cell.style.backgroundColor = cell.style.backgroundColor ? "" : selectedColor;

  //guardar horario
  saveSchedule();

  updateCombinedSchedules();
}

function initListeners() {
  document
    .getElementById("createSubjectButton")
    .addEventListener("click", createSubject);
  document
    .getElementById("saveToFileButton")
    .addEventListener("click", saveToFile);
  document.getElementById("fileInput").addEventListener("change", loadFromFile);
  document
    .getElementById("generateCombinedSchedulesButton")
    .addEventListener("click", generateCombinedSchedules);
  document
    .getElementById("toggleConflicts")
    .addEventListener("change", toggleConflictSchedules);
}

document.addEventListener("DOMContentLoaded", () => {
  createInitialTable();
  initListeners();
});
