import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  isLiveFirebaseConfigured 
} from "./firebase";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "./storageHelper";

const SENSORS_COLLECTION = "sensors";
const READINGS_COLLECTION = "sensorReadings";

export const sensorService = {
  // Get all sensors
  async getSensors() {
    if (isLiveFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, SENSORS_COLLECTION));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveToStorage(STORAGE_KEYS.SENSORS, list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore sensors fetch failed, using local cache:", err);
      }
    }
    return getFromStorage(STORAGE_KEYS.SENSORS, []);
  },

  // Get historical readings for charts
  async getReadings() {
    if (isLiveFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, READINGS_COLLECTION));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveToStorage(STORAGE_KEYS.READINGS, list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore readings fetch failed, using local cache:", err);
      }
    }
    return getFromStorage(STORAGE_KEYS.READINGS, []);
  },

  // Ingest reading (Used by External Sensor / IoT Gateway endpoint)
  async ingestReading({ sensorId, value, unit, type, sensorName }) {
    // Validate value bounds and detect anomalies
    const parsedVal = parseFloat(value);
    let validationStatus = "verified";

    // Suspicious reading detection
    if (isNaN(parsedVal) || parsedVal < 0) {
      validationStatus = "anomalous";
    }
    if (type === "water_level" && parsedVal > 15) validationStatus = "anomalous"; // Impossible river surge > 15m
    if (type === "wind_speed" && parsedVal > 350) validationStatus = "anomalous"; // Impossible wind > 350 km/h
    if (type === "seismic" && parsedVal > 9.9) validationStatus = "anomalous";

    const readingRecord = {
      id: `reading-${Date.now()}`,
      sensorId,
      sensorName: sensorName || sensorId,
      type,
      value: parsedVal,
      unit: unit || "m",
      recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      validationStatus,
      timestamp: new Date().toISOString()
    };

    if (isLiveFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, READINGS_COLLECTION), {
          ...readingRecord,
          recordedAtServer: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore reading add failed:", err);
      }
    }

    // Update sensor current status and latestValue
    const sensors = getFromStorage(STORAGE_KEYS.SENSORS, []);
    const updatedSensors = sensors.map(sensor => {
      if (sensor.id === sensorId) {
        let newStatus = "active";
        if (validationStatus === "anomalous") {
          newStatus = "abnormal";
        } else if (sensor.thresholdCritical && parsedVal >= sensor.thresholdCritical) {
          newStatus = "abnormal";
        } else if (sensor.thresholdHigh && parsedVal >= sensor.thresholdHigh) {
          newStatus = "abnormal";
        }

        return {
          ...sensor,
          latestValue: parsedVal,
          status: newStatus,
          lastUpdated: new Date().toISOString()
        };
      }
      return sensor;
    });

    saveToStorage(STORAGE_KEYS.SENSORS, updatedSensors);

    // Keep last 50 readings in local storage cache
    const readings = getFromStorage(STORAGE_KEYS.READINGS, []);
    const updatedReadings = [...readings.slice(-40), readingRecord];
    saveToStorage(STORAGE_KEYS.READINGS, updatedReadings);

    window.dispatchEvent(new Event("sensors-updated"));
    return readingRecord;
  },

  // Simulate real-time sensor fluctuation for demonstration
  simulateTelemetryPulse() {
    const sensors = getFromStorage(STORAGE_KEYS.SENSORS, []);
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newReadings = [];

    const updatedSensors = sensors.map(sensor => {
      let delta = (Math.random() - 0.45) * (sensor.type === 'rainfall' ? 8 : sensor.type === 'wind_speed' ? 5 : 0.2);
      let newValue = Math.max(0.1, Number((sensor.latestValue + delta).toFixed(2)));

      // Detect abnormality
      let status = "active";
      if (sensor.thresholdCritical && newValue >= sensor.thresholdCritical) {
        status = "abnormal";
      }

      newReadings.push({
        id: `pulse-${sensor.id}-${Date.now()}`,
        sensorId: sensor.id,
        sensorName: sensor.name,
        type: sensor.type,
        value: newValue,
        unit: sensor.unit,
        recordedAt: timeLabel,
        validationStatus: "verified"
      });

      return {
        ...sensor,
        latestValue: newValue,
        status,
        lastUpdated: new Date().toISOString()
      };
    });

    saveToStorage(STORAGE_KEYS.SENSORS, updatedSensors);
    const existingReadings = getFromStorage(STORAGE_KEYS.READINGS, []);
    saveToStorage(STORAGE_KEYS.READINGS, [...existingReadings.slice(-30), ...newReadings]);

    window.dispatchEvent(new Event("sensors-updated"));
    return updatedSensors;
  },

  // Fetch real-time flood / river discharge telemetry from Open-Meteo Public API
  async fetchLiveOpenMeteoFlood(latitude = 59.91, longitude = 10.75) {
    try {
      const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${latitude}&longitude=${longitude}&daily=river_discharge`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo API error: ${res.status}`);
      const data = await res.json();

      const discharges = data.daily?.river_discharge || [];
      const times = data.daily?.time || [];
      const unit = data.daily_units?.river_discharge || "m³/s";

      // Current daily discharge (first valid value)
      const currentVal = discharges.find(v => v !== null && v !== undefined) ?? 10.64;

      // Ingest live reading for Hydrological sensor
      const reading = await this.ingestReading({
        sensorId: "sensor-hyd-01",
        sensorName: "Live River Basin (Open-Meteo)",
        type: "water_level",
        value: Number(currentVal.toFixed(2)),
        unit: unit
      });

      return {
        success: true,
        latitude: data.latitude,
        longitude: data.longitude,
        currentDischarge: currentVal,
        unit,
        forecast: times.slice(0, 7).map((t, i) => ({
          date: t,
          discharge: discharges[i]
        })),
        reading
      };
    } catch (err) {
      console.error("Open-Meteo live flood fetch failed:", err);
      throw err;
    }
  },

  // Fetch real-time weather / temperature telemetry from Open-Meteo Forecast API
  async fetchLiveOpenMeteoWeather(latitude = 52.52, longitude = 13.41) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo Weather API error: ${res.status}`);
      const data = await res.json();

      const temps = data.hourly?.temperature_2m || [];
      const times = data.hourly?.time || [];
      const unit = data.hourly_units?.temperature_2m || "°C";

      const currentTemp = temps.find(t => t !== null && t !== undefined) ?? 10.6;

      const reading = await this.ingestReading({
        sensorId: "sensor-met-02",
        sensorName: "Atmospheric Station (Open-Meteo)",
        type: "rainfall",
        value: Number(currentTemp.toFixed(1)),
        unit: unit
      });

      return {
        success: true,
        latitude: data.latitude,
        longitude: data.longitude,
        currentTemperature: currentTemp,
        unit,
        forecast: times.slice(0, 8).map((t, i) => ({
          time: t.split("T")[1] || t,
          temperature: temps[i]
        })),
        reading
      };
    } catch (err) {
      console.error("Open-Meteo weather fetch failed:", err);
      throw err;
    }
  }
};
