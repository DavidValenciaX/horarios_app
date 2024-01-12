import { SubjectManager } from "./classes.js";
import {
  toggleConflictSchedules,
  generateCombinedSchedules,
} from "./combinations.js";
import { createInitialTable } from "./createTables.js";
import { createSubject } from "./UI.js";
import { saveToFile, loadFromFile } from "./files.js";

let createSubjectHandler;
let saveToFileHandler;
let loadFromFileHandler;
let generateCombinedSchedulesHandler;

export function updateEventHandlers(subjectManager) {
  createSubjectHandler = () => createSubject(subjectManager);
  saveToFileHandler = () => saveToFile(subjectManager);
  loadFromFileHandler = () => loadFromFile(subjectManager);
  generateCombinedSchedulesHandler = () =>
    generateCombinedSchedules(subjectManager);
}

export function initListeners() {
  const createSubjectButton = document.getElementById("createSubjectButton");
  const saveToFileButton = document.getElementById("saveToFileButton");
  const fileInput = document.getElementById("fileInput");
  const generateCombinedSchedulesButton = document.getElementById(
    "generateCombinedSchedulesButton"
  );

  createSubjectButton.addEventListener("click", createSubjectHandler);
  saveToFileButton.addEventListener("click", saveToFileHandler);
  fileInput.addEventListener("change", loadFromFileHandler);
  generateCombinedSchedulesButton.addEventListener(
    "click",
    generateCombinedSchedulesHandler
  );
}

document.addEventListener("DOMContentLoaded", () => {
  let horario = new SubjectManager();
  createInitialTable(horario);
  updateEventHandlers(horario);
  initListeners();
  document
    .getElementById("toggleConflicts")
    .addEventListener("change", toggleConflictSchedules);
});
