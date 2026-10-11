# 📋 DisasterShield – Team Presentation & Code Explanation Guide

This guide divides the **DisasterShield – AI-Powered Disaster Response System** into **6 distinct, well-balanced modules** for a college project presentation or viva examination.

---

## 👥 Team Member Assignment Summary

| Member | Assigned Role & Module | Primary Source Files |
| :--- | :--- | :--- |
| **1. Deepak Prajapati** *(Team Lead)* | **Database Architecture, Cloud Firestore & Offline Cache** | `src/services/firebase.js`<br>`src/services/storageHelper.js` |
| **2. Sahasthra** | **Tactical Command Center & GIS Hazard Mapping** | `src/pages/DashboardPage.jsx`<br>`src/components/map/DisasterMap.jsx` |
| **3. Nishanth** | **IoT Sensor Telemetry & Real-Time Open-Meteo APIs** | `src/services/sensorService.js`<br>`src/pages/SensorMonitoringPage.jsx` |
| **4. Pritika** | **AI-Powered Risk Forecasting & Gemini Intelligence** | `src/services/aiService.js`<br>`src/pages/AIRecommendationsPage.jsx` |
| **5. Aaraadhyaa** | **Evacuation Routing Logistics & Multi-Channel Alerts** | `src/pages/EvacuationPlansPage.jsx`<br>`src/pages/EmergencyAlertsPage.jsx` |
| **6. Gautham** | **Role-Based Access Control (RBAC) & Citizen Crowdsourcing** | `src/context/AuthContext.jsx`<br>`src/pages/CitizenReportPage.jsx` |

---

## 1. Deepak Prajapati — Database Architecture, Cloud Firestore & Storage Engine

### 🎯 Key Responsibility
Explain how the system stores data, handles multi-tab synchronization, and guarantees 100% offline uptime during natural disasters when cell towers fail.

### 💡 Core Concepts to Speak About:
1. **Cloud Firestore NoSQL Architecture**: Explain the collections (`disasters`, `sensors`, `sensorReadings`, `alerts`, `aiRecommendations`, `citizenReports`).
2. **Persistent Multi-Tab Offline Cache**: How Firestore caches records in IndexedDB so the application still works without internet.
3. **Storage Fallback Helper (`storageHelper.js`)**: Graceful degradation to browser storage when offline or when operating in local test mode.

### 💻 Code to Explain:
```javascript
// File: src/services/firebase.js (Lines 57-65)
// Initializes Firestore with multi-tab offline persistence
db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
```
```javascript
// File: src/services/storageHelper.js
// Safe storage wrapper ensuring no data loss when network drops
export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn("Storage quota exceeded or storage disabled:", err);
  }
};
```

### 🎤 Speaking Script:
> *"Good morning professors. I worked on the Database Architecture, Cloud Firestore integration, and Offline Resilience. In disaster management, network towers frequently collapse. To solve this, I implemented Firestore's persistent multi-tab local caching alongside a local storage fallback layer. Our NoSQL schema is organized into modular collections for real-time synchronization between officers and field responders."*

---

## 2. Sahasthra — Tactical Command Center & GIS Hazard Mapping

### 🎯 Key Responsibility
Explain the main Operations Command Center, executive KPI metric calculation, and the Leaflet interactive OpenStreetMap visualization.

### 💡 Core Concepts to Speak About:
1. **Command Operations Center (`DashboardPage.jsx`)**: Central hub displaying real-time metrics (Active Hazards, Abnormal Sensors, Shelters, AI verification queue).
2. **Interactive GIS Map (`DisasterMap.jsx`)**: Renders custom OpenStreetMap layers with Leaflet, highlighting affected disaster radius zones (color-coded by severity) and safe shelter markers.
3. **Event Listener Pattern**: Using `window.addEventListener("disasters-updated")` to re-render UI when new telemetry arrives without reloading the browser.

