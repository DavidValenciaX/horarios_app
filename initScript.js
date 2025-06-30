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
  const createButton = document.getElementById("create-schedule-button");
  const nameInput = document.getElementById("new-schedule-name");
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

function updateDashboardStats(scheduleManager) {
  const totalSchedules = scheduleManager.schedules.length;
  let totalActivities = 0;
  let activeActivities = 0;

  scheduleManager.schedules.forEach(schedule => {
    totalActivities += schedule.activityManager.activities.length;
    activeActivities += schedule.activityManager.activities.filter(activity => activity.isActive).length;
  });

  // Update stat cards with animation
  const totalSchedulesEl = document.getElementById("total-schedules");
  const totalActivitiesEl = document.getElementById("total-activities");
  const activeActivitiesEl = document.getElementById("active-activities");

  if (totalSchedulesEl) animateNumber(totalSchedulesEl, totalSchedules);
  if (totalActivitiesEl) animateNumber(totalActivitiesEl, totalActivities);
  if (activeActivitiesEl) animateNumber(activeActivitiesEl, activeActivities);
}

function animateNumber(element, targetNumber) {
  const currentNumber = parseInt(element.textContent) || 0;
  const increment = targetNumber > currentNumber ? 1 : -1;
  const duration = 500; // ms
  const steps = Math.abs(targetNumber - currentNumber);
  const stepDuration = steps > 0 ? duration / steps : 0;

  if (steps === 0) return;

  let current = currentNumber;
  const timer = setInterval(() => {
    current += increment;
    element.textContent = current;
    
    if (current === targetNumber) {
      clearInterval(timer);
    }
  }, stepDuration);
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
  
  // Override showDashboard to update stats
  const originalShowDashboard = showDashboard;
  window.showDashboard = function(sm) {
    originalShowDashboard(sm);
    updateDashboardStats(sm);
  };
  
  showDashboard(scheduleManager);
  updateDashboardStats(scheduleManager);
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
  // Override ScheduleManager methods to trigger auto-save and stats update
  const originalAddSchedule = scheduleManager.addSchedule.bind(scheduleManager);
  const originalDeleteSchedule = scheduleManager.deleteSchedule.bind(scheduleManager);
  const originalSetActiveSchedule = scheduleManager.setActiveSchedule.bind(scheduleManager);

  scheduleManager.addSchedule = function(name) {
    const result = originalAddSchedule(name);
    apiService.scheduleAutoSave(this);
    updateDashboardStats(this);
    return result;
  };

  scheduleManager.deleteSchedule = function(index) {
    const result = originalDeleteSchedule(index);
    apiService.scheduleAutoSave(this);
    updateDashboardStats(this);
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