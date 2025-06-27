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
import { apiService } from "./api.js";
import { authComponent } from "./auth.js";

function initDashboardListeners(scenarioManager) {
  const createButton = document.getElementById("create-scenario-button");
  const nameInput = document.getElementById("new-scenario-name");
  const saveButton = document.getElementById("save-all-button");
  const fileInput = document.getElementById("file-input");

  createButton.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (name) {
      scenarioManager.addScenario(name);
      nameInput.value = "";
      // Auto-save when creating new scenario
      apiService.scheduleAutoSave(scenarioManager);
      await showPlanningView(scenarioManager);
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
    .addEventListener("click", async () => await generateCombinedSchedules(scenarioManager));
  document
    .getElementById("toggleConflicts")
    .addEventListener("change", toggleConflictSchedules);
  document
    .getElementById("back-to-dashboard-button")
    .addEventListener("click", async () => showDashboard(scenarioManager));
}

async function initApp() {
  const scenarioManager = new ScenarioManager();
  
  // Initialize authentication UI
  authComponent.initAuthUI();
  
  // Try to load user's data from server if authenticated
  await loadUserDataIfAuthenticated(scenarioManager);
  
  initDashboardListeners(scenarioManager);
  initPlanningViewListeners(scenarioManager);
  
  // Set up auto-save triggers
  setupAutoSaveTriggers(scenarioManager);
  
  // Set up auth change listener
  authComponent.onAuthChange(async () => {
    await loadUserDataIfAuthenticated(scenarioManager);
    showDashboard(scenarioManager);
  });
  
  showDashboard(scenarioManager);
}

async function loadUserDataIfAuthenticated(scenarioManager) {
  if (apiService.isAuthenticated()) {
    try {
      // Try to get current user info
      const user = await apiService.getCurrentUser();
      if (user) {
        // Load schedule data from server
        const scheduleData = await apiService.loadScheduleData();
        if (scheduleData && scheduleData.scenarios) {
          // Merge server data with scenario manager
          Object.assign(scenarioManager, ScenarioManager.fromJSON(scheduleData));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
}

function setupAutoSaveTriggers(scenarioManager) {
  // Override ScenarioManager methods to trigger auto-save
  const originalAddScenario = scenarioManager.addScenario.bind(scenarioManager);
  const originalDeleteScenario = scenarioManager.deleteScenario.bind(scenarioManager);
  const originalSetActiveScenario = scenarioManager.setActiveScenario.bind(scenarioManager);

  scenarioManager.addScenario = function(name) {
    const result = originalAddScenario(name);
    apiService.scheduleAutoSave(this);
    return result;
  };

  scenarioManager.deleteScenario = function(index) {
    const result = originalDeleteScenario(index);
    apiService.scheduleAutoSave(this);
    return result;
  };

  scenarioManager.setActiveScenario = function(index) {
    const result = originalSetActiveScenario(index);
    apiService.scheduleAutoSave(this);
    return result;
  };
}

// DOMContentLoaded event listener to ensure all elements are available
document.addEventListener("DOMContentLoaded", initApp);
