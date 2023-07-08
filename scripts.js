function createSubject() {
    const newSubjectName = document.getElementById('newSubjectName').value;
    const numberOfSchedules = document.getElementById('numberOfSchedules').value;
    
    if (!newSubjectName || numberOfSchedules <= 0) {
        alert('Por favor ingrese un nombre de asignatura válido y el número de horarios mayor que 0');
        return;
    }

    const subject = {
        subjectName: newSubjectName,
        numberOfSchedules: numberOfSchedules,
        schedules: Array.from({length: numberOfSchedules}, () => ({days: {}}))
    };

    horarios.asignaturas.push(subject);

    updateSubjectSelect();
    document.getElementById('newSubjectName').value = '';
    document.getElementById('numberOfSchedules').value = '1';
}

function updateSubjectSelect() {
    const subjectSelect = document.getElementById('subjectSelect');
    let options = '';
    horarios.asignaturas.forEach((subject, index) => {
        options += `<option value="${index}">${subject.subjectName}</option>`;
    });
    subjectSelect.innerHTML = options;
    updateScheduleSelect();
}

function updateScheduleSelect() {
    const scheduleSelect = document.getElementById('scheduleSelect');
    const selectedSubjectIndex = document.getElementById('subjectSelect').value;
    const selectedSubject = horarios.asignaturas[selectedSubjectIndex];
    let options = '';
    for (let i = 0; i < selectedSubject.numberOfSchedules; i++) {
        options += `<option value="${i}">Horario ${i + 1}</option>`;
    }
    scheduleSelect.innerHTML = options;
    loadSchedule();
}

function saveSchedule() {
    const selectedSubjectIndex = document.getElementById('subjectSelect').value;
    const selectedScheduleIndex = document.getElementById('scheduleSelect').value;

    // Comprueba si hay una asignatura seleccionada
    if (selectedSubjectIndex == "" || horarios.asignaturas[selectedSubjectIndex] === undefined) {
        alert('Crea primero una asignatura');
        return;
    }

    const selectedSchedule = horarios.asignaturas[selectedSubjectIndex].schedules[selectedScheduleIndex];

    const table = document.getElementById('scheduleTable');
    
    selectedSchedule.days = {};
    for (let day of days) {
        selectedSchedule.days[day] = {};
        for (let timeSlot of timeSlots) {
            selectedSchedule.days[day][timeSlot] = '';
        }
    }

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        for (let j = 1; j < row.cells.length; j++) {
            if (row.cells[j].classList.contains('selected')) {
                selectedSchedule.days[days[j-1]][timeSlots[i-1]] = 'x';
            }
        }
    }
    
    loadSchedule();

    // Cuando todo está hecho, muestra el icono de verificación.
    const scheduleSavedIcon = document.getElementById('scheduleSavedIcon');
    scheduleSavedIcon.textContent = '✔';

    // Eliminar el icono después de 1 segundos
    setTimeout(function() {
        scheduleSavedIcon.style.opacity = '0';
    }, 500);

    setTimeout(function() {
        scheduleSavedIcon.textContent = '';
        scheduleSavedIcon.style.opacity = '1';
    }, 1500);
}

function loadSchedule() {
    const selectedSubjectIndex = document.getElementById('subjectSelect').value;
    const selectedScheduleIndex = document.getElementById('scheduleSelect').value;
    const selectedSchedule = horarios.asignaturas[selectedSubjectIndex].schedules[selectedScheduleIndex];

    const table = document.getElementById('scheduleTable');

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        for (let j = 1; j < row.cells.length; j++) {
            const day = days[j - 1];
            const timeSlot = timeSlots[i - 1];
            if (selectedSchedule.days[day] && selectedSchedule.days[day][timeSlot] === 'x') {
                row.cells[j].classList.add('selected');
            } else {
                row.cells[j].classList.remove('selected');
            }
        }
    }
}

