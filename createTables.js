import { TimeTable } from "./subjects.js";
import { toggleCell } from "./scripts.js";

export function createScheduleTable() {
  const table = document.createElement("table");
  createTable(table);
  return table;
}

function createTable(table) {
  let header = "<thead><tr><th>Horas/días</th>";
  for (let day of TimeTable.days) {
    header += `<th>${day}</th>`;
  }
  header += "</thead></tr>";
  table.innerHTML = header;

  let body = "<tbody>";
  let row = "";
  for (let time of TimeTable.timeSlots) {
    row += `<tr><th>${time}</th>`;
    for (let day of TimeTable.days) {
      row += `<td></td>`;
    }
    row += "</tr>";
  }
  body += row + "</tbody>";
  table.innerHTML += body;
}

let isDragging = false;

export function createInitialTable() {
  const table = document.getElementById("scheduleTable");

  createTable(table);

  // Agrega los listeners a las celdas
  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 1; j < row.cells.length; j++) {
      const cell = row.cells[j];

      cell.addEventListener("mousedown", (e) => {
        isDragging = true;
        toggleCell(e.target);
      });

      cell.addEventListener("mouseover", (e) => {
        if (isDragging) {
          toggleCell(e.target);
        }
      });
    }
  }

  // Escucha el evento mouseup en el objeto window
  window.addEventListener("mouseup", (e) => {
    isDragging = false;
  });
}
