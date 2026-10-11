// Storage helper managing localStorage caching, offline queues, and mock state
import { 
  SEED_DISASTERS, 
  SEED_SENSORS, 
  SEED_SENSOR_READINGS, 
  SEED_ALERTS, 
  SEED_AI_RECOMMENDATIONS, 
  SEED_EVACUATION_PLANS, 
  SEED_CITIZEN_REPORTS,
  SEED_USERS 
} from "./seedData";

const STORAGE_KEYS = {
  DISASTERS: "disastershield_disasters",
  SENSORS: "disastershield_sensors",
  READINGS: "disastershield_readings",
  ALERTS: "disastershield_alerts",
  AI_RECS: "disastershield_ai_recs",
  EVACUATIONS: "disastershield_evacuations",
  REPORTS: "disastershield_reports",
  OFFLINE_QUEUE: "disastershield_offline_queue",
  USERS: "disastershield_users",
  LAST_SYNC: "disastershield_last_sync",
  DEMO_MODE: "disastershield_demo_mode"
};

export const getFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Error reading localStorage key", key, e);
    return fallback;
  }
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (e) {
    console.error("Error saving to localStorage key", key, e);
  }
};

export const initializeSeedStorage = (force = false) => {
  if (force || !localStorage.getItem(STORAGE_KEYS.DISASTERS)) {
    saveToStorage(STORAGE_KEYS.DISASTERS, SEED_DISASTERS);
    saveToStorage(STORAGE_KEYS.SENSORS, SEED_SENSORS);
    saveToStorage(STORAGE_KEYS.READINGS, SEED_SENSOR_READINGS);
    saveToStorage(STORAGE_KEYS.ALERTS, SEED_ALERTS);
    saveToStorage(STORAGE_KEYS.AI_RECS, SEED_AI_RECOMMENDATIONS);
    saveToStorage(STORAGE_KEYS.EVACUATIONS, SEED_EVACUATION_PLANS);
    saveToStorage(STORAGE_KEYS.REPORTS, SEED_CITIZEN_REPORTS);
    saveToStorage(STORAGE_KEYS.USERS, SEED_USERS);
    saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, []);
    saveToStorage(STORAGE_KEYS.DEMO_MODE, true);
    return true;
  }
  return false;
};

// Queue citizen reports while offline
export const queueOfflineReport = (report) => {
  const queue = getFromStorage(STORAGE_KEYS.OFFLINE_QUEUE, []);
  const queuedItem = {
    ...report,
    queuedAt: new Date().toISOString(),
    isOfflineQueued: true
  };
  queue.push(queuedItem);
  saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  return queuedItem;
};

export const getOfflineQueue = () => {
  return getFromStorage(STORAGE_KEYS.OFFLINE_QUEUE, []);
};

export const clearOfflineQueue = () => {
  saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, []);
};

export { STORAGE_KEYS };
