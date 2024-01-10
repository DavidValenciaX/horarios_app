import { SubjectManager } from "./classes.js";
import generatePastelColor from "./colors.js";
import {
  toggleConflictSchedules,
  generateCombinedSchedules,
} from "./combinations.js";
import { createInitialTable } from "./createTables.js";
import { editingSchedule, updateSubjectsAndSchedules } from "./UI.js";
import { saveToFile, loadFromFile } from "./files.js";

function createSubject(subjectManager) {
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

  subjectManager.addSubject(
    newSubjectName,
    generatePastelColor(newSubjectName),
    subjectCredits
  );

  updateSubjectsAndSchedules(subjectManager);

  // Poner el primer horario de la nueva asignatura en estado de edición
  editingSchedule(subjectManager, subjectManager.subjects.length - 1, 0);

  document.getElementById("newSubjectName").value = "";
  document.getElementById("subjectCredits").value = "";
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

export function getActiveSubjectsAndSchedules(subjectManager) {
  let activeSubjects = [];
  subjectManager.subjects.forEach((subject) => {
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

function initListeners(subjectManager) {
  document
    .getElementById("createSubjectButton")
    .addEventListener("click", () => createSubject(subjectManager));
  document
    .getElementById("saveToFileButton")
    .addEventListener("click", () => saveToFile(subjectManager));
  document
    .getElementById("fileInput")
    .addEventListener("change", () => loadFromFile(subjectManager));
  document
    .getElementById("generateCombinedSchedulesButton")
    .addEventListener("click", () => generateCombinedSchedules(subjectManager));
  document
    .getElementById("toggleConflicts")
    .addEventListener("change", toggleConflictSchedules);
}

document.addEventListener("DOMContentLoaded", () => {
  let horario = new SubjectManager();
  createInitialTable(horario);
  initListeners(horario);
});
