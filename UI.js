import { createInitialTable, loadActivityScheduleOption } from "./createTables.js";
import { updateCombinedSchedules } from "./combinations.js";
import generatePastelColor from "./colors.js";
import "./components/eye-open-icon.js";
import "./components/eye-off-icon.js";
import "./components/arrow-left-icon.js";
import { apiService } from "./api.js";
import { debounce, addTouchSupport, addKeyboardSupport } from "./utils.js";

const DOM = {
  dashboard: document.getElementById("dashboard"),
  mainContent: document.getElementById("main-content"),
  scheduleList: document.getElementById("schedule-list"),
  scheduleTitle: document.getElementById("schedule-title"),
  activitiesAndActivityScheduleOptionsDiv: document.getElementById(
    "activitiesAndScheduleOptions"
  ),
  newActivityName: document.getElementById("newActivityName"),
  combinedSchedulesContainer: document.getElementById("combinedSchedulesContainer"),
};

function renderDashboardStats(scheduleManager) {
  const statsContainer = document.getElementById('stats-cards-container');
  if (!statsContainer) return;

  const schedules = scheduleManager.schedules || [];
  const totalSchedules = schedules.length;
  const totalActivities = schedules.reduce((sum, schedule) => sum + schedule.activityManager.activities.length, 0);
  const totalOptions = schedules.reduce((sum, schedule) => 
    sum + schedule.activityManager.activities.reduce((s, activity) => s + activity.activityScheduleOptions.length, 0), 0);

  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-number" id="total-schedules">${totalSchedules}</div>
      <div class="stat-label">Horarios</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" id="total-activities">${totalActivities}</div>
      <div class="stat-label">Actividades Totales</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" id="total-options">${totalOptions}</div>
      <div class="stat-label">Opciones Totales</div>
    </div>
  `;
}

export function clearDashboardStats() {
  const statsContainer = document.getElementById('stats-cards-container');
  if (!statsContainer) return;

  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">0</div>
      <div class="stat-label">Horarios</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">0</div>
      <div class="stat-label">Actividades Totales</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">0</div>
      <div class="stat-label">Opciones Totales</div>
    </div>
  `;
}

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
  renderDashboardStats(scheduleManager);
  DOM.scheduleList.innerHTML = "";
  
  if (scheduleManager.schedules.length === 0) {
    DOM.scheduleList.innerHTML = `
      <div class="empty-state animate-fade-in-up">
        <div class="empty-state-icon">📅</div>
        <h3 class="empty-state-title">No hay horarios creados</h3>
        <p class="empty-state-description">¡Crea tu primer horario para comenzar a organizar tus actividades!</p>
      </div>
    `;
    return;
  }

  scheduleManager.schedules.forEach((schedule, index) => {
    const scheduleCard = document.createElement("div");
    scheduleCard.className = "schedule-card animate-fade-in-up";
    scheduleCard.style.animationDelay = `${index * 0.1}s`;
    
    // Calculate schedule statistics
    const activityCount = schedule.activityManager.activities.length;
    const activeActivityCount = schedule.activityManager.activities.filter(a => a.isActive).length;
    const totalOptions = schedule.activityManager.activities.reduce((sum, activity) => 
      sum + activity.activityScheduleOptions.length, 0);
    
    const cardHeader = document.createElement("div");
    cardHeader.className = "schedule-card-header";
    
    const cardTitle = document.createElement("h3");
    cardTitle.className = "schedule-card-title";
    cardTitle.textContent = schedule.name;
    
    const cardMeta = document.createElement("div");
    cardMeta.className = "schedule-card-meta";
    
    if (activityCount > 0) {
      cardMeta.innerHTML = `
        <div class="schedule-meta-item">
          <span>📚</span>
          <span>${activityCount} actividad${activityCount !== 1 ? 'es' : ''}</span>
        </div>
        <div class="schedule-meta-item">
          <span>✅</span>
          <span>${activeActivityCount} activa${activeActivityCount !== 1 ? 's' : ''}</span>
        </div>
        <div class="schedule-meta-item">
          <span>⚙️</span>
          <span>${totalOptions} opción${totalOptions !== 1 ? 'es' : ''}</span>
        </div>
      `;
    } else {
      cardMeta.innerHTML = `
        <div class="schedule-meta-item">
          <span>📝</span>
          <span>Sin actividades</span>
        </div>
      `;
    }
    
    cardHeader.appendChild(cardTitle);
    cardHeader.appendChild(cardMeta);
    
    const cardActions = document.createElement("div");
    cardActions.className = "schedule-card-actions";
    
    const cardDate = document.createElement("div");
    cardDate.className = "schedule-card-date";
    cardDate.textContent = "Creado recientemente";
    
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
    
    cardActions.appendChild(cardDate);
    cardActions.appendChild(deleteButton);
    
    scheduleCard.appendChild(cardHeader);
    scheduleCard.appendChild(cardActions);
    
    // Add click handler to the card header with mobile and keyboard support
    const handleCardActivation = debounce(async () => {
      scheduleManager.setActiveSchedule(index);
      await showPlanningView(scheduleManager);
    }, 150);

    cardHeader.addEventListener("click", handleCardActivation);
    addTouchSupport(cardHeader, handleCardActivation);
    addKeyboardSupport(cardHeader, handleCardActivation);
    
    // Make card header focusable for keyboard navigation
    cardHeader.setAttribute("tabindex", "0");
    cardHeader.setAttribute("role", "button");
    cardHeader.setAttribute("aria-label", `Abrir horario ${schedule.name}`);

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

      // Click handler for editing with mobile and keyboard support
      const handleChipActivation = debounce(() => {
        editingActivityScheduleOption(scheduleManager, activityIndex, activityScheduleOptionIndex);
      }, 100);

      activityScheduleOptionChip.addEventListener("click", handleChipActivation);
      addTouchSupport(activityScheduleOptionChip, handleChipActivation);
      addKeyboardSupport(activityScheduleOptionChip, handleChipActivation);
      
      // Make chip focusable for keyboard navigation
      activityScheduleOptionChip.setAttribute("tabindex", "0");
      activityScheduleOptionChip.setAttribute("role", "button");
      activityScheduleOptionChip.setAttribute("aria-label", `Editar Opción ${activityScheduleOptionIndex + 1} de ${activity.name}`);

      activityScheduleOptionsContainer.appendChild(activityScheduleOptionChip);
    });

    // Add activity schedule option button with mobile and keyboard support
    const addActivityScheduleOptionChip = document.createElement("div");
    addActivityScheduleOptionChip.classList.add("chip", "add-scheduleOption");
    addActivityScheduleOptionChip.textContent = "+ Agregar Opción de Horario";
    
    const handleAddOption = debounce(() => {
      addActivityScheduleOption(scheduleManager, activityIndex);
    }, 150);

    addActivityScheduleOptionChip.addEventListener("click", handleAddOption);
    addTouchSupport(addActivityScheduleOptionChip, handleAddOption);
    addKeyboardSupport(addActivityScheduleOptionChip, handleAddOption);
    
    // Make add button focusable for keyboard navigation
    addActivityScheduleOptionChip.setAttribute("tabindex", "0");
    addActivityScheduleOptionChip.setAttribute("role", "button");
    addActivityScheduleOptionChip.setAttribute("aria-label", `Agregar nueva opción de horario para ${activity.name}`);

    activityScheduleOptionsContainer.appendChild(addActivityScheduleOptionChip);

    activityContainer.appendChild(activityHeader);
    activityContainer.appendChild(activityScheduleOptionsContainer);
    DOM.activitiesAndActivityScheduleOptionsDiv.prepend(activityContainer);
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

  // Poner la primera opción de horario de la nueva actividad en estado de edición
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