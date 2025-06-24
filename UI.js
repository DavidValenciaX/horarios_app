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
    scenarioCard.textContent = scenario.name;
    scenarioCard.addEventListener("click", () => {
      scenarioManager.setActiveScenario(index);
      showPlanningView(scenarioManager);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "X";
    deleteButton.className = "delete-button";
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`¿Estás seguro de que quieres eliminar "${scenario.name}"?`)) {
        scenarioManager.deleteScenario(index);
        renderDashboard(scenarioManager);
      }
    };
    scenarioCard.appendChild(deleteButton);
    DOM.scenarioList.appendChild(scenarioCard);
  });
}

export function updateActivitiesAndScheduleOptions(scenarioManager) {
  const activeScenario = scenarioManager.getActiveScenario();
  if (!activeScenario) return;
  const activityManager = activeScenario.activityManager;

  DOM.activitiesAndScheduleOptionsDiv.innerHTML = "";

  const inactiveIcon = "🛇";
  const activeIcon = "✓";

  activityManager.activities.forEach((activity, activityIndex) => {
    const parentDiv = document.createElement("div");

    const activityChip = document.createElement("div");
    activityChip.classList.add("chip", "activity");
    activityChip.style.backgroundColor = activity.color;
    activityChip.addEventListener("click", () => {
      editingScheduleOption(scenarioManager, activityIndex, 0);
    });
    // Creamos dos elementos diferentes para el nombre y los créditos
    const activityName = document.createElement("div");
    activityName.textContent = activity.name;

    const closeIcon = document.createElement("span");
    closeIcon.classList.add("close-icon");
    closeIcon.textContent = "x";
    closeIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteActivity(scenarioManager, activityIndex);
    });

    const disableIcon = document.createElement("span");
    disableIcon.classList.add("disable-icon");

    if (!activity.isActive) {
      activityChip.classList.add("inactive");
      disableIcon.textContent = activeIcon;
    } else {
      activityChip.classList.remove("inactive");
      disableIcon.textContent = inactiveIcon;
    }

    disableIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      deactivateActivity(scenarioManager, activityIndex);
    });

    // Añadimos los elementos al chip de la asignatura
    activityChip.appendChild(activityName);
    activityChip.appendChild(closeIcon);
    activityChip.appendChild(disableIcon);
    parentDiv.appendChild(activityChip);

    activity.scheduleOptions.forEach((scheduleOption, scheduleOptionIndex) => {
      const scheduleOptionChip = document.createElement("div");
      scheduleOptionChip.classList.add("chip");
      scheduleOptionChip.textContent = `Opción ${scheduleOptionIndex + 1}`;
      scheduleOptionChip.addEventListener("click", () => {
        editingScheduleOption(
          scenarioManager,
          activityIndex,
          scheduleOptionIndex
        );
      });

      if (scheduleOption.isEditing) {
        scheduleOptionChip.classList.add("editing");
      }

      const closeIcon = document.createElement("span");
      closeIcon.classList.add("close-icon");
      closeIcon.textContent = "x";
      closeIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteScheduleOption(
          scenarioManager,
          activityIndex,
          scheduleOptionIndex
        );
      });

      const disableIcon = document.createElement("span");
      disableIcon.classList.add("disable-icon");

      if (!scheduleOption.isActive) {
        scheduleOptionChip.classList.add("inactive");
        disableIcon.textContent = activeIcon;
      } else {
        disableIcon.textContent = inactiveIcon;
      }

      disableIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deactivateScheduleOption(
          scenarioManager,
          activityIndex,
          scheduleOptionIndex
        );
      });

      scheduleOptionChip.appendChild(closeIcon);
      scheduleOptionChip.appendChild(disableIcon);
      parentDiv.appendChild(scheduleOptionChip);
    });

    const addScheduleOptionChip = document.createElement("div");
    addScheduleOptionChip.classList.add("chip");
    addScheduleOptionChip.classList.add("add-scheduleOption");
    addScheduleOptionChip.textContent = "+ Agregar Opción de Horario";
    addScheduleOptionChip.addEventListener("click", () => {
      addScheduleOption(scenarioManager, activityIndex);
    });

    parentDiv.appendChild(addScheduleOptionChip);
    DOM.activitiesAndScheduleOptionsDiv.appendChild(parentDiv);
    DOM.activitiesAndScheduleOptionsDiv.appendChild(
      document.createElement("hr")
    );
  });
}

export function createActivity(scenarioManager) {
  const activeScenario = scenarioManager.getActiveScenario();
  if (!activeScenario) return;
  const activityManager = activeScenario.activityManager;

  const newActivityName = DOM.newActivityName.value;

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
