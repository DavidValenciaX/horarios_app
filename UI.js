import { createInitialTable, loadActivityScheduleOption } from "./createTables.js";
import { updateCombinedSchedules } from "./combinations.js";
import generatePastelColor from "./colors.js";
import "./components/eye-open-icon.js";
import "./components/eye-off-icon.js";
import "./components/arrow-left-icon.js";
import "./components/three-dots-icon.js";
import "./components/trash-icon.js";
import "./components/check-icon.js";
import "./components/x-icon.js";
import "./components/edit-icon.js";
import { apiService } from "./api.js";
import { debounce, addTouchSupport, addKeyboardSupport } from "./utils.js";
import { ScheduleManager } from "./classes.js";
import Swal from "sweetalert2";

/**
 * Función helper para sincronizar automáticamente el estado de una actividad con sus schedule options
 * 
 * Reglas de sincronización:
 * - Si todas las schedule options están inactive → la actividad se pone inactive
 * - Si al menos una schedule option está active → la actividad se pone active
 * 
 * @param {Activity} activity - La actividad a sincronizar
 * @returns {boolean} - true si hubo un cambio de estado, false si no
 */
function syncActivityStateWithOptions(activity) {
  const activeOptionsCount = activity.activityScheduleOptions.filter(option => option.isActive).length;
  const shouldBeActive = activeOptionsCount > 0;
  
  // Solo cambiar el estado si es necesario para evitar ciclos
  if (activity.isActive !== shouldBeActive) {
    activity.isActive = shouldBeActive;
    return true; // Indica que hubo un cambio
  }
  
  return false; // No hubo cambio
}

// Cerrar menús cuando se hace click fuera de ellos
document.addEventListener('click', (e) => {
    // Solo cerrar menús si el click no es dentro del menú o el botón del menú
    if (!e.target.closest('.chip-menu-container')) {
        document.querySelectorAll('.chip-menu.visible').forEach(menu => {
            menu.classList.remove('visible');
            menu.parentElement.classList.remove('menu-open');
            menu.closest('.chip')?.classList.remove('menu-open');
        });
    }
});

// También cerrar menús en touch fuera de ellos
document.addEventListener('touchend', (e) => {
    if (!e.target.closest('.chip-menu-container')) {
        document.querySelectorAll('.chip-menu.visible').forEach(menu => {
            menu.classList.remove('visible');
            menu.parentElement.classList.remove('menu-open');
            menu.closest('.chip')?.classList.remove('menu-open');
        });
    }
});

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

