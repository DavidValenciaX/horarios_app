import { loadSchedule } from "./createTables.js";
import { generateCombinedSchedules } from "./combinations.js";

export function updateSubjectsAndSchedules(subjectManager) {
  const subjectsAndSchedulesDiv = document.getElementById(
    "subjectsAndSchedules"
  );
  subjectsAndSchedulesDiv.innerHTML = "";

  const inactiveIcon = "🛇";
  const activeIcon = "✓";

  subjectManager.subjects.forEach((subject, subjectIndex) => {
    const parentDiv = document.createElement("div");

    const subjectChip = document.createElement("div");
    subjectChip.classList.add("chip", "subject");
    subjectChip.style.backgroundColor = subject.color;
    subjectChip.addEventListener("click", () => {
      editingSchedule(subjectManager, subjectIndex, 0);
    });
    // Creamos dos elementos diferentes para el nombre y los créditos
    const subjectName = document.createElement("div");
    subjectName.textContent = subject.name;

    const subjectCredits = document.createElement("div");
    subjectCredits.classList.add("credits");
    subjectCredits.textContent = "Créditos: " + subject.credits;

    const closeIcon = document.createElement("span");
    closeIcon.classList.add("close-icon");
    closeIcon.textContent = "x";
    closeIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSubject(subjectManager, subjectIndex);
    });

    const disableIcon = document.createElement("span");
    disableIcon.classList.add("disable-icon");

    if (!subject.isActive) {
      subjectChip.classList.add("inactive");
      disableIcon.textContent = activeIcon;
    } else {
      subjectChip.classList.remove("inactive");
      disableIcon.textContent = inactiveIcon;
    }

    disableIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      deactivateSubject(subjectManager, subjectIndex);
    });

    // Añadimos los elementos al chip de la asignatura
    subjectChip.appendChild(subjectName);
    subjectChip.appendChild(subjectCredits);
    subjectChip.appendChild(closeIcon);
    subjectChip.appendChild(disableIcon);
    parentDiv.appendChild(subjectChip);

    subject.schedules.forEach((schedule, scheduleIndex) => {
      const scheduleChip = document.createElement("div");
      scheduleChip.classList.add("chip");
      scheduleChip.textContent = `Horario ${scheduleIndex + 1}`;
      scheduleChip.addEventListener("click", () => {
        editingSchedule(subjectManager, subjectIndex, scheduleIndex);
      });

      if (schedule.isEditing) {
        scheduleChip.classList.add("editing");
      }

      const closeIcon = document.createElement("span");
      closeIcon.classList.add("close-icon");
      closeIcon.textContent = "x";
      closeIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteSchedule(subjectManager, subjectIndex, scheduleIndex);
      });

      const disableIcon = document.createElement("span");
      disableIcon.classList.add("disable-icon");

      if (!schedule.isActive) {
        scheduleChip.classList.add("inactive");
        disableIcon.textContent = activeIcon;
      } else {
        disableIcon.textContent = inactiveIcon;
      }

      disableIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deactivateSchedule(subjectManager, subjectIndex, scheduleIndex);
      });

      scheduleChip.appendChild(closeIcon);
      scheduleChip.appendChild(disableIcon);
      parentDiv.appendChild(scheduleChip);
    });

    const addScheduleChip = document.createElement("div");
    addScheduleChip.classList.add("chip");
    addScheduleChip.classList.add("add-schedule");
    addScheduleChip.textContent = "+ Añadir Horario";
    addScheduleChip.addEventListener("click", () => {
      addSchedule(subjectManager, subjectIndex);
    });

    parentDiv.appendChild(addScheduleChip);
    subjectsAndSchedulesDiv.appendChild(parentDiv);
    subjectsAndSchedulesDiv.appendChild(document.createElement("hr"));
  });
  sumCredits(subjectManager);
}

function addSchedule(subjectManager, subjectIndex) {
  const scheduleIndex = subjectManager.subjects[subjectIndex].addSchedule();
  updateSubjectsAndSchedules(subjectManager);
  // Poner el nuevo horario en estado de edición
  editingSchedule(subjectManager, subjectIndex, scheduleIndex);
}

