import { SubjectManager } from "./classes.js";
import {
  toggleConflictSchedules,
  generateCombinedSchedules,
} from "./combinations.js";
import { createInitialTable } from "./createTables.js";
import { createSubject } from "./UI.js";
import { saveToFile, loadFromFile } from "./files.js";

export function initListeners(subjectManager) {
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
