//parte de guardar y cargar archivos json

import { ActivityManager } from "./classes.js";
import { updateActivitiesAndScheduleOptions } from "./UI.js";
import { loadScheduleOption } from "./createTables.js";

export async function saveToFile(activityManager) {
  const dataStr = JSON.stringify(activityManager);
  const dataBlob = new Blob([dataStr], {
    type: "application/json;charset=utf-8",
  });

  // Verificar si showSaveFilePicker está disponible
  if (window.showSaveFilePicker) {
    try {
      // Configuración para el archivo a guardar
      const options = {
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
        suggestedName: "horarios.json",
      };

      // Mostrar el cuadro de diálogo para guardar el archivo
      const fileHandle = await window.showSaveFilePicker(options);
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(dataBlob);
      await writableStream.close();
      alert("Archivo guardado con éxito.");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el archivo.");
    }
  } else {
    // Método clásico para navegadores que no soportan showSaveFilePicker
    const dataUrl = URL.createObjectURL(dataBlob);

    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = dataUrl;
    downloadAnchor.download = "horarios.json";
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }
}

export function loadFromFile(activityManager) {
  const fileInput = document.getElementById("fileInput");
  const fileNameElement = document.getElementById("fileName");
  const file = fileInput.files[0];

  if (file) {
    // Actualizar el nombre del archivo seleccionado
    fileNameElement.textContent = " " + file.name;

    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);

        // Validación del formato
        if (!Array.isArray(data.activities)) {
          throw new Error("Formato no válido");
        }

        // Si la validación es exitosa, Actualiza activityManager con los datos cargados
        Object.assign(activityManager, ActivityManager.fromJSON(data));

        // Actualizar el selector de asignaturas
        updateActivitiesAndScheduleOptions(activityManager);

        loadScheduleOption(activityManager);
      } catch (error) {
        alert("Error al subir el archivo: " + error.message);
      }
    };

    reader.readAsText(file);
  } else {
    // Limpiar el nombre del archivo en caso de que no haya archivo seleccionado
    fileNameElement.textContent = "";
  }
}
