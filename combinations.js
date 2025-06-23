import { TimeTable } from "./classes.js";
import { createScheduleTable } from "./createTables.js";
import { toPng } from "html-to-image";

export function generateCombinedSchedules(subjectManager) {
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  combinedSchedulesContainer.innerHTML = "";

  const activeSubjects = getActiveSubjectsAndClassTimes(subjectManager);

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
    header.textContent = `Horario ${index + 1}${
      hasConflict ? " (Cruce de Horarios)" : ""
    }`;

    // Crea un botón de descarga
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Descargar Imagen";
    downloadButton.onclick = function () {
      // Clonar la tabla para aplicar estilos temporales
      const clone = table.cloneNode(true);
      clone.style.background = "white";
      clone.style.width = table.offsetWidth + "px";
      document.body.appendChild(clone);
    
      toPng(clone, {
        pixelRatio: 3, // Aumentar resolución (3x)
        backgroundColor: "white"
      }).then(function (dataUrl) {
        let link = document.createElement("a");
        link.download = `horario-combinado-${index + 1}.png`;
        link.href = dataUrl;
        link.click();
        document.body.removeChild(clone); // Eliminar el clon
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

function getActiveSubjectsAndClassTimes(subjectManager) {
  let activeSubjects = [];
  subjectManager.subjects.forEach((subject) => {
    let activeClassTimes = [];
    if (subject.isActive) {
      subject.classTimes.forEach((classTime) => {
        if (classTime.isActive && !isClassTimeEmpty(classTime)) {
          activeClassTimes.push(classTime);
        }
      });
      if (activeClassTimes.length > 0) {
        activeSubjects.push({
          name: subject.name,
          classTimes: activeClassTimes,
          color: subject.color,
        });
      }
    }
  });
  return activeSubjects;
}

function isClassTimeEmpty(classTime) {
  for (let day in classTime.timeTable) {
    for (let timeSlot in classTime.timeTable[day]) {
      if (classTime.timeTable[day][timeSlot] === "x") {
        return false;
      }
    }
  }
  return true;
}

function getAllCombinations(
  subjects,
  index,
  currentClassTime = [],
  allCombinations = []
) {
  if (index >= subjects.length) {
    allCombinations.push(currentClassTime.slice());
    return;
  }

  for (const classTime of subjects[index].classTimes) {
    let classTimeWithSubjectName = {
      ...classTime,
      name: subjects[index].name,
      color: subjects[index].color,
      totalClassTimes: subjects[index].classTimes.length,
    };
    currentClassTime.push(classTimeWithSubjectName);
    getAllCombinations(subjects, index + 1, currentClassTime, allCombinations);
    currentClassTime.pop();
  }
  return allCombinations;
}

function populateScheduleTable(table, schedules) {
  let hasScheduleConflict = false;

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const day = TimeTable.days[j - 1];
      const timeSlot = TimeTable.timeSlots[i - 1];

      let cellContent = [];
      let subjectsInCell = 0;
      let cellColor;

      schedules.forEach((schedule) => {
        if (
          schedule.timeTable[day] &&
          schedule.timeTable[day][timeSlot] === "x"
        ) {
          const scheduleLabel =
            schedule.totalSchedules > 1
              ? schedule.name + " H" + (schedule.index + 1)
              : schedule.name;
          cellContent.push(scheduleLabel);
          subjectsInCell++;
          cellColor = schedule.color;
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

export function toggleConflictSchedules() {
  const showConflicts = document.getElementById("toggleConflicts").checked;
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  const tables = combinedSchedulesContainer.getElementsByTagName("table");
  const conflictLabel = document.getElementById("conflictLabel");

  // Cambia el texto del label según el estado del checkbox
  if (showConflicts) {
    conflictLabel.textContent = "Mostrar horarios con cruces:";
  } else {
    conflictLabel.textContent = "Ocultar horarios con cruces:";
  }

  for (let table of tables) {
    if (table.classList.contains("hasConflict") && showConflicts) {
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

export function updateCombinedSchedules(subjectManager) {
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  if (combinedSchedulesContainer.innerHTML !== "") {
    generateCombinedSchedules(subjectManager);
  }
}