function saveToFile() {
    const dataStr = JSON.stringify(horarios);
    const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const dataUrl = URL.createObjectURL(dataBlob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = dataUrl;
    downloadAnchor.download = 'horarios.json';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}

function loadFromFile() {
    const fileInput = document.getElementById('fileInput');
    const fileNameElement = document.getElementById('fileName');
    const file = fileInput.files[0];

    if (file) {
        // Actualizar el nombre del archivo seleccionado
        fileNameElement.textContent = ' ' + file.name;

        const reader = new FileReader();

        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);

                // Validación del formato
                if (!Array.isArray(data.asignaturas)) {
                    throw new Error('Formato no válido');
                }

                // Si la validación es exitosa, reemplazar el objeto horarios
                horarios.asignaturas = data.asignaturas;

                // Actualizar el selector de asignaturas
                updateSubjectSelect();
            } catch (error) {
                alert('El archivo no tiene el formato adecuado.');
            }
        };

        reader.readAsText(file);
    } else {
        // Limpiar el nombre del archivo en caso de que no haya archivo seleccionado
        fileNameElement.textContent = '';
    }
}


let subjectColors = {};

function generateCombinedSchedules() {
    const combinedSchedulesContainer = document.getElementById('combinedSchedulesContainer');
    combinedSchedulesContainer.innerHTML = '';

    const combinedSchedules = getAllCombinations(horarios.asignaturas, 0);

    combinedSchedules.forEach((combinedSchedule, index) => {
        const table = createScheduleTable();
        const hasConflict = populateScheduleTable(table, combinedSchedule);

        if (hasConflict) {
            table.classList.add('hasConflict');
        }

        const header = document.createElement("h3");
        header.textContent = `Horario Combinado ${index + 1}${hasConflict ? ' (Cruce de Horarios)' : ''}`;
        
        // Crea un botón de descarga
        const downloadButton = document.createElement("button");
        downloadButton.textContent = "Descargar Imagen";
        downloadButton.onclick = function() {
            html2canvas(table).then(function(canvas) {
                const link = document.createElement("a");
                link.href = canvas.toDataURL();
                link.download = `horario-combinado-${index + 1}.png`;
                link.click();
            });
        };
        
        // Crea un div para agrupar el encabezado y el botón
        const headerDiv = document.createElement("div");
        headerDiv.appendChild(header);
        headerDiv.appendChild(downloadButton);
        
        // Añade el div y la tabla al contenedor
        combinedSchedulesContainer.appendChild(headerDiv);
        combinedSchedulesContainer.appendChild(table);
    });
    toggleConflictSchedules();
}


function getAllCombinations(subjects, index, currentSchedule = [], allCombinations = []) {
    if (index >= subjects.length) {
        allCombinations.push(currentSchedule.slice());
        return;
    }

    for (let i = 0; i < subjects[index].schedules.length; i++) {
        let scheduleWithSubjectName = {
            ...subjects[index].schedules[i],
            subjectName: subjects[index].subjectName  // Agregamos subjectName aquí
        };
        currentSchedule.push(scheduleWithSubjectName);
        getAllCombinations(subjects, index + 1, currentSchedule, allCombinations);
        currentSchedule.pop();
    }

    return allCombinations;
}

function createScheduleTable() {
    const table = document.createElement('table');
    let header = '<tr><th>Horas/días</th>';
    for (let day of days) {
        header += `<th>${day}</th>`;
    }
    header += '</tr>';
    table.innerHTML = header;
    for (let time of timeSlots) {
        let row = `<tr><td>${time}</td>`;
        for (let day of days) {
            row += `<td></td>`;
        }
        row += '</tr>';
        table.innerHTML += row;
    }
    return table;
}

