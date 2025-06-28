import { createInitialTable, loadActivityScheduleOption } from "./createTables.js";
import { updateCombinedSchedules } from "./combinations.js";
import generatePastelColor from "./colors.js";
import "./components/eye-open-icon.js";
import "./components/eye-off-icon.js";
import "./components/arrow-left-icon.js";
import { apiService } from "./api.js";

const DOM = {
  dashboard: document.getElementById("dashboard"),
  mainContent: document.getElementById("main-content"),
  scheduleList: document.getElementById("scenario-list"),
  scheduleTitle: document.getElementById("scenario-title"),
  activitiesAndActivityScheduleOptionsDiv: document.getElementById(
    "activitiesAndScheduleOptions"
  ),
  newActivityName: document.getElementById("newActivityName"),
  combinedSchedulesContainer: document.getElementById("combinedSchedulesContainer"),
};

export function showDashboard(scheduleManager) {
  DOM.dashboard.style.display = "block";
  DOM.mainContent.style.display = "none";
  renderDashboard(scheduleManager);
}

export async function showPlanningView(scheduleManager) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) {
    showDashboard(scheduleManager);
    return;
  }
  DOM.dashboard.style.display = "none";
  DOM.mainContent.style.display = "block";
  DOM.scheduleTitle.textContent = activeSchedule.name;

  createInitialTable(scheduleManager);
  updateActivitiesAndActivityScheduleOptions(scheduleManager);
  loadActivityScheduleOption(scheduleManager);
  await updateCombinedSchedules(scheduleManager);
}

function renderDashboard(scheduleManager) {
  DOM.scheduleList.innerHTML = "";
  if (scheduleManager.schedules.length === 0) {
    DOM.scheduleList.innerHTML = "<p>No hay horarios. ¡Crea uno nuevo!</p>";
  }

  scheduleManager.schedules.forEach((schedule, index) => {
    const scheduleCard = document.createElement("div");
    scheduleCard.className = "scenario-card";
    
    const cardContent = document.createElement("div");
    cardContent.className = "scenario-card-content";
    cardContent.textContent = schedule.name;
    
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "×";
    deleteButton.className = "delete-button";
    deleteButton.setAttribute("aria-label", `Eliminar horario ${schedule.name}`);
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`¿Estás seguro de que quieres eliminar "${schedule.name}"?`)) {
        scheduleManager.deleteSchedule(index);
        renderDashboard(scheduleManager);
      }
    };

    scheduleCard.appendChild(cardContent);
    scheduleCard.appendChild(deleteButton);
    
    // Add click handler to the card content only
    cardContent.addEventListener("click", async () => {
      scheduleManager.setActiveSchedule(index);
      await showPlanningView(scheduleManager);
    });

    DOM.scheduleList.appendChild(scheduleCard);
  });
}

