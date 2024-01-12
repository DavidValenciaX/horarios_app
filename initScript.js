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

    const handleCreateSubject = () => createSubject(horario);
    const handleSaveToFile = () => saveToFile(horario);
    const handleLoadFromFile = () => loadFromFile(horario);
    const handleGenerateCombinedSchedules = () =>
      generateCombinedSchedules(horario);

    createSubjectButton.addEventListener("click", handleCreateSubject);
    saveToFileButton.addEventListener("click", handleSaveToFile);
    fileInput.addEventListener("change", handleLoadFromFile);
    generateCombinedSchedulesButton.addEventListener(
      "click",
      handleGenerateCombinedSchedules
    );

    document
      .getElementById("toggleConflicts")
      .addEventListener("change", toggleConflictSchedules);
  });
}

initApp();