function generatePastelColor() {
    const hue = Math.floor(Math.random() * 360); // Valor entre 0 y 360
    const saturation = Math.floor(Math.random() * 20) + 80; // Valor alto, entre 80 y 100
    const lightness = Math.floor(Math.random() * 20) + 70; // Valor alto, entre 70 y 90
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function populateScheduleTable(table, schedules) {
    let hasScheduleConflict = false;

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        for (let j = 1; j < row.cells.length; j++) {
            const day = days[j - 1];
            const timeSlot = timeSlots[i - 1];

            let cellContent = [];
            let subjectsInCell = 0;

            schedules.forEach((schedule) => {
                if (schedule.days[day] && schedule.days[day][timeSlot] === 'x') {
                    cellContent.push(schedule.subjectName); // Agregar nombre a cellContent como arreglo
                    subjectsInCell++;

                    // Asignar un color si no se ha asignado antes
                    if (!subjectColors[schedule.subjectName]) {
                        subjectColors[schedule.subjectName] = generatePastelColor();
                    }
                }
            });

            if (subjectsInCell > 1) {
                hasScheduleConflict = true;
                row.cells[j].style.backgroundColor = 'red'; // Color rojo intenso para conflictos
                row.cells[j].innerHTML = cellContent.join(' - '); // Unir nombres con guion
            } else if (cellContent.length > 0) {
                let subjectName = cellContent[0];
                row.cells[j].style.backgroundColor = subjectColors[subjectName];
                row.cells[j].innerHTML = cellContent.join(''); // Solo un nombre, sin guion
            }
        }
    }
    return hasScheduleConflict;
}

function toggleConflictSchedules() {
    const showConflicts = document.getElementById('toggleConflicts').checked;
    const combinedSchedulesContainer = document.getElementById('combinedSchedulesContainer');
    const tables = combinedSchedulesContainer.getElementsByTagName('table');

    for (let table of tables) {
        if (table.classList.contains('hasConflict') && !showConflicts) {
            table.style.display = 'none';
            // Ocultar el encabezado y el botón de descarga asociado
            table.previousSibling.style.display = 'none';
        } else {
            table.style.display = '';
            // Mostrar el encabezado y el botón de descarga asociado
            table.previousSibling.style.display = '';
        }
    }
}

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const timeSlots = [
    '6:00AM - 6:45AM', '7:00AM - 7:45AM', '8:00AM - 8:45AM', '9:00AM - 9:45AM',
    '10:00AM - 10:45AM', '11:00AM - 11:45AM', '12:00PM - 12:45PM', '1:00PM - 1:45PM',
    '2:00PM - 2:45PM', '3:00PM - 3:45PM', '4:00PM - 4:45PM', '5:00PM - 5:45PM',
    '5:45PM - 6:30PM', '6:30PM - 7:15PM', '7:15PM - 8:00PM', '8:15PM - 9:00PM',
    '9:00PM - 9:45PM', '9:45PM - 10:30PM'
];

const horarios = { asignaturas: [] };

function toggleCell(cell) {
    cell.classList.toggle('selected');
}

let isDragging = false;

function createTable() {
    const table = document.getElementById('scheduleTable');

    // Encabezado de la tabla
    let header = '<thead><tr><th>Horas/días</th>';
    for (let day of days) {
        header += `<th>${day}</th>`;
    }
    header += '</thead></tr>';
    table.innerHTML = header;

    let body = '<tbody>';
    let row = '';
    for (let time of timeSlots) {
        row += `<tr><th>${time}</th>`;
        for (let day of days) {
            row += `<td></td>`;
        }
        row += '</tr>';
    }
    body += row + '</tbody>';

    table.innerHTML += body;

    // Agrega los listeners a las celdas
    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        for (let j = 1; j < row.cells.length; j++) {
            const cell = row.cells[j];

            cell.addEventListener('mousedown', (e) => {
                isDragging = true;
                toggleCell(e.target);
            });

            cell.addEventListener('mouseover', (e) => {
                if (isDragging) {
                    toggleCell(e.target);
                }
            });

            cell.addEventListener('mouseup', (e) => {
                isDragging = false;
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createTable();
});

document.getElementById('numberOfSchedules').addEventListener('change', function() {
    if (this.value < 1) {
        this.value = 1;
    }
});
