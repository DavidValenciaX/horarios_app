//parte de guardar y cargar archivos json

import { ScenarioManager } from "./classes.js";
import { showDashboard } from "./UI.js";
import { apiService } from "./api.js";

export async function saveToFile(scenarioManager) {
  const dataStr = JSON.stringify(scenarioManager, null, 2); // Prettify JSON
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
        suggestedName: "scenarios.json",
      };

      const fileHandle = await window.showSaveFilePicker(options);
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(dataBlob);
      await writableStream.close();
      alert("Escenarios guardados con éxito.");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el archivo.");
    }
  } else {
    const dataUrl = URL.createObjectURL(dataBlob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = dataUrl;
    downloadAnchor.download = "scenarios.json";
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }
}

export function loadFromFile(scenarioManager) {
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
        if (!data || !Array.isArray(data.scenarios)) {
          throw new Error("Formato no válido. Se esperaba un objeto con una propiedad 'scenarios' que es un array.");
        }

        Object.assign(scenarioManager, ScenarioManager.fromJSON(data));

        showDashboard(scenarioManager);
        alert("Escenarios cargados correctamente.");
        
        // Auto-save loaded data if user is authenticated
        apiService.scheduleAutoSave(scenarioManager);
      } catch (error) {
        alert("Error al subir el archivo: " + error.message);
      }
    };

    reader.readAsText(file);
  } else {
    fileNameElement.textContent = "";
  }
}
