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
  static timeSlots = (() => {
    const slots = [];
    const formatHour = (hour) => {
      const h = hour % 24;
      const ampm = h >= 12 ? "PM" : "AM";
      let formattedHour = h % 12;
      if (formattedHour === 0) {
        formattedHour = 12;
      }
      return `${formattedHour}:00 ${ampm}`;
    };

    for (let i = 0; i < 24; i++) {
      const startHour = i;
      const endHour = i + 1;
      slots.push(`${formatHour(startHour)} - ${formatHour(endHour)}`);
    }
    return slots;
  })();

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
