import { SubjectManager } from "./classes.js";
import {
  toggleConflictSchedules,
  generateCombinedSchedules,
} from "./combinations.js";
import { createInitialTable } from "./createTables.js";
import { createSubject } from "./UI.js";
import { saveToFile, loadFromFile } from "./files.js";

export function initApp() {
  const horario = new SubjectManager();
  createInitialTable(horario);

  document.addEventListener("DOMContentLoaded", () => {
    const createSubjectButton = document.getElementById("createSubjectButton");
    const saveToFileButton = document.getElementById("saveToFileButton");
    const fileInput = document.getElementById("fileInput");
    const generateCombinedSchedulesButton = document.getElementById(
      "generateCombinedSchedulesButton"
    );
    const toggleConflicts = document.getElementById("toggleConflicts");

    createSubjectButton.addEventListener("click", () => createSubject(horario));
    saveToFileButton.addEventListener("click", () => saveToFile(horario));
    fileInput.addEventListener("change", () => loadFromFile(horario));
    generateCombinedSchedulesButton.addEventListener("click", () =>
      generateCombinedSchedules(horario)
    );
    toggleConflicts.addEventListener("change", toggleConflictSchedules);
  });
}

initApp();