function createChipMenu(items) {
    const menuContainer = document.createElement('div');
    menuContainer.className = 'chip-menu-container';

    const menuToggleBtn = document.createElement('button');
    menuToggleBtn.className = 'chip-action-btn menu-toggle-btn';
    menuToggleBtn.setAttribute('aria-label', 'Más opciones');
    menuToggleBtn.innerHTML = '<three-dots-icon></three-dots-icon>';
    
    const menu = document.createElement('div');
    menu.className = 'chip-menu';

    items.forEach(item => {
        const menuItem = document.createElement('button');
        menuItem.className = 'chip-menu-item';
        if(item.className) menuItem.classList.add(item.className);
        menuItem.setAttribute('aria-label', item.label);
        
        const icon = document.createElement(item.iconComponent);
        icon.classList.add('icon');
        
        const text = document.createElement('span');
        text.textContent = item.text;
        
        menuItem.appendChild(icon);
        menuItem.appendChild(text);
        
        const executeMenuItem = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            menu.classList.remove('visible');
            menuContainer.classList.remove('menu-open');
            menuContainer.closest('.chip')?.classList.remove('menu-open');
            try {
                await item.onClick(e);
            } catch (error) {
                console.error('Error ejecutando acción del menú:', error);
            }
        };

        // Agregar soporte tanto para click como touch
        menuItem.addEventListener('click', executeMenuItem);
        menuItem.addEventListener('touchend', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            await executeMenuItem(e);
        });
        menu.appendChild(menuItem);
    });

    menuContainer.appendChild(menuToggleBtn);
    menuContainer.appendChild(menu);

    function positionMenu() {
        const buttonRect = menuToggleBtn.getBoundingClientRect();
        const menuWidth = 150; // min-width del menú
        const menuHeight = menu.scrollHeight || 100; // altura estimada del menú
        
        // Calcular posición por defecto (abajo a la derecha del botón)
        let top = buttonRect.bottom + 8;
        let left = buttonRect.right - menuWidth;
        
        // Verificar si el menú se sale por la derecha
        if (left < 8) {
            left = buttonRect.left;
        }
        
        // Verificar si el menú se sale por abajo
        if (top + menuHeight > window.innerHeight - 8) {
            top = buttonRect.top - menuHeight - 8;
        }
        
        // Verificar si se sale por arriba
        if (top < 8) {
            top = buttonRect.bottom + 8;
        }
        
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
    }

    const toggleMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const chip = menuContainer.closest('.chip');

        // Cerrar otros menús primero
        document.querySelectorAll('.chip-menu.visible').forEach(m => {
            if (m !== menu) {
                m.classList.remove('visible');
                m.parentElement.classList.remove('menu-open');
                m.closest('.chip')?.classList.remove('menu-open');
            }
        });
        
        // Si se va a mostrar el menú, calcular posición
        if (!menu.classList.contains('visible')) {
            positionMenu();
            menuContainer.classList.add('menu-open');
            chip?.classList.add('menu-open');
        } else {
            menuContainer.classList.remove('menu-open');
            chip?.classList.remove('menu-open');
        }
        
        // Toggle el menú actual
        menu.classList.toggle('visible');
    };

    // Agregar tanto click como touchend para mejor soporte en dispositivos táctiles
    menuToggleBtn.addEventListener('click', toggleMenu);
    
    // Mejorar soporte touch para evitar conflictos
    menuToggleBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Evitar que se ejecute el click después del touchend
        setTimeout(() => toggleMenu(e), 0);
    });
    
    // Prevenir comportamiento por defecto en touchstart
    menuToggleBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });

    // Recalcular posición en resize y scroll
    const recalculatePosition = debounce(() => {
        if (menu.classList.contains('visible')) {
            positionMenu();
        }
    }, 100);

    window.addEventListener('resize', recalculatePosition);
    window.addEventListener('scroll', recalculatePosition, true);

    return menuContainer;
}

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
    
    const actionsButtonsContainer = document.createElement("div");
    actionsButtonsContainer.className = "card-action-buttons";
    
    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.setAttribute("aria-label", `Editar nombre del horario ${schedule.name}`);
    editButton.innerHTML = '<edit-icon></edit-icon>';
    editButton.onclick = (e) => {
      e.stopPropagation();
      startEditingScheduleName(scheduleManager, index);
    };
    
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.setAttribute("aria-label", `Eliminar horario ${schedule.name}`);
    deleteButton.innerHTML = '×';
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Estás seguro de que quieres eliminar "${schedule.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          scheduleManager.deleteSchedule(index);
          showDashboard(scheduleManager);
        }
      });
    };
    
    actionsButtonsContainer.appendChild(editButton);
    actionsButtonsContainer.appendChild(deleteButton);
    
    cardActions.appendChild(cardDate);
    cardActions.appendChild(actionsButtonsContainer);
    
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
    
    if (!activity.isActive) {
      activityChip.classList.add("inactive");
    } else {
      // Verificar si tiene opciones activas
      const hasActiveOptions = activity.activityScheduleOptions.some(option => option.isActive);
      if (hasActiveOptions) {
        activityChip.classList.add("has-active-options");
      }
    }

    const activityContent = document.createElement("div");
    activityContent.className = "chip-content";
    activityContent.textContent = activity.name;

    const activityActions = document.createElement("div");
    activityActions.className = "chip-actions";

    const menuItems = [
      {
          label: "Editar nombre",
          iconComponent: "three-dots-icon",
          text: 'Editar nombre',
          onClick: async () => {
              await startEditingActivityName(scheduleManager, activityIndex);
          }
      },
      {
          label: activity.isActive ? "Desactivar actividad" : "Activar actividad",
          iconComponent: activity.isActive ? "eye-off-icon" : "eye-open-icon",
          text: activity.isActive ? 'Desactivar' : 'Activar',
          onClick: async () => {
              await deactivateActivity(scheduleManager, activityIndex);
          }
      },
      {
          label: "Eliminar actividad",
          iconComponent: 'trash-icon',
          text: 'Eliminar',
          className: 'delete-btn',
          onClick: async () => {
              const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: `¿Estás seguro de que quieres eliminar "${activity.name}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
              });
              
              if (result.isConfirmed) {
                  await deleteActivity(scheduleManager, activityIndex);
              }
          }
      }
    ];

    const menu = createChipMenu(menuItems);
    activityActions.appendChild(menu);

    activityChip.appendChild(activityContent);
    activityChip.appendChild(activityActions);

    // Click handler for activity chip - editar primera opción activa
    const handleActivityActivation = debounce((e) => {
      // Prevenir activación durante interacciones con el menú o sus elementos
      if (e.target.closest('.chip-menu-container') || 
          e.target.closest('.chip-actions') ||
          e.target.closest('.menu-toggle-btn') ||
          e.target.closest('.chip-menu') ||
          e.target.closest('.chip-action-btn')) {
          e.preventDefault();
          e.stopPropagation();
          return;
      }
      
      // Solo activar si la actividad está activa
      if (activity.isActive) {
        // Encontrar el primer schedule option que no esté inactivo
        const firstActiveOptionIndex = activity.activityScheduleOptions.findIndex(option => option.isActive);
        if (firstActiveOptionIndex !== -1) {
          editingActivityScheduleOption(scheduleManager, activityIndex, firstActiveOptionIndex);
        } else {
          // Feedback visual cuando no hay opciones activas
          activityChip.style.animation = 'shake 0.5s ease-in-out';
          setTimeout(() => {
            activityChip.style.animation = '';
          }, 500);
        }
      }
    }, 100);

    // Agregar event listeners para click, touch y keyboard
    activityChip.addEventListener("click", handleActivityActivation);
    addTouchSupport(activityChip, handleActivityActivation);
    addKeyboardSupport(activityChip, handleActivityActivation);
    
    // Make chip focusable for keyboard navigation
    activityChip.setAttribute("tabindex", "0");
    activityChip.setAttribute("role", "button");
    
    // Configurar aria-label según el estado de la actividad
    let ariaLabel;
    if (!activity.isActive) {
      ariaLabel = `${activity.name} (inactiva)`;
    } else {
      const hasActiveOptions = activity.activityScheduleOptions.some(option => option.isActive);
      if (hasActiveOptions) {
        ariaLabel = `Editar primera opción activa de ${activity.name}`;
      } else {
        ariaLabel = `${activity.name} (sin opciones activas)`;
      }
    }
    activityChip.setAttribute("aria-label", ariaLabel);

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

      const optionMenuItems = [
        {
            label: activityScheduleOption.isActive ? "Desactivar opción" : "Activar opción",
            iconComponent: activityScheduleOption.isActive ? "eye-off-icon" : "eye-open-icon",
            text: activityScheduleOption.isActive ? 'Desactivar' : 'Activar',
            onClick: async () => {
                await deactivateActivityScheduleOption(scheduleManager, activityIndex, activityScheduleOptionIndex);
            }
        },
        {
            label: "Eliminar opción de horario",
            iconComponent: 'trash-icon',
            text: 'Eliminar',
            className: 'delete-btn',
            onClick: async () => {
                 const result = await Swal.fire({
                   title: '¿Estás seguro?',
                   text: `¿Estás seguro de que quieres eliminar la Opción ${activityScheduleOptionIndex + 1}?`,
                   icon: 'warning',
                   showCancelButton: true,
                   confirmButtonColor: '#d33',
                   cancelButtonColor: '#3085d6',
                   confirmButtonText: 'Sí, eliminar',
                   cancelButtonText: 'Cancelar'
                 });
                 
                 if (result.isConfirmed) {
                    await deleteActivityScheduleOption(scheduleManager, activityIndex, activityScheduleOptionIndex);
                }
            }
        }
      ];

      const optionMenu = createChipMenu(optionMenuItems);
      optionActions.appendChild(optionMenu);
      
      if (activityScheduleOption.isEditing) {
        activityScheduleOptionChip.classList.add("editing");
      }

      if (!activityScheduleOption.isActive) {
        activityScheduleOptionChip.classList.add("inactive");
      }

      activityScheduleOptionChip.appendChild(optionContent);
      activityScheduleOptionChip.appendChild(optionActions);

            // Click handler for editing - expandir área clickeable pero evitar conflictos con menú
      const handleChipActivation = debounce((e) => {
        // Prevenir activación durante interacciones con el menú o sus elementos
        if (e.target.closest('.chip-menu-container') || 
            e.target.closest('.chip-actions') ||
            e.target.closest('.menu-toggle-btn') ||
            e.target.closest('.chip-menu') ||
            e.target.closest('.chip-action-btn')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        editingActivityScheduleOption(scheduleManager, activityIndex, activityScheduleOptionIndex);
      }, 100);

      // Agregar event listener al chip para mayor área clickeable
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
    
    const handleAddOption = debounce((e) => {
      e.preventDefault();
      e.stopPropagation();
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

  // Add title at the top after processing all activities
  if (activityManager.activities.length > 0) {
    const titleElement = document.createElement("h3");
    titleElement.textContent = "Actividades y Opciones";
    titleElement.className = "activities-title";
    DOM.activitiesAndActivityScheduleOptionsDiv.prepend(titleElement);
  }
}

export function createActivity(scheduleManager) {
  const activeSchedule = scheduleManager.getActiveSchedule();
  if (!activeSchedule) return;
  const activityManager = activeSchedule.activityManager;

  const newActivityName = DOM.newActivityName.value.trim();

  if (!newActivityName) {
    Swal.fire({
      icon: 'warning',
      title: 'Nombre requerido',
      text: 'Por favor ingrese un nombre de actividad válido',
      confirmButtonText: 'Entendido'
    });
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

async function startEditingActivityName(scheduleManager, activityIndex) {
  const activityManager = scheduleManager.getActiveSchedule().activityManager;
  const activity = activityManager.activities[activityIndex];
  const scheduleIndex = scheduleManager.activeScheduleIndex;
  
  // Find the activity chip element
  // Como las actividades se añaden con prepend, el orden visual está invertido
  // Convertir el índice del array al índice visual
  const totalActivities = activityManager.activities.length;
  const visualIndex = totalActivities - 1 - activityIndex;
  
  const activityChips = document.querySelectorAll('.chip.activity');
  const activityChip = activityChips[visualIndex];
  
  if (!activityChip) return;
  
  const activityContent = activityChip.querySelector('.chip-content');
  if (!activityContent) return;
  
  // Store original content
  const originalName = activity.name;
  activityContent.innerHTML = '';
  
  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.className = 'edit-name-container';
  
  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.value = originalName;
  input.className = 'edit-name-input';
  input.setAttribute('maxlength', '50');
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'edit-name-buttons';
  
  // Create confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'edit-confirm-btn';
  confirmBtn.setAttribute('aria-label', 'Confirmar cambios');
  confirmBtn.innerHTML = '<check-icon></check-icon>';
  
  // Create cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'edit-cancel-btn';
  cancelBtn.setAttribute('aria-label', 'Cancelar edición');
  cancelBtn.innerHTML = '<x-icon></x-icon>';
  
  buttonContainer.appendChild(confirmBtn);
  buttonContainer.appendChild(cancelBtn);
  
  inputContainer.appendChild(input);
  inputContainer.appendChild(buttonContainer);
  activityContent.appendChild(inputContainer);
  
  // Add editing class to chip
  activityChip.classList.add('editing-name');
  
  // Focus and select input text with mobile device support
  setTimeout(() => {
    input.focus();
    input.select();
    
    // For mobile devices, ensure proper focus
    if ('ontouchstart' in window) {
      input.setSelectionRange(0, input.value.length);
    }
  }, 50);
  
  // --- Event Handling and Cleanup ---

  const stopPropagation = (e) => e.stopPropagation();

  // Handle click/touch outside to cancel editing
  const handleClickOrTouchOutside = (e) => {
    if (!activityChip.contains(e.target)) {
      cancelEdit();
    }
  };

  // Function to remove all temporary listeners
  const cleanupEventListeners = () => {
    document.removeEventListener('click', handleClickOrTouchOutside, true);
    document.removeEventListener('touchend', handleClickOrTouchOutside, true);
    inputContainer.removeEventListener('click', stopPropagation);
    inputContainer.removeEventListener('keydown', stopPropagation);
    inputContainer.removeEventListener('touchend', stopPropagation);
  };
  
  // Handle confirm action
  const confirmEdit = async () => {
    const newName = input.value.trim();
    
    if (!newName) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'El nombre no puede estar vacío',
        confirmButtonText: 'Entendido'
      });
      input.focus();
      return;
    }
    
    if (newName === originalName) {
      cancelEdit();
      return;
    }
    
    cleanupEventListeners();

    try {
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      
      const result = await apiService.updateActivityName(scheduleIndex, activityIndex, newName);
      
      if (result.success) {
        // Update local data with server response
        if (result.scheduleData) {
          Object.assign(
            scheduleManager,
            ScheduleManager.fromJSON(result.scheduleData)
          );
        } else {
          // Fallback: update locally
          activity.name = newName;
        }
        
        // Update UI
        updateActivitiesAndActivityScheduleOptions(scheduleManager);
        updateCombinedSchedules(scheduleManager);
        
        // Show success feedback
        showEditSuccessFeedback(activityChip);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error || 'Error al actualizar el nombre',
          confirmButtonText: 'Entendido'
        });
        // Restore UI to pre-edit state on failure, since cleanup is already done
        activityChip.classList.remove('editing-name');
        activityContent.innerHTML = '';
        activityContent.textContent = originalName;
      }
    } catch (error) {
      console.error('Error updating activity name:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar el nombre',
        confirmButtonText: 'Entendido'
      });
      // Restore UI to pre-edit state on error
      activityChip.classList.remove('editing-name');
      activityContent.innerHTML = '';
      activityContent.textContent = originalName;
    }
  };
  
  // Handle cancel action
  const cancelEdit = () => {
    cleanupEventListeners();
    activityChip.classList.remove('editing-name');
    activityContent.innerHTML = '';
    activityContent.textContent = originalName;
  };
  
  // --- Attach Event Listeners ---
  
  // Stop propagation to prevent chip's own handlers from firing
  inputContainer.addEventListener('click', stopPropagation);
  inputContainer.addEventListener('keydown', stopPropagation);
  inputContainer.addEventListener('touchend', stopPropagation);

  // Event listeners for buttons and input with touch support
  confirmBtn.addEventListener('click', confirmEdit);
  cancelBtn.addEventListener('click', cancelEdit);
  
  // Add touch support for mobile devices
  addTouchSupport(confirmBtn, confirmEdit);
  addTouchSupport(cancelBtn, cancelEdit);
  
  // Handle Enter/Escape keys on the input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  });
  
  // Add click and touch outside listeners with capture to ensure they run
  setTimeout(() => {
    document.addEventListener('click', handleClickOrTouchOutside, true);
    document.addEventListener('touchend', handleClickOrTouchOutside, true);
  }, 100);
}

function showEditSuccessFeedback(element) {
  element.style.animation = 'pulse 0.3s ease-in-out';
  setTimeout(() => {
    element.style.animation = '';
  }, 300);
}

async function startEditingScheduleName(scheduleManager, scheduleIndex) {
  const schedule = scheduleManager.schedules[scheduleIndex];
  if (!schedule) return;
  
  // Find the schedule card element
  const scheduleCards = document.querySelectorAll('.schedule-card');
  const scheduleCard = scheduleCards[scheduleIndex];
  
  if (!scheduleCard) return;
  
  const scheduleTitle = scheduleCard.querySelector('.schedule-card-title');
  if (!scheduleTitle) return;
  
  // Store original content
  const originalName = schedule.name;
  scheduleTitle.innerHTML = '';
  
  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.className = 'edit-name-container';
  
  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.value = originalName;
  input.className = 'edit-name-input';
  input.setAttribute('maxlength', '100');
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'edit-name-buttons';
  
  // Create confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'edit-confirm-btn';
  confirmBtn.setAttribute('aria-label', 'Confirmar cambios');
  confirmBtn.innerHTML = '<check-icon></check-icon>';
  
  // Create cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'edit-cancel-btn';
  cancelBtn.setAttribute('aria-label', 'Cancelar edición');
  cancelBtn.innerHTML = '<x-icon></x-icon>';
  
  buttonContainer.appendChild(confirmBtn);
  buttonContainer.appendChild(cancelBtn);
  
  inputContainer.appendChild(input);
  inputContainer.appendChild(buttonContainer);
  scheduleTitle.appendChild(inputContainer);
  
  // Add editing class to card
  scheduleCard.classList.add('editing-name');
  
  // Focus and select input text with mobile device support
  setTimeout(() => {
    input.focus();
    input.select();
    
    // For mobile devices, ensure proper focus
    if ('ontouchstart' in window) {
      input.setSelectionRange(0, input.value.length);
    }
  }, 50);
  
  // --- Event Handling and Cleanup ---

  const stopPropagation = (e) => e.stopPropagation();

  // Handle click/touch outside to cancel editing
  const handleClickOrTouchOutside = (e) => {
    if (!scheduleCard.contains(e.target)) {
      cancelEdit();
    }
  };

  // Function to remove all temporary listeners
  const cleanupEventListeners = () => {
    document.removeEventListener('click', handleClickOrTouchOutside, true);
    document.removeEventListener('touchend', handleClickOrTouchOutside, true);
    inputContainer.removeEventListener('click', stopPropagation);
    inputContainer.removeEventListener('keydown', stopPropagation);
    inputContainer.removeEventListener('touchend', stopPropagation);
  };
  
  // Handle confirm action
  const confirmEdit = async () => {
    const newName = input.value.trim();
    
    if (!newName) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'El nombre no puede estar vacío',
        confirmButtonText: 'Entendido'
      });
      input.focus();
      return;
    }
    
    if (newName === originalName) {
      cancelEdit();
      return;
    }
    
    cleanupEventListeners();

    try {
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      
      const result = await apiService.updateScheduleName(scheduleIndex, newName);
      
      if (result.success) {
        // Update local data with server response
        if (result.scheduleData) {
          Object.assign(
            scheduleManager,
            ScheduleManager.fromJSON(result.scheduleData)
          );
        } else {
          // Fallback: update locally
          schedule.name = newName;
        }
        
        // Update UI
        showDashboard(scheduleManager);
        
        // Show success feedback
        showEditSuccessFeedback(scheduleCard);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error || 'Error al actualizar el nombre del horario',
          confirmButtonText: 'Entendido'
        });
        // Restore UI to pre-edit state on failure
        scheduleCard.classList.remove('editing-name');
        scheduleTitle.innerHTML = '';
        scheduleTitle.textContent = originalName;
      }
    } catch (error) {
      console.error('Error updating schedule name:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar el nombre del horario',
        confirmButtonText: 'Entendido'
      });
      // Restore UI to pre-edit state on error
      scheduleCard.classList.remove('editing-name');
      scheduleTitle.innerHTML = '';
      scheduleTitle.textContent = originalName;
    }
  };
  
  // Handle cancel action
  const cancelEdit = () => {
    cleanupEventListeners();
    scheduleCard.classList.remove('editing-name');
    scheduleTitle.innerHTML = '';
    scheduleTitle.textContent = originalName;
  };
  
  // --- Attach Event Listeners ---
  
  // Stop propagation to prevent card's own handlers from firing
  inputContainer.addEventListener('click', stopPropagation);
  inputContainer.addEventListener('keydown', stopPropagation);
  inputContainer.addEventListener('touchend', stopPropagation);

  // Event listeners for buttons and input with touch support
  confirmBtn.addEventListener('click', confirmEdit);
  cancelBtn.addEventListener('click', cancelEdit);
  
  // Add touch support for mobile devices
  addTouchSupport(confirmBtn, confirmEdit);
  addTouchSupport(cancelBtn, cancelEdit);
  
  // Handle Enter/Escape keys on the input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  });
  
  // Add click and touch outside listeners with capture to ensure they run
  setTimeout(() => {
    document.addEventListener('click', handleClickOrTouchOutside, true);
    document.addEventListener('touchend', handleClickOrTouchOutside, true);
  }, 100);
}

function addActivityScheduleOption(scheduleManager, activityIndex) {
  const activityManager = scheduleManager.getActiveSchedule().activityManager;
  const activity = activityManager.activities[activityIndex];
  
  const activityScheduleOptionIndex = activity.addActivityScheduleOption();
  
  // Sincronizar el estado de la actividad (una nueva opción activa podría activar la actividad)
  syncActivityStateWithOptions(activity);
  
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
  const activity = activityManager.activities[activityIndex];
  const activityScheduleOption = activity.activityScheduleOptions[activityScheduleOptionIndex];
  
  // Cambiar el estado de la schedule option
  activityScheduleOption.deactivate();
  
  // Sincronizar automáticamente el estado de la actividad padre
  const activityStateChanged = syncActivityStateWithOptions(activity);
  
  // Si la actividad cambió a inactive y había una opción en edición, parar la edición
  if (activityStateChanged && !activity.isActive) {
    activity.activityScheduleOptions.forEach(option => {
      option.stopEditing();
    });
  }
  
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
  const activity = activityManager.activities[activityIndex];
  const activityScheduleOption = activity.activityScheduleOptions[activityScheduleOptionIndex];

  const newActivityScheduleOptionIndex = activity.deleteActivityScheduleOption(activityScheduleOptionIndex);
  
  if (activity.activityScheduleOptions.length > 0) {
    // Sincronizar el estado de la actividad después de eliminar una opción
    const activityStateChanged = syncActivityStateWithOptions(activity);
    
    // Si la actividad cambió a inactive, parar todas las ediciones
    if (activityStateChanged && !activity.isActive) {
      activity.activityScheduleOptions.forEach(option => {
        option.stopEditing();
      });
    } else if (activityScheduleOption.isEditing) {
      // Solo continuar editando si la actividad sigue activa
      if (activity.isActive) {
        editingActivityScheduleOption(
          scheduleManager,
          activityIndex,
          newActivityScheduleOptionIndex
        );
      }
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