### 💻 Code to Explain:
```javascript
// File: src/components/map/DisasterMap.jsx
// Renders dynamic geographic circles representing impacted disaster zones
<Circle
  center={[disaster.latitude, disaster.longitude]}
  radius={disaster.radiusKm * 1000}
  pathOptions={{
    color: disaster.severity === "critical" ? "#ef4444" : "#f59e0b",
    fillColor: disaster.severity === "critical" ? "#ef4444" : "#f59e0b",
    fillOpacity: 0.25
  }}
>
  <Popup>{disaster.title} - Severity: {disaster.severity.toUpperCase()}</Popup>
</Circle>
```

### 🎤 Speaking Script:
> *"I designed the Command Center and the GIS Hazard Radar. Emergency officers need instant situational awareness. Using Leaflet and OpenStreetMap, we render high-contrast geospatial circles mapping danger zones based on real-time disaster coordinates and evacuation radius."*

---

## 3. Nishanth — IoT Sensor Telemetry & Real-Time Open-Meteo APIs

### 🎯 Key Responsibility
Explain the IoT sensor stream ingestion, anomaly detection algorithms, and live public REST API integration (Open-Meteo Flood & Weather).

### 💡 Core Concepts to Speak About:
1. **IoT Sensor Grid (`SensorMonitoringPage.jsx`)**: Monitoring water levels, seismic activity, rain gauges, and wind speed.
2. **Anomaly Detection Algorithm**: Detecting suspicious spikes (e.g. impossible water surge > 15m or wind > 350 km/h) vs verified emergency spikes.
3. **Live Public Meteorological APIs (`sensorService.js`)**:
   - Open-Meteo Flood API: Fetches real-time river discharge (`m³/s`) with 7-day projections.
   - Open-Meteo Weather API: Fetches real-time ambient temperatures (`°C`) and hourly forecast.