export function updateActivitiesAndActivityScheduleOptions(scheduleManager) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) return;
  const activityManager = activeSchedule.activityManager;

  DOM.activitiesAndActivityScheduleOptionsDiv.innerHTML = "";

  activityManager.activities.forEach((activity, activityIndex) => {
    const activityContainer = document.createElement("div");
    activityContainer.className = "activity-container";

    // Activity header chip
    const activityHeader = document.createElement("div");
    activityHeader.className = "activity-header";

    const activityChip = document.createElement("div");
    activityChip.classList.add("chip", "activity");
    activityChip.style.backgroundColor = activity.color;

    const activityContent = document.createElement("div");
    activityContent.className = "chip-content";
    activityContent.textContent = activity.name;

    const activityActions = document.createElement("div");
    activityActions.className = "chip-actions";

    // Toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "chip-action-btn toggle-btn";
    toggleBtn.setAttribute("aria-label", activity.isActive ? "Desactivar actividad" : "Activar actividad");
    
    const toggleIcon = document.createElement(activity.isActive ? "eye-open-icon" : "eye-off-icon");
    toggleIcon.classList.add("icon");
    toggleBtn.appendChild(toggleIcon);

    if (!activity.isActive) {
      toggleBtn.classList.add("inactive");
      activityChip.classList.add("inactive");
    }
          toggleBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await deactivateActivity(scheduleManager, activityIndex);
      });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "chip-action-btn delete-btn";
    deleteBtn.setAttribute("aria-label", "Eliminar actividad");
    deleteBtn.textContent = "×";
          deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de que quieres eliminar "${activity.name}"?`)) {
          await deleteActivity(scheduleManager, activityIndex);
        }
      });

    activityActions.appendChild(toggleBtn);
    activityActions.appendChild(deleteBtn);
    activityChip.appendChild(activityContent);
    activityChip.appendChild(activityActions);
    activityHeader.appendChild(activityChip);

    // Activity schedule options container
    const activityScheduleOptionsContainer = document.createElement("div");
    activityScheduleOptionsContainer.className = "schedule-options";

    activity.activityScheduleOptions.forEach((activityScheduleOption, activityScheduleOptionIndex) => {
      const activityScheduleOptionChip = document.createElement("div");
      activityScheduleOptionChip.classList.add("chip");
      
      const optionContent = document.createElement("div");
      optionContent.className = "chip-content";
      optionContent.textContent = `Opción ${activityScheduleOptionIndex + 1}`;

      const optionActions = document.createElement("div");
      optionActions.className = "chip-actions";

      if (activityScheduleOption.isEditing) {
        activityScheduleOptionChip.classList.add("editing");
      }

      if (!activityScheduleOption.isActive) {
        activityScheduleOptionChip.classList.add("inactive");
      }

      // Toggle button for activity schedule option
      const toggleOptionBtn = document.createElement("button");
      toggleOptionBtn.className = "chip-action-btn toggle-btn";
      toggleOptionBtn.setAttribute("aria-label", activityScheduleOption.isActive ? "Desactivar opción" : "Activar opción");
      
      const toggleOptionIcon = document.createElement(activityScheduleOption.isActive ? "eye-open-icon" : "eye-off-icon");
      toggleOptionIcon.classList.add("icon");
      toggleOptionBtn.appendChild(toggleOptionIcon);

      if (!activityScheduleOption.isActive) {
        toggleOptionBtn.classList.add("inactive");
      }
      toggleOptionBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await deactivateActivityScheduleOption(scheduleManager, activityIndex, activityScheduleOptionIndex);
      });

      // Delete button for activity schedule option
      const deleteOptionBtn = document.createElement("button");
      deleteOptionBtn.className = "chip-action-btn delete-btn";
      deleteOptionBtn.setAttribute("aria-label", "Eliminar opción de horario");
      deleteOptionBtn.textContent = "×";
      deleteOptionBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de que quieres eliminar la Opción ${activityScheduleOptionIndex + 1}?`)) {
          await deleteActivityScheduleOption(scheduleManager, activityIndex, activityScheduleOptionIndex);
        }
      });

      optionActions.appendChild(toggleOptionBtn);
      optionActions.appendChild(deleteOptionBtn);
      activityScheduleOptionChip.appendChild(optionContent);
      activityScheduleOptionChip.appendChild(optionActions);

      // Click handler for editing
      activityScheduleOptionChip.addEventListener("click", () => {
        editingActivityScheduleOption(scheduleManager, activityIndex, activityScheduleOptionIndex);
      });

      activityScheduleOptionsContainer.appendChild(activityScheduleOptionChip);
    });

    // Add activity schedule option button
    const addActivityScheduleOptionChip = document.createElement("div");
    addActivityScheduleOptionChip.classList.add("chip", "add-scheduleOption");
    addActivityScheduleOptionChip.textContent = "+ Agregar Opción de Horario";
    addActivityScheduleOptionChip.addEventListener("click", () => {
      addActivityScheduleOption(scheduleManager, activityIndex);
    });

    activityScheduleOptionsContainer.appendChild(addActivityScheduleOptionChip);

    activityContainer.appendChild(activityHeader);
    activityContainer.appendChild(activityScheduleOptionsContainer);
    DOM.activitiesAndActivityScheduleOptionsDiv.appendChild(activityContainer);
  });
}

export function createActivity(scheduleManager) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) return;
  const activityManager = activeSchedule.activityManager;

  const newActivityName = DOM.newActivityName.value.trim();

  if (!newActivityName) {
    alert("Por favor ingrese un nombre de actividad válido");
    return;
  }

  activityManager.addActivity(
    newActivityName,
    generatePastelColor(newActivityName)
  );

  updateActivitiesAndActivityScheduleOptions(scheduleManager);

  // Poner la primera hora de clase de la nueva asignatura en estado de edición
  editingActivityScheduleOption(
    scheduleManager,
    activityManager.activities.length - 1,
    0
  );

  DOM.newActivityName.value = "";
  
  // Auto-save when creating activity
  apiService.scheduleAutoSave(scheduleManager);
}

