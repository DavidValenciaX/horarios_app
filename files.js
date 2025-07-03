//parte de guardar y cargar archivos json

import { ScheduleManager } from "./classes.js";
import { showDashboard } from "./UI.js";
import { apiService } from "./api.js";
import Swal from "sweetalert2";

export async function saveToFile(scheduleManager) {
  const dataStr = JSON.stringify(scheduleManager, null, 2); // Prettify JSON
  const dataBlob = new Blob([dataStr], {
    type: "application/json;charset=utf-8",
  });

  if (window.showSaveFilePicker) {
    try {
      const options = {
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
        suggestedName: "schedules.json",
      };

      const fileHandle = await window.showSaveFilePicker(options);
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(dataBlob);
      await writableStream.close();
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Horarios guardados con éxito.',
        confirmButtonText: 'Perfecto'
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el archivo.',
        confirmButtonText: 'Entendido'
      });
    }
  } else {
    const dataUrl = URL.createObjectURL(dataBlob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = dataUrl;
    downloadAnchor.download = "schedules.json";
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }
}

export function loadFromFile(scheduleManager) {
  const fileInput = document.getElementById("file-input");
  const fileNameElement = document.getElementById("file-name");
  const file = fileInput.files[0];

  if (file) {
    fileNameElement.textContent = " " + file.name;

    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);

        // Basic validation
        if (!data || !Array.isArray(data.schedules)) {
          throw new Error("Formato no válido. Se esperaba un objeto con una propiedad 'schedules' que es un array.");
        }

        Object.assign(scheduleManager, ScheduleManager.fromJSON(data));

        showDashboard(scheduleManager);
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Horarios cargados correctamente.',
          confirmButtonText: 'Perfecto'
        });
        
        // Auto-save loaded data if user is authenticated
        apiService.scheduleAutoSave(scheduleManager);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al subir el archivo: ' + error.message,
          confirmButtonText: 'Entendido'
        });
      }
    };

    reader.readAsText(file);
  } else {
    fileNameElement.textContent = "";
  }
}
