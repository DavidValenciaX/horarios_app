import { loadScheduleOption } from "./createTables.js";
import { updateCombinedSchedules } from "./combinations.js";
import generatePastelColor from "./colors.js";

export function updateActivitiesAndScheduleOptions(activityManager) {
  const activitiesAndScheduleOptionsDiv = document.getElementById(
    "activitiesAndScheduleOptions"
  );
  activitiesAndScheduleOptionsDiv.innerHTML = "";

  const inactiveIcon = "🛇";
  const activeIcon = "✓";

  activityManager.activities.forEach((activity, activityIndex) => {
    const parentDiv = document.createElement("div");

    const activityChip = document.createElement("div");
    activityChip.classList.add("chip", "activity");
    activityChip.style.backgroundColor = activity.color;
    activityChip.addEventListener("click", () => {
      editingScheduleOption(activityManager, activityIndex, 0);
    });
    // Creamos dos elementos diferentes para el nombre y los créditos
    const activityName = document.createElement("div");
    activityName.textContent = activity.name;

    const closeIcon = document.createElement("span");
    closeIcon.classList.add("close-icon");
    closeIcon.textContent = "x";
    closeIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteActivity(activityManager, activityIndex);
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
      deactivateActivity(activityManager, activityIndex);
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
          activityManager,
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
          activityManager,
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
          activityManager,
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
      addScheduleOption(activityManager, activityIndex);
    });

    parentDiv.appendChild(addScheduleOptionChip);
    activitiesAndScheduleOptionsDiv.appendChild(parentDiv);
    activitiesAndScheduleOptionsDiv.appendChild(document.createElement("hr"));
  });
}

export function createActivity(activityManager) {
  const newActivityName = document.getElementById("newActivityName").value;

  if (!newActivityName) {
    alert("Por favor ingrese un nombre de actividad válido");
    return;
  }

  activityManager.addActivity(
    newActivityName,
    generatePastelColor(newActivityName)
  );

  updateActivitiesAndScheduleOptions(activityManager);

  // Poner la primera hora de clase de la nueva asignatura en estado de edición
  editingScheduleOption(activityManager, activityManager.activities.length - 1, 0);

  document.getElementById("newActivityName").value = "";
}

function deactivateActivity(activityManager, activityIndex) {
  activityManager.activities[activityIndex].deactivate();

  updateCombinedSchedules(activityManager);

  updateActivitiesAndScheduleOptions(activityManager);
}

function deleteActivity(activityManager, activityIndex) {
  // Verifica si alguna hora de la asignatura está en edición antes de eliminarla
  let isAnyScheduleOptionEditing = activityManager.activities[
    activityIndex
  ].scheduleOptions.some((scheduleOption) => scheduleOption.isEditing);
  const newActivityIndex = activityManager.deleteActivity(activityIndex);
  if (activityManager.activities.length <= 0) {
    createInitialTable(activityManager);
  } else if (isAnyScheduleOptionEditing) {
    editingScheduleOption(activityManager, newActivityIndex, 0);
  }

  updateCombinedSchedules(activityManager);

  updateActivitiesAndScheduleOptions(activityManager);
}

function addScheduleOption(activityManager, activityIndex) {
  const scheduleOptionIndex =
    activityManager.activities[activityIndex].addScheduleOption();
  updateActivitiesAndScheduleOptions(activityManager);
  // Poner la nueva hora de clase en estado de edición
  editingScheduleOption(activityManager, activityIndex, scheduleOptionIndex);
}

function deactivateScheduleOption(
  activityManager,
  activityIndex,
  scheduleOptionIndex
) {
  // Cambia el estado de la hora de clase
  activityManager.activities[activityIndex].scheduleOptions[
    scheduleOptionIndex
  ].deactivate();

  updateCombinedSchedules(activityManager);

  updateActivitiesAndScheduleOptions(activityManager);
}

function deleteScheduleOption(
  activityManager,
  activityIndex,
  scheduleOptionIndex
) {
  const scheduleOption =
    activityManager.activities[activityIndex].scheduleOptions[scheduleOptionIndex];

  const newScheduleOptionIndex = activityManager.activities[
    activityIndex
  ].deleteScheduleOption(scheduleOptionIndex);
  if (activityManager.activities[activityIndex].scheduleOptions.length > 0) {
    if (scheduleOption.isEditing) {
      // Si todavía hay horas de clase para esta asignatura, editamos la siguiente hora de clase
      editingScheduleOption(
        activityManager,
        activityIndex,
        newScheduleOptionIndex
      );
    }
  } else {
    // Si no hay más horas de clase para esta asignatura, eliminamos la asignatura
    const newActivityIndex = activityManager.deleteActivity(activityIndex);
    if (activityManager.activities.length > 0) {
      if (scheduleOption.isEditing) {
        editingScheduleOption(activityManager, newActivityIndex, 0);
      }
    } else {
      createInitialTable(activityManager);
    }
  }

  updateCombinedSchedules(activityManager);

  updateActivitiesAndScheduleOptions(activityManager);
}

export function editingScheduleOption(
  activityManager,
  activityIndex,
  scheduleOptionIndex
) {
  // Verifica si la hora de clase seleccionada está inactivo
  if (
    !activityManager.activities[activityIndex].scheduleOptions[scheduleOptionIndex]
      .isActive
  ) {
    return; // Si la hora de clase está inactiva, retorna y no hagas nada más
  }

  // Asegúrate de que todos las horas de clase no estén siendo editadas
  activityManager.activities.forEach((activity) => {
    activity.scheduleOptions.forEach((scheduleOption) => {
      scheduleOption.stopEditing();
    });
  });

  // Edita la hora de clase seleccionada
  activityManager.activities[activityIndex].scheduleOptions[
    scheduleOptionIndex
  ].edit();

  updateActivitiesAndScheduleOptions(activityManager);

  loadScheduleOption(activityManager);
}
