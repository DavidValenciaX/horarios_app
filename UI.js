import { createInitialTable, loadScheduleOption } from "./createTables.js";
import { updateCombinedSchedules } from "./combinations.js";
import generatePastelColor from "./colors.js";

const DOM = {
  dashboard: document.getElementById("dashboard"),
  mainContent: document.getElementById("main-content"),
  scenarioList: document.getElementById("scenario-list"),
  scenarioTitle: document.getElementById("scenario-title"),
  activitiesAndScheduleOptionsDiv: document.getElementById(
    "activitiesAndScheduleOptions"
  ),
  newActivityName: document.getElementById("newActivityName"),
  combinedSchedulesContainer: document.getElementById("combinedSchedulesContainer"),
};

export function showDashboard(scenarioManager) {
  DOM.dashboard.style.display = "block";
  DOM.mainContent.style.display = "none";
  renderDashboard(scenarioManager);
}

export function showPlanningView(scenarioManager) {
  const activeScenario = scenarioManager.getActiveScenario();
  if (!activeScenario) {
    showDashboard(scenarioManager);
    return;
  }
  DOM.dashboard.style.display = "none";
  DOM.mainContent.style.display = "block";
  DOM.scenarioTitle.textContent = activeScenario.name;

  createInitialTable(scenarioManager);
  updateActivitiesAndScheduleOptions(scenarioManager);
  loadScheduleOption(scenarioManager);
  updateCombinedSchedules(scenarioManager);
}

function renderDashboard(scenarioManager) {
  DOM.scenarioList.innerHTML = "";
  if (scenarioManager.scenarios.length === 0) {
    DOM.scenarioList.innerHTML = "<p>No hay escenarios. ¡Crea uno nuevo!</p>";
  }

  scenarioManager.scenarios.forEach((scenario, index) => {
    const scenarioCard = document.createElement("div");
    scenarioCard.className = "scenario-card";
    
    const cardContent = document.createElement("div");
    cardContent.className = "scenario-card-content";
    cardContent.textContent = scenario.name;
    
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "×";
    deleteButton.className = "delete-button";
    deleteButton.setAttribute("aria-label", `Eliminar escenario ${scenario.name}`);
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`¿Estás seguro de que quieres eliminar "${scenario.name}"?`)) {
        scenarioManager.deleteScenario(index);
        renderDashboard(scenarioManager);
      }
    };

    scenarioCard.appendChild(cardContent);
    scenarioCard.appendChild(deleteButton);
    
    // Add click handler to the card content only
    cardContent.addEventListener("click", () => {
      scenarioManager.setActiveScenario(index);
      showPlanningView(scenarioManager);
    });

    DOM.scenarioList.appendChild(scenarioCard);
  });
}