async function deactivateActivity(scheduleManager, activityIndex) {
  const activityManager = scheduleManager.getActiveSchedule().activityManager;
  activityManager.activities[activityIndex].deactivate();
  await updateCombinedSchedules(scheduleManager);
  updateActivitiesAndActivityScheduleOptions(scheduleManager);
  // Auto-save when deactivating activity
  apiService.scheduleAutoSave(scheduleManager);
}

async function deleteActivity(scheduleManager, activityIndex) {
  const activityManager = scheduleManager.getActiveSchedule().activityManager;
  let isAnyActivityScheduleOptionEditing = activityManager.activities[
    activityIndex
  ].activityScheduleOptions.some((activityScheduleOption) => activityScheduleOption.isEditing);
  const newActivityIndex = activityManager.deleteActivity(activityIndex);
  if (activityManager.activities.length <= 0) {
    createInitialTable(scheduleManager);
  } else if (isAnyActivityScheduleOptionEditing) {
    editingActivityScheduleOption(scheduleManager, newActivityIndex, 0);
  }

  await updateCombinedSchedules(scheduleManager);
  updateActivitiesAndActivityScheduleOptions(scheduleManager);
  // Auto-save when deleting activity
  apiService.scheduleAutoSave(scheduleManager);
}

function addActivityScheduleOption(scheduleManager, activityIndex) {
  const activityManager = scheduleManager.getActiveSchedule().activityManager;
  const activityScheduleOptionIndex =
    activityManager.activities[activityIndex].addActivityScheduleOption();
  updateActivitiesAndActivityScheduleOptions(scheduleManager);
  editingActivityScheduleOption(scheduleManager, activityIndex, activityScheduleOptionIndex);
  // Auto-save when adding activity schedule option
  apiService.scheduleAutoSave(scheduleManager);
}

async function deactivateActivityScheduleOption(
  scheduleManager,
  activityIndex,
  activityScheduleOptionIndex
) {
  const activityManager = scheduleManager.getActiveSchedule().activityManager;
  activityManager.activities[activityIndex].activityScheduleOptions[
    activityScheduleOptionIndex
  ].deactivate();
  await updateCombinedSchedules(scheduleManager);
  updateActivitiesAndActivityScheduleOptions(scheduleManager);
  // Auto-save when deactivating activity schedule option
  apiService.scheduleAutoSave(scheduleManager);
}

async function deleteActivityScheduleOption(
  scheduleManager,
  activityIndex,
  activityScheduleOptionIndex
) {
  const activityManager = scheduleManager.getActiveSchedule().activityManager;
  const activityScheduleOption =
    activityManager.activities[activityIndex].activityScheduleOptions[
      activityScheduleOptionIndex
    ];

  const newActivityScheduleOptionIndex = activityManager.activities[
    activityIndex
  ].deleteActivityScheduleOption(activityScheduleOptionIndex);
  if (activityManager.activities[activityIndex].activityScheduleOptions.length > 0) {
    if (activityScheduleOption.isEditing) {
      editingActivityScheduleOption(
        scheduleManager,
        activityIndex,
        newActivityScheduleOptionIndex
      );
    }
  } else {
    const newActivityIndex = activityManager.deleteActivity(activityIndex);
    if (activityManager.activities.length > 0) {
      if (activityScheduleOption.isEditing) {
        editingActivityScheduleOption(scheduleManager, newActivityIndex, 0);
      }
    } else {
      createInitialTable(scheduleManager);
    }
  }

  await updateCombinedSchedules(scheduleManager);
  updateActivitiesAndActivityScheduleOptions(scheduleManager);
  // Auto-save when deleting activity schedule option
  apiService.scheduleAutoSave(scheduleManager);
}

export function editingActivityScheduleOption(
  scheduleManager,
  activityIndex,
  activityScheduleOptionIndex
) {
  const activityManager = scheduleManager.getActiveSchedule().activityManager;
  if (
    !activityManager.activities[activityIndex]?.activityScheduleOptions[
      activityScheduleOptionIndex
    ]?.isActive
  ) {
    return;
  }

  activityManager.activities.forEach((activity) => {
    activity.activityScheduleOptions.forEach((activityScheduleOption) => {
      activityScheduleOption.stopEditing();
    });
  });

  activityManager.activities[activityIndex].activityScheduleOptions[
    activityScheduleOptionIndex
  ].edit();

  updateActivitiesAndActivityScheduleOptions(scheduleManager);
  loadActivityScheduleOption(scheduleManager);
}