import { ActivityManager } from "./classes.js";
import {
  toggleConflictSchedules,
  generateCombinedSchedules,
} from "./combinations.js";
import { createInitialTable } from "./createTables.js";
import { createActivity } from "./UI.js";
import { saveToFile, loadFromFile } from "./files.js";

function initListeners(activityManager) {
  const createActivityButton = document.getElementById("createActivityButton");
  const saveToFileButton = document.getElementById("saveToFileButton");
  const fileInput = document.getElementById("fileInput");
  const generateCombinedSchedulesButton = document.getElementById(
    "generateCombinedSchedulesButton"
  );
  const toggleConflicts = document.getElementById("toggleConflicts");

  createActivityButton.addEventListener("click", () =>
    createActivity(activityManager)
  );
  saveToFileButton.addEventListener("click", () => saveToFile(activityManager));
  fileInput.addEventListener("change", () => loadFromFile(activityManager));
  generateCombinedSchedulesButton.addEventListener("click", () =>
    generateCombinedSchedules(activityManager)
  );
  toggleConflicts.addEventListener("change", toggleConflictSchedules);
}

function initApp() {
  const horario = new ActivityManager();
  createInitialTable(horario);

  document.addEventListener("DOMContentLoaded", () => {
    initListeners(horario);
  });
}

initApp();