export function updateActivitiesAndScheduleOptions(scenarioManager) {
  const activeScenario = scenarioManager.getActiveScenario();
  if (!activeScenario) return;
  const activityManager = activeScenario.activityManager;

  DOM.activitiesAndScheduleOptionsDiv.innerHTML = "";

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
    toggleBtn.textContent = activity.isActive ? "👁" : "🛇";
    if (!activity.isActive) {
      toggleBtn.classList.add("inactive");
      activityChip.classList.add("inactive");
    }
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deactivateActivity(scenarioManager, activityIndex);
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "chip-action-btn delete-btn";
    deleteBtn.setAttribute("aria-label", "Eliminar actividad");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`¿Estás seguro de que quieres eliminar "${activity.name}"?`)) {
        deleteActivity(scenarioManager, activityIndex);
      }
    });

    activityActions.appendChild(toggleBtn);
    activityActions.appendChild(deleteBtn);
    activityChip.appendChild(activityContent);
    activityChip.appendChild(activityActions);
    activityHeader.appendChild(activityChip);

    // Schedule options container
    const scheduleOptionsContainer = document.createElement("div");
    scheduleOptionsContainer.className = "schedule-options";

    activity.scheduleOptions.forEach((scheduleOption, scheduleOptionIndex) => {
      const scheduleOptionChip = document.createElement("div");
      scheduleOptionChip.classList.add("chip");
      
      const optionContent = document.createElement("div");
      optionContent.className = "chip-content";
      optionContent.textContent = `Opción ${scheduleOptionIndex + 1}`;

      const optionActions = document.createElement("div");
      optionActions.className = "chip-actions";

      if (scheduleOption.isEditing) {
        scheduleOptionChip.classList.add("editing");
      }

      if (!scheduleOption.isActive) {
        scheduleOptionChip.classList.add("inactive");
      }

      // Toggle button for schedule option
      const toggleOptionBtn = document.createElement("button");
      toggleOptionBtn.className = "chip-action-btn toggle-btn";
      toggleOptionBtn.setAttribute("aria-label", scheduleOption.isActive ? "Desactivar opción" : "Activar opción");
      toggleOptionBtn.textContent = scheduleOption.isActive ? "👁" : "🛇";
      if (!scheduleOption.isActive) {
        toggleOptionBtn.classList.add("inactive");
      }
      toggleOptionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deactivateScheduleOption(scenarioManager, activityIndex, scheduleOptionIndex);
      });

      // Delete button for schedule option
      const deleteOptionBtn = document.createElement("button");
      deleteOptionBtn.className = "chip-action-btn delete-btn";
      deleteOptionBtn.setAttribute("aria-label", "Eliminar opción de horario");
      deleteOptionBtn.textContent = "×";
      deleteOptionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de que quieres eliminar la Opción ${scheduleOptionIndex + 1}?`)) {
          deleteScheduleOption(scenarioManager, activityIndex, scheduleOptionIndex);
        }
      });

      optionActions.appendChild(toggleOptionBtn);
      optionActions.appendChild(deleteOptionBtn);
      scheduleOptionChip.appendChild(optionContent);
      scheduleOptionChip.appendChild(optionActions);

      // Click handler for editing
      scheduleOptionChip.addEventListener("click", () => {
        editingScheduleOption(scenarioManager, activityIndex, scheduleOptionIndex);
      });

      scheduleOptionsContainer.appendChild(scheduleOptionChip);
    });

    // Add schedule option button
    const addScheduleOptionChip = document.createElement("div");
    addScheduleOptionChip.classList.add("chip", "add-scheduleOption");
    addScheduleOptionChip.textContent = "+ Agregar Opción de Horario";
    addScheduleOptionChip.addEventListener("click", () => {
      addScheduleOption(scenarioManager, activityIndex);
    });

    scheduleOptionsContainer.appendChild(addScheduleOptionChip);

    activityContainer.appendChild(activityHeader);
    activityContainer.appendChild(scheduleOptionsContainer);
    DOM.activitiesAndScheduleOptionsDiv.appendChild(activityContainer);
  });
}

export function createActivity(scenarioManager) {
  const activeScenario = scenarioManager.getActiveScenario();
  if (!activeScenario) return;
  const activityManager = activeScenario.activityManager;

  const newActivityName = DOM.newActivityName.value.trim();

  if (!newActivityName) {
    alert("Por favor ingrese un nombre de actividad válido");
    return;
  }

  activityManager.addActivity(
    newActivityName,
    generatePastelColor(newActivityName)
  );

  updateActivitiesAndScheduleOptions(scenarioManager);

  // Poner la primera hora de clase de la nueva asignatura en estado de edición
  editingScheduleOption(
    scenarioManager,
    activityManager.activities.length - 1,
    0
  );

  DOM.newActivityName.value = "";
}

function deactivateActivity(scenarioManager, activityIndex) {
  const activityManager = scenarioManager.getActiveScenario().activityManager;
  activityManager.activities[activityIndex].deactivate();
  updateCombinedSchedules(scenarioManager);
  updateActivitiesAndScheduleOptions(scenarioManager);
}

function deleteActivity(scenarioManager, activityIndex) {
  const activityManager = scenarioManager.getActiveScenario().activityManager;
  let isAnyScheduleOptionEditing = activityManager.activities[
    activityIndex
  ].scheduleOptions.some((scheduleOption) => scheduleOption.isEditing);
  const newActivityIndex = activityManager.deleteActivity(activityIndex);
  if (activityManager.activities.length <= 0) {
    createInitialTable(scenarioManager);
  } else if (isAnyScheduleOptionEditing) {
    editingScheduleOption(scenarioManager, newActivityIndex, 0);
  }

  updateCombinedSchedules(scenarioManager);
  updateActivitiesAndScheduleOptions(scenarioManager);
}

function addScheduleOption(scenarioManager, activityIndex) {
  const activityManager = scenarioManager.getActiveScenario().activityManager;
  const scheduleOptionIndex =
    activityManager.activities[activityIndex].addScheduleOption();
  updateActivitiesAndScheduleOptions(scenarioManager);
  editingScheduleOption(scenarioManager, activityIndex, scheduleOptionIndex);
}

function deactivateScheduleOption(
  scenarioManager,
  activityIndex,
  scheduleOptionIndex
) {
  const activityManager = scenarioManager.getActiveScenario().activityManager;
  activityManager.activities[activityIndex].scheduleOptions[
    scheduleOptionIndex
  ].deactivate();
  updateCombinedSchedules(scenarioManager);
  updateActivitiesAndScheduleOptions(scenarioManager);
}

function deleteScheduleOption(
  scenarioManager,
  activityIndex,
  scheduleOptionIndex
) {
  const activityManager = scenarioManager.getActiveScenario().activityManager;
  const scheduleOption =
    activityManager.activities[activityIndex].scheduleOptions[
      scheduleOptionIndex
    ];

  const newScheduleOptionIndex = activityManager.activities[
    activityIndex
  ].deleteScheduleOption(scheduleOptionIndex);
  if (activityManager.activities[activityIndex].scheduleOptions.length > 0) {
    if (scheduleOption.isEditing) {
      editingScheduleOption(
        scenarioManager,
        activityIndex,
        newScheduleOptionIndex
      );
    }
  } else {
    const newActivityIndex = activityManager.deleteActivity(activityIndex);
    if (activityManager.activities.length > 0) {
      if (scheduleOption.isEditing) {
        editingScheduleOption(scenarioManager, newActivityIndex, 0);
      }
    } else {
      createInitialTable(scenarioManager);
    }
  }

  updateCombinedSchedules(scenarioManager);
  updateActivitiesAndScheduleOptions(scenarioManager);
}

export function editingScheduleOption(
  scenarioManager,
  activityIndex,
  scheduleOptionIndex
) {
  const activityManager = scenarioManager.getActiveScenario().activityManager;
  if (
    !activityManager.activities[activityIndex]?.scheduleOptions[
      scheduleOptionIndex
    ]?.isActive
  ) {
    return;
  }

  activityManager.activities.forEach((activity) => {
    activity.scheduleOptions.forEach((scheduleOption) => {
      scheduleOption.stopEditing();
    });
  });

  activityManager.activities[activityIndex].scheduleOptions[
    scheduleOptionIndex
  ].edit();

  updateActivitiesAndScheduleOptions(scenarioManager);
  loadScheduleOption(scenarioManager);
}