function sumCredits(subjectManager) {
  const showCredits = document.getElementById("showCredits");

  let sumCredits = 0;
  subjectManager.subjects.forEach((subject) => {
    if (subject.isActive) {
      sumCredits += parseInt(subject.credits);
    }
  });

  let textColor = sumCredits > 20 ? "red" : "inherit";

  showCredits.innerHTML =
    sumCredits > 0
      ? `<h4 style="color: ${textColor};">Suma de creditos: ${sumCredits}</h4>`
      : "";
}

export function updateCombinedSchedules(subjectManager) {
  const combinedSchedulesContainer = document.getElementById(
    "combinedSchedulesContainer"
  );
  if (combinedSchedulesContainer.innerHTML !== "") {
    generateCombinedSchedules(subjectManager);
  }
}

function deactivateSubject(subjectManager, subjectIndex) {
  subjectManager.subjects[subjectIndex].deactivate();

  updateCombinedSchedules(subjectManager);

  updateSubjectsAndSchedules(subjectManager);
}

function deactivateSchedule(subjectManager, subjectIndex, scheduleIndex) {
  // Cambia el estado del horario
  subjectManager.subjects[subjectIndex].schedules[scheduleIndex].deactivate();

  updateCombinedSchedules(subjectManager);

  updateSubjectsAndSchedules(subjectManager);
}

function deleteSubject(subjectManager, subjectIndex) {
  // Verifica si algún horario de la asignatura está en edición antes de eliminarla
  let isAnyScheduleEditing = subjectManager.subjects[
    subjectIndex
  ].schedules.some((schedule) => schedule.isEditing);
  const newSubjectIndex = subjectManager.deleteSubject(subjectIndex);
  if (subjectManager.subjects.length <= 0) {
    createInitialTable(subjectManager);
  } else if (isAnyScheduleEditing) {
    editingSchedule(subjectManager, newSubjectIndex, 0);
  }

  updateCombinedSchedules(subjectManager);

  updateSubjectsAndSchedules(subjectManager);
}

function deleteSchedule(subjectManager, subjectIndex, scheduleIndex) {
  const schedule =
    subjectManager.subjects[subjectIndex].schedules[scheduleIndex];

  const newScheduleIndex =
    subjectManager.subjects[subjectIndex].deleteSchedule(scheduleIndex);
  if (subjectManager.subjects[subjectIndex].schedules.length > 0) {
    if (schedule.isEditing) {
      // Si todavía hay horarios para esta asignatura, editamos el siguiente horario
      editingSchedule(subjectManager, subjectIndex, newScheduleIndex);
    }
  } else {
    // Si no hay más horarios para esta asignatura, eliminamos la asignatura
    const newSubjectIndex = subjectManager.deleteSubject(subjectIndex);
    if (subjectManager.subjects.length > 0) {
      if (schedule.isEditing) {
        editingSchedule(subjectManager, newSubjectIndex, 0);
      }
    } else {
      createInitialTable(subjectManager);
    }
  }

  updateCombinedSchedules(subjectManager);

  updateSubjectsAndSchedules(subjectManager);
}

export function editingSchedule(subjectManager, subjectIndex, scheduleIndex) {
  // Verifica si el horario seleccionado está inactivo
  if (
    !subjectManager.subjects[subjectIndex].schedules[scheduleIndex].isActive
  ) {
    return; // Si el horario está inactivo, retorna y no hagas nada más
  }

  // Asegúrate de que todos los horarios no estén siendo editados
  subjectManager.subjects.forEach((subject) => {
    subject.schedules.forEach((schedule) => {
      schedule.stopEditing();
    });
  });

  // Edita el horario seleccionado
  subjectManager.subjects[subjectIndex].schedules[scheduleIndex].edit();

  updateSubjectsAndSchedules(subjectManager);

  loadSchedule(subjectManager);
}