### 💻 Code to Explain:
```javascript
// File: src/services/sensorService.js
// Fetches real-time river discharge from Open-Meteo Public Flood API
async fetchLiveOpenMeteoFlood(latitude = 59.91, longitude = 10.75) {
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${latitude}&longitude=${longitude}&daily=river_discharge`;
  const res = await fetch(url);
  const data = await res.json();
  const currentVal = data.daily?.river_discharge[0];

  return await this.ingestReading({
    sensorId: "sensor-hyd-01",
    sensorName: "Live River Basin (Open-Meteo)",
    type: "water_level",
    value: Number(currentVal.toFixed(2)),
    unit: data.daily_units?.river_discharge || "m³/s"
  });
}
```

### 🎤 Speaking Script:
> *"I developed the IoT Sensor Monitoring subsystem and live meteorological API integrations. We ingest data from hydrological and seismic sensors. Additionally, we directly query Open-Meteo's live global APIs for real-time river discharge and ambient temperatures, automatically flagging anomalies and triggering early hazard warnings."*

---

## 4. Pritika — AI-Powered Risk Forecasting & Gemini Intelligence

### 🎯 Key Responsibility
Explain how generative AI and structured emergency analysis assess risk, estimate casualties, and generate actionable officer recommendations.

### 💡 Core Concepts to Speak About:
1. **AI Risk Analysis Engine (`aiService.js`)**: Generates rapid incident risk ratings, affected population estimates, and tactical priorities.
2. **Google Gemini Integration**: Secure API call passing disaster telemetry, sensor thresholds, and citizen reports to generate structured response actions.
3. **Human-in-the-Loop Officer Approval**: AI recommendations remain in a "Pending" queue until a certified Emergency Officer reviews and approves them before action is taken.

### 💻 Code to Explain:
```javascript
// File: src/services/aiService.js
// Heuristic and Gemini prompt structuring for disaster risk analysis
const prompt = `You are an expert Meteorological and Disaster Response AI. Analyze the following emergency telemetry:
Disaster Type: ${disasterEvent.type}
Title: ${disasterEvent.title}
Affected Radius: ${disasterEvent.radiusKm} km
Sensor Readings: ${JSON.stringify(sensorReadings)}
Provide structured JSON with casualty risk score, infrastructure risk, and priority actions.`;
```

### 🎤 Speaking Script:
> *"I was responsible for the AI Risk Analysis and Gemini integration. In large-scale disasters, officers face cognitive overload. Our AI engine correlates sensor spikes with citizen reports to predict severity scores and prioritize critical resource deployment, ensuring that human officers always retain final verification authority."*

---

## 5. Aaraadhyaa — Evacuation Routing Logistics & Multi-Channel Alerts

### 🎯 Key Responsibility
Explain how the system calculates shelter capacity, manages evacuation logistics, and broadcasts emergency alerts to citizen devices.

### 💡 Core Concepts to Speak About:
1. **Evacuation Management (`EvacuationPlansPage.jsx`)**: Real-time shelter occupancy tracking (capacity vs. current evacuees), assembly points, and medical tent availability.
2. **Emergency Alert Broadcast System (`EmergencyAlertsPage.jsx`)**: Officers can broadcast alerts categorized by severity (`Critical`, `Warning`, `Advisory`) across Push, SMS, and Radio channels.
3. **Firebase Cloud Messaging (FCM)**: Push notification service worker registration (`firebase-messaging-sw.js`) for instant browser alerts.

### 💻 Code to Explain:
```javascript
// File: src/services/alertService.js
// Broadcasts high-priority alerts to citizen and responder channels
async createAlert({ title, message, severity, affectedAreas, channels }) {
  const newAlert = {
    id: `alert-${Date.now()}`,
    title,
    message,
    severity,
    affectedAreas: Array.isArray(affectedAreas) ? affectedAreas : [affectedAreas],
    channels: channels || ["push", "sms", "radio"],
    status: "active",
    createdAt: new Date().toISOString()
  };
  return await this.saveAlert(newAlert);
}
```

### 🎤 Speaking Script:
> *"I developed the Evacuation Routing and Emergency Alert subsystems. We track shelter capacities in real-time to avoid overcrowding. When officers initiate an evacuation, our alert engine broadcasts warnings with affected regions and instructions across multi-channel communication pipelines."*

---

## 6. Gautham — Role-Based Access Control (RBAC) & Citizen Crowdsourcing

### 🎯 Key Responsibility
Explain user authentication, role-based permissions (Officer vs Citizen vs Admin), and the citizen incident crowdsourcing workflow.

### 💡 Core Concepts to Speak About:
1. **Role-Based Access Control (RBAC) (`AuthContext.jsx`)**: Enforces access boundaries—citizens can report incidents and view alerts, while only verified officers can trigger evacuations or approve AI plans.
2. **Citizen Incident Reporting (`CitizenReportPage.jsx`)**: Crowdsourced reporting allowing citizens to submit incident descriptions, GPS coordinates, hazard types, and photo evidence.
3. **Field Responder Verification**: Incoming citizen reports are staged in a verification queue where responders validate or mark them as resolved.

### 💻 Code to Explain:
```javascript
// File: src/context/AuthContext.jsx
// Enforces role-based permissions across pages and navigation
export const hasRole = (allowedRoles = []) => {
  if (!currentUser) return false;
  if (currentUser.role === "admin") return true; // Superuser override
  return allowedRoles.includes(currentUser.role);
};
```

### 🎤 Speaking Script:
> *"I handled Authentication, Role-Based Access Control, and Citizen Crowdsourcing. We implement strict RBAC where officers access the operational command center and citizens access public safety guides and incident reporting. Citizen-reported incidents are fed into our triage pipeline with GPS tagging to help responders pinpoint localized emergencies."*

---

## 💡 Quick Tips for the Viva / Presentation:
- **Demonstrate Live**: Run the app on `http://localhost:5174/` and switch roles in the header (`Citizen` ➔ `Emergency Officer`) to show RBAC in action!
- **Show Live APIs**: Go to the **Sensor Telemetry** page and click **"Sync River Flood API"** or **"Sync Weather API"** to demonstrate live external REST calls.
- **Explain Offline Resilience**: Show that the app works even when disconnected due to persistent local storage and IndexedDB.
