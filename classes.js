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
      return `${formattedHour}:00 ${ampm}`;
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
        timeTable[day][timeSlot] = "";
      }
    }
    return timeTable;
  }
}

class ScheduleOption {
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
    let scheduleOption = new ScheduleOption(data.index);
    scheduleOption.timeTable = data.timeTable;
    scheduleOption.isActive = data.isActive;
    scheduleOption.isEditing = data.isEditing;
    return scheduleOption;
  }
}

class Activity {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.scheduleOptions = [new ScheduleOption(0)];
    this.isActive = true;
  }

  addScheduleOption() {
    this.scheduleOptions.forEach((scheduleOption) => {
      scheduleOption.stopEditing();
    });
    this.scheduleOptions.push(new ScheduleOption(this.scheduleOptions.length));
    return this.scheduleOptions.length - 1;
  }

  deactivate() {
    this.isActive = !this.isActive;
    this.scheduleOptions.forEach(
      (scheduleOption) => (scheduleOption.isActive = this.isActive)
    );
  }

  deleteScheduleOption(scheduleOptionIndex) {
    this.scheduleOptions.splice(scheduleOptionIndex, 1);

    // Se retorna el nuevo horario a ser editado
    let newScheduleOptionIndex =
      scheduleOptionIndex > 0 ? scheduleOptionIndex - 1 : 0;

    return newScheduleOptionIndex;
  }

  static fromJSON(data) {
    let activity = new Activity(data.name, data.color);
    activity.scheduleOptions = data.scheduleOptions.map(
      ScheduleOption.fromJSON
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
      activity.scheduleOptions.forEach((scheduleOption) => {
        scheduleOption.stopEditing();
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

export class Scenario {
  constructor(name) {
    this.name = name;
    this.activityManager = new ActivityManager();
  }

  static fromJSON(data) {
    const scenario = new Scenario(data.name);
    scenario.activityManager = ActivityManager.fromJSON(data.activityManager);
    return scenario;
  }
}

export class ScenarioManager {
  constructor() {
    this.scenarios = [];
    this.activeScenarioIndex = -1;
  }

  addScenario(name) {
    const newScenario = new Scenario(name);
    this.scenarios.push(newScenario);
    this.activeScenarioIndex = this.scenarios.length - 1;
    return this.activeScenarioIndex;
  }

  deleteScenario(index) {
    this.scenarios.splice(index, 1);
    if (this.activeScenarioIndex === index) {
      this.activeScenarioIndex = -1;
    } else if (this.activeScenarioIndex > index) {
      this.activeScenarioIndex--;
    }
  }

  setActiveScenario(index) {
    this.activeScenarioIndex = index;
  }

  getActiveScenario() {
    if (
      this.activeScenarioIndex < 0 ||
      this.activeScenarioIndex >= this.scenarios.length
    ) {
      return null;
    }
    return this.scenarios[this.activeScenarioIndex];
  }

  static fromJSON(data) {
    const scenarioManager = new ScenarioManager();
    if (data && Array.isArray(data.scenarios)) {
      scenarioManager.scenarios = data.scenarios.map(Scenario.fromJSON);
    }
    scenarioManager.activeScenarioIndex = -1;
    return scenarioManager;
  }
}
