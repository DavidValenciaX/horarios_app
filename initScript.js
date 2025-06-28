import { ScheduleManager } from "./classes.js";
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

function initDashboardListeners(scheduleManager) {
  const createButton = document.getElementById("create-scenario-button");
  const nameInput = document.getElementById("new-scenario-name");
  const saveButton = document.getElementById("save-all-button");
  const fileInput = document.getElementById("file-input");

  createButton.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (name) {
      scheduleManager.addSchedule(name);
      nameInput.value = "";
      // Auto-save when creating new schedule
      apiService.scheduleAutoSave(scheduleManager);
      await showPlanningView(scheduleManager);
    } else {
      alert("Por favor, introduce un nombre para el horario.");
    }
  });

  saveButton.addEventListener("click", () => saveToFile(scheduleManager));
  fileInput.addEventListener("change", () => loadFromFile(scheduleManager));
}

function initPlanningViewListeners(scheduleManager) {
  document
    .getElementById("createActivityButton")
    .addEventListener("click", () => createActivity(scheduleManager));
  document
    .getElementById("generateCombinedSchedulesButton")
    .addEventListener("click", async () => await generateCombinedSchedules(scheduleManager));
  document
    .getElementById("toggleConflicts")
    .addEventListener("change", toggleConflictSchedules);
  document
    .getElementById("back-to-dashboard-button")
    .addEventListener("click", async () => showDashboard(scheduleManager));
}

async function initApp() {
  const scheduleManager = new ScheduleManager();
  
  // Initialize authentication UI
  authComponent.initAuthUI();
  
  // Try to load user's data from server if authenticated
  await loadUserDataIfAuthenticated(scheduleManager);
  
  initDashboardListeners(scheduleManager);
  initPlanningViewListeners(scheduleManager);
  
  // Set up auto-save triggers
  setupAutoSaveTriggers(scheduleManager);
  
  // Set up auth change listener
  authComponent.onAuthChange(async () => {
    await loadUserDataIfAuthenticated(scheduleManager);
    showDashboard(scheduleManager);
  });
  
  showDashboard(scheduleManager);
}

async function loadUserDataIfAuthenticated(scheduleManager) {
  if (apiService.isAuthenticated()) {
    try {
      // Try to get current user info
      const user = await apiService.getCurrentUser();
      if (user) {
        // Load schedule data from server
        const scheduleData = await apiService.loadScheduleData();
        if (scheduleData?.schedules) {
          // Merge server data with schedule manager
          Object.assign(scheduleManager, ScheduleManager.fromJSON(scheduleData));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  } else {
    // User is not authenticated, clear all schedule data
    scheduleManager.schedules = [];
    scheduleManager.activeScheduleIndex = -1;
  }
}

function setupAutoSaveTriggers(scheduleManager) {
  // Override ScheduleManager methods to trigger auto-save
  const originalAddSchedule = scheduleManager.addSchedule.bind(scheduleManager);
  const originalDeleteSchedule = scheduleManager.deleteSchedule.bind(scheduleManager);
  const originalSetActiveSchedule = scheduleManager.setActiveSchedule.bind(scheduleManager);

  scheduleManager.addSchedule = function(name) {
    const result = originalAddSchedule(name);
    apiService.scheduleAutoSave(this);
    return result;
  };

  scheduleManager.deleteSchedule = function(index) {
    const result = originalDeleteSchedule(index);
    apiService.scheduleAutoSave(this);
    return result;
  };

  scheduleManager.setActiveSchedule = function(index) {
    const result = originalSetActiveSchedule(index);
    apiService.scheduleAutoSave(this);
    return result;
  };
}

// DOMContentLoaded event listener to ensure all elements are available
document.addEventListener("DOMContentLoaded", initApp);
