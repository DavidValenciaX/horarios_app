import { ScenarioManager } from "./classes.js";
import {
  toggleConflictSchedules,
  generateCombinedSchedules,
} from "./combinations.js";
import {
  createActivity,
  showDashboard,
  showPlanningView,
} from "./UI.js";
import { saveToFile, loadFromFile } from "./files.js";

function initDashboardListeners(scenarioManager) {
  const createButton = document.getElementById("create-scenario-button");
  const nameInput = document.getElementById("new-scenario-name");
  const saveButton = document.getElementById("save-all-button");
  const fileInput = document.getElementById("file-input");

  createButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (name) {
      scenarioManager.addScenario(name);
      nameInput.value = "";
      showPlanningView(scenarioManager);
    } else {
      alert("Por favor, introduce un nombre para el escenario.");
    }
  });

  saveButton.addEventListener("click", () => saveToFile(scenarioManager));
  fileInput.addEventListener("change", () => loadFromFile(scenarioManager));
}

function initPlanningViewListeners(scenarioManager) {
  document
    .getElementById("createActivityButton")
    .addEventListener("click", () => createActivity(scenarioManager));
  document
    .getElementById("generateCombinedSchedulesButton")
    .addEventListener("click", () => generateCombinedSchedules(scenarioManager));
  document
    .getElementById("toggleConflicts")
    .addEventListener("change", toggleConflictSchedules);
  document
    .getElementById("back-to-dashboard-button")
    .addEventListener("click", () => showDashboard(scenarioManager));
}

function initApp() {
  const scenarioManager = new ScenarioManager();
  
  initDashboardListeners(scenarioManager);
  initPlanningViewListeners(scenarioManager);
  
  showDashboard(scenarioManager);
}

// DOMContentLoaded event listener to ensure all elements are available
document.addEventListener("DOMContentLoaded", initApp);
