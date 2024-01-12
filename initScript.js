import { SubjectManager } from "./classes.js";
import {
  toggleConflictSchedules,
  generateCombinedSchedules,
} from "./combinations.js";
import { createInitialTable } from "./createTables.js";
import { createSubject } from "./UI.js";
import { saveToFile, loadFromFile } from "./files.js";

function initListeners(subjectManager) {
  const createSubjectButton = document.getElementById("createSubjectButton");
  const saveToFileButton = document.getElementById("saveToFileButton");
  const fileInput = document.getElementById("fileInput");
  const generateCombinedSchedulesButton = document.getElementById(
    "generateCombinedSchedulesButton"
  );
  const toggleConflicts = document.getElementById("toggleConflicts");

  createSubjectButton.addEventListener("click", () =>
    createSubject(subjectManager)
  );
  saveToFileButton.addEventListener("click", () => saveToFile(subjectManager));
  fileInput.addEventListener("change", () => loadFromFile(subjectManager));
  generateCombinedSchedulesButton.addEventListener("click", () =>
    generateCombinedSchedules(subjectManager)
  );
  toggleConflicts.addEventListener("change", toggleConflictSchedules);
}

function initApp() {
  const horario = new SubjectManager();
  createInitialTable(horario);

  document.addEventListener("DOMContentLoaded", () => {
    initListeners(horario);
  });
}

initApp();
