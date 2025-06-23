//parte de anadir asignaturas y horarios
export class TimeTable {
  constructor() {
    this.timeTable = this.initializeTimeTable();
  }

  static days = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  static timeSlots = [
    "6:00AM - 6:45AM",
    "7:00AM - 7:45AM",
    "8:00AM - 8:45AM",
    "9:00AM - 9:45AM",
    "10:00AM - 10:45AM",
    "11:00AM - 11:45AM",
    "12:00PM - 12:45PM",
    "1:00PM - 1:45PM",
    "2:00PM - 2:45PM",
    "3:00PM - 3:45PM",
    "4:00PM - 4:45PM",
    "5:00PM - 5:45PM",
    "5:45PM - 6:30PM",
    "6:30PM - 7:15PM",
    "7:15PM - 8:00PM",
    "8:15PM - 9:00PM",
    "9:00PM - 9:45PM",
    "9:45PM - 10:30PM",
  ];

  initializeTimeTable() {
    let timeTable = {};
    for (let day of TimeTable.days) {
      timeTable[day] = {};
      for (let timeSlot of TimeTable.timeSlots) {
        timeTable[day][timeSlot] = "";
      }
    }
    return timeTable;
  }

  static fromJSON(data) {
    const timeTableInstance = new TimeTable();
    timeTableInstance.timeTable = data;
    return timeTableInstance;
  }
}

class ClassTime {
  constructor(index) {
    this.index = index;
    this.timeTable = new TimeTable();
    this.isActive = true;
    this.isEditing = true;
  }

  deactivate() {
    this.isActive = !this.isActive;
  }

  edit() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }

  static fromJSON(data) {
    let classTime = new ClassTime(data.index);
    classTime.timeTable = TimeTable.fromJSON(data.timeTable);
    classTime.isActive = data.isActive;
    classTime.isEditing = data.isEditing;
    return classTime;
  }
}

class Subject {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.classTimes = [new ClassTime(0)];
    this.isActive = true;
  }

  addClassTime() {
    this.classTimes.forEach((classTime) => {
      classTime.stopEditing();
    });
    this.classTimes.push(new ClassTime(this.classTimes.length));
    return this.classTimes.length - 1;
  }

  deactivate() {
    this.isActive = !this.isActive;
    this.classTimes.forEach(
      (classTime) => (classTime.isActive = this.isActive)
    );
  }

  deleteClassTime(classTimeIndex) {
    this.classTimes.splice(classTimeIndex, 1);

    // Se retorna el nuevo horario a ser editado
    let newClassTimeIndex = classTimeIndex > 0 ? classTimeIndex - 1 : 0;

    return newClassTimeIndex;
  }

  static fromJSON(data) {
    let subject = new Subject(data.name, data.color);
    subject.classTimes = data.classTimes.map(ClassTime.fromJSON);
    subject.isActive = data.isActive;
    return subject;
  }
}

export class SubjectManager {
  constructor() {
    this.subjects = [];
  }

  addSubject(name, color) {
    this.subjects.forEach((subject) => {
      subject.classTimes.forEach((classTime) => {
        classTime.stopEditing();
      });
    });
    this.subjects.push(new Subject(name, color));
  }

  deleteSubject(subjectIndex) {
    this.subjects.splice(subjectIndex, 1);

    // Se retrna el nuevo indice a ser editado
    let newSubjectIndex = subjectIndex > 0 ? subjectIndex - 1 : 0;

    return newSubjectIndex;
  }

  static fromJSON(data) {
    let subjectManager = new SubjectManager();
    subjectManager.subjects = data.subjects.map(Subject.fromJSON);
    return subjectManager;
  }
}
