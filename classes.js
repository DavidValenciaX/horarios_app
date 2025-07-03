//parte de anadir asignaturas y horarios
export class TimeTable {
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
      return `${formattedHour} ${ampm}`;
    };

    for (let i = 0; i < 24; i++) {
      const startHour = i;
      const endHour = i + 1;
      slots.push(`${formatHour(startHour)} - ${formatHour(endHour)}`);
    }
    return slots;
  })();

  static initializeTimeTable() {
    let timeTable = {};
    for (let day of TimeTable.days) {
      timeTable[day] = {};
      for (let timeSlot of TimeTable.timeSlots) {
        timeTable[day][timeSlot] = false;
      }
    }
    return timeTable;
  }
}

class ActivityScheduleOption {
  constructor(index) {
    this.index = index;
    this.timeTable = TimeTable.initializeTimeTable();
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
    let activityScheduleOption = new ActivityScheduleOption(data.index);
    activityScheduleOption.timeTable = data.timeTable;
    activityScheduleOption.isActive = data.isActive;
    activityScheduleOption.isEditing = data.isEditing;
    return activityScheduleOption;
  }
}

class Activity {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.activityScheduleOptions = [new ActivityScheduleOption(0)];
    this.isActive = true;
  }

  addActivityScheduleOption() {
    this.activityScheduleOptions.forEach((activityScheduleOption) => {
      activityScheduleOption.stopEditing();
    });
    this.activityScheduleOptions.push(new ActivityScheduleOption(this.activityScheduleOptions.length));
    return this.activityScheduleOptions.length - 1;
  }

  deactivate() {
    this.isActive = !this.isActive;
    this.activityScheduleOptions.forEach(
      (activityScheduleOption) => (activityScheduleOption.isActive = this.isActive)
    );
  }

  deleteActivityScheduleOption(activityScheduleOptionIndex) {
    this.activityScheduleOptions.splice(activityScheduleOptionIndex, 1);

    // Se retorna el nuevo horario a ser editado
    let newActivityScheduleOptionIndex =
      activityScheduleOptionIndex > 0 ? activityScheduleOptionIndex - 1 : 0;

    return newActivityScheduleOptionIndex;
  }

  static fromJSON(data) {
    let activity = new Activity(data.name, data.color);
    activity.activityScheduleOptions = data.activityScheduleOptions.map(
      ActivityScheduleOption.fromJSON
    );
    activity.isActive = data.isActive;
    return activity;
  }
}

export class ActivityManager {
  constructor() {
    this.activities = [];
  }

  addActivity(name, color) {
    this.activities.forEach((activity) => {
      activity.activityScheduleOptions.forEach((activityScheduleOption) => {
        activityScheduleOption.stopEditing();
      });
    });
    this.activities.push(new Activity(name, color));
  }

  deleteActivity(activityIndex) {
    this.activities.splice(activityIndex, 1);

    // Se retrna el nuevo indice a ser editado
    let newActivityIndex = activityIndex > 0 ? activityIndex - 1 : 0;

    return newActivityIndex;
  }

  static fromJSON(data) {
    let activityManager = new ActivityManager();
    activityManager.activities = data.activities.map(Activity.fromJSON);
    return activityManager;
  }
}

export class Schedule {
  constructor(name) {
    this.name = name;
    this.activityManager = new ActivityManager();
  }

  static fromJSON(data) {
    const schedule = new Schedule(data.name);
    schedule.activityManager = ActivityManager.fromJSON(data.activityManager);
    return schedule;
  }
}

export class ScheduleManager {
  constructor() {
    this.schedules = [];
    this.activeScheduleIndex = -1;
  }

  addSchedule(name) {
    const newSchedule = new Schedule(name);
    this.schedules.push(newSchedule);
    this.activeScheduleIndex = this.schedules.length - 1;
    return this.activeScheduleIndex;
  }

  deleteSchedule(index) {
    this.schedules.splice(index, 1);
    if (this.activeScheduleIndex === index) {
      this.activeScheduleIndex = -1;
    } else if (this.activeScheduleIndex > index) {
      this.activeScheduleIndex--;
    }
  }

  setActiveSchedule(index) {
    this.activeScheduleIndex = index;
  }

  getActiveSchedule() {
    if (
      this.activeScheduleIndex < 0 ||
      this.activeScheduleIndex >= this.schedules.length
    ) {
      return null;
    }
    return this.schedules[this.activeScheduleIndex];
  }

  static fromJSON(data) {
    const scheduleManager = new ScheduleManager();
    if (data && Array.isArray(data.schedules)) {
      scheduleManager.schedules = data.schedules.map(Schedule.fromJSON);
    }
    scheduleManager.activeScheduleIndex = -1;
    return scheduleManager;
  }
}
