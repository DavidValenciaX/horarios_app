import { loadClassTime } from "./createTables.js";
import { updateCombinedSchedules } from "./combinations.js";
import generatePastelColor from "./colors.js";

export function updateSubjectsAndClassTimes(subjectManager) {
  const subjectsAndClassTimesDiv = document.getElementById(
    "subjectsAndClassTimes"
  );
  subjectsAndClassTimesDiv.innerHTML = "";

  const inactiveIcon = "🛇";
  const activeIcon = "✓";

  subjectManager.subjects.forEach((subject, subjectIndex) => {
    const parentDiv = document.createElement("div");

    const subjectChip = document.createElement("div");
    subjectChip.classList.add("chip", "subject");
    subjectChip.style.backgroundColor = subject.color;
    subjectChip.addEventListener("click", () => {
      editingClassTime(subjectManager, subjectIndex, 0);
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

    subject.classTimes.forEach((classTime, classTimeIndex) => {
      const classTimeChip = document.createElement("div");
      classTimeChip.classList.add("chip");
      classTimeChip.textContent = `Horario ${classTimeIndex + 1}`;
      classTimeChip.addEventListener("click", () => {
        editingClassTime(subjectManager, subjectIndex, classTimeIndex);
      });

      if (classTime.isEditing) {
        classTimeChip.classList.add("editing");
      }

      const closeIcon = document.createElement("span");
      closeIcon.classList.add("close-icon");
      closeIcon.textContent = "x";
      closeIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteClassTime(subjectManager, subjectIndex, classTimeIndex);
      });

      const disableIcon = document.createElement("span");
      disableIcon.classList.add("disable-icon");

      if (!classTime.isActive) {
        classTimeChip.classList.add("inactive");
        disableIcon.textContent = activeIcon;
      } else {
        disableIcon.textContent = inactiveIcon;
      }

      disableIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deactivateClassTime(subjectManager, subjectIndex, classTimeIndex);
      });

      classTimeChip.appendChild(closeIcon);
      classTimeChip.appendChild(disableIcon);
      parentDiv.appendChild(classTimeChip);
    });

    const addClassTimeChip = document.createElement("div");
    addClassTimeChip.classList.add("chip");
    addClassTimeChip.classList.add("add-classTime");
    addClassTimeChip.textContent = "+ Agregar Hora de Clase";
    addClassTimeChip.addEventListener("click", () => {
      addClassTime(subjectManager, subjectIndex);
    });

    parentDiv.appendChild(addClassTimeChip);
    subjectsAndClassTimesDiv.appendChild(parentDiv);
    subjectsAndClassTimesDiv.appendChild(document.createElement("hr"));
  });
  sumCredits(subjectManager);
}

export function createSubject(subjectManager) {
  const newSubjectName = document.getElementById("newSubjectName").value;
  let subjectCredits = document.getElementById("subjectCredits").value;

  if (!newSubjectName) {
    alert("Por favor ingrese un nombre de asignatura válido");
    return;
  }

  if (!subjectCredits || isNaN(subjectCredits)) {
    alert("Por favor ingrese la cantidad de créditos");
    return;
  }

  // Convertir a número y validar el rango
  subjectCredits = Number(subjectCredits);
  if (subjectCredits < 0 || subjectCredits > 10) {
    alert("Por favor ingrese un valor de créditos entre 0 y 10");
    return;
  }

  subjectManager.addSubject(
    newSubjectName,
    generatePastelColor(newSubjectName),
    subjectCredits
  );

  updateSubjectsAndClassTimes(subjectManager);

  // Poner la primera hora de clase de la nueva asignatura en estado de edición
  editingClassTime(subjectManager, subjectManager.subjects.length - 1, 0);

  document.getElementById("newSubjectName").value = "";
  document.getElementById("subjectCredits").value = "";
}

function deactivateSubject(subjectManager, subjectIndex) {
  subjectManager.subjects[subjectIndex].deactivate();

  updateCombinedSchedules(subjectManager);

  updateSubjectsAndClassTimes(subjectManager);
}

function deleteSubject(subjectManager, subjectIndex) {
  // Verifica si alguna hora de la asignatura está en edición antes de eliminarla
  let isAnyClassTimeEditing = subjectManager.subjects[
    subjectIndex
  ].classTimes.some((classTime) => classTime.isEditing);
  const newSubjectIndex = subjectManager.deleteSubject(subjectIndex);
  if (subjectManager.subjects.length <= 0) {
    createInitialTable(subjectManager);
  } else if (isAnyClassTimeEditing) {
    editingClassTime(subjectManager, newSubjectIndex, 0);
  }

  updateCombinedSchedules(subjectManager);

  updateSubjectsAndClassTimes(subjectManager);
}

function addClassTime(subjectManager, subjectIndex) {
  const classTimeIndex = subjectManager.subjects[subjectIndex].addClassTime();
  updateSubjectsAndClassTimes(subjectManager);
  // Poner la nueva hora de clase en estado de edición
  editingClassTime(subjectManager, subjectIndex, classTimeIndex);
}

function deactivateClassTime(subjectManager, subjectIndex, classTimeIndex) {
  // Cambia el estado de la hora de clase
  subjectManager.subjects[subjectIndex].classTimes[classTimeIndex].deactivate();

  updateCombinedSchedules(subjectManager);

  updateSubjectsAndClassTimes(subjectManager);
}

function deleteClassTime(subjectManager, subjectIndex, classTimeIndex) {
  const classTime =
    subjectManager.subjects[subjectIndex].classTimes[classTimeIndex];

  const newClassTimeIndex =
    subjectManager.subjects[subjectIndex].deleteClassTime(classTimeIndex);
  if (subjectManager.subjects[subjectIndex].classTimes.length > 0) {
    if (classTime.isEditing) {
      // Si todavía hay horas de clase para esta asignatura, editamos la siguiente hora de clase
      editingClassTime(subjectManager, subjectIndex, newClassTimeIndex);
    }
  } else {
    // Si no hay más horas de clase para esta asignatura, eliminamos la asignatura
    const newSubjectIndex = subjectManager.deleteSubject(subjectIndex);
    if (subjectManager.subjects.length > 0) {
      if (classTime.isEditing) {
        editingClassTime(subjectManager, newSubjectIndex, 0);
      }
    } else {
      createInitialTable(subjectManager);
    }
  }

  updateCombinedSchedules(subjectManager);

  updateSubjectsAndClassTimes(subjectManager);
}

export function editingClassTime(subjectManager, subjectIndex, classTimeIndex) {
  // Verifica si la hora de clase seleccionada está inactivo
  if (
    !subjectManager.subjects[subjectIndex].classTimes[classTimeIndex].isActive
  ) {
    return; // Si la hora de clase está inactiva, retorna y no hagas nada más
  }

  // Asegúrate de que todos las horas de clase no estén siendo editadas
  subjectManager.subjects.forEach((subject) => {
    subject.classTimes.forEach((classTime) => {
      classTime.stopEditing();
    });
  });

  // Edita la hora de clase seleccionada
  subjectManager.subjects[subjectIndex].classTimes[classTimeIndex].edit();

  updateSubjectsAndClassTimes(subjectManager);

  loadClassTime(subjectManager);
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
