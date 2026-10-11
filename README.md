# 🛡️ DisasterShield – AI-Powered Disaster Response System

A modern, responsive, full-stack disaster management and emergency operations platform designed for rapid hazard monitoring, IoT telemetry anomaly detection, AI-assisted risk analysis, and role-based incident coordination.

---

## 🌟 Key Features

- **Tactical Command Center**: Real-time surveillance of floods, cyclones, and seismic hazards across affected sectors with high-contrast interactive OpenStreetMap layers.
- **IoT Sensor Telemetry Grid**: Hydrological gauges, marine anemometers, Doppler rain meters, and seismic monitors with automatic threshold anomaly detection.
- **Live Public Meteorological APIs**:
  - **Open-Meteo Flood API**: Real-time river discharge telemetry (`m³/s`) with 7-day projection.
  - **Open-Meteo Weather API**: Hourly atmospheric temperature and storm tracking.
- **AI-Powered Risk Analysis**: Automated casualty and infrastructure risk forecasting with human-in-the-loop officer verification.
- **Emergency Broadcast Network**: Priority alert notifications for citizens and responders with push notifications and channel filtering.
- **Evacuation Routing & Shelters**: Shelter capacity monitoring, safe routes, and real-time evacuee tracking.
- **Role-Based Access Control (RBAC)**: Dedicated views for **Emergency Officers**, **Field Responders**, **System Administrators**, and **Citizens**.
- **Offline Resilient**: Local cache fallback ensuring uninterrupted emergency operations during network outages.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **Maps**: Leaflet & React Leaflet with OpenStreetMap
- **Data Visualizations**: Recharts
- **Icons**: Lucide React
- **Cloud & Realtime Sync**: Firebase Cloud Firestore & Firebase Auth
- **AI Integration**: Google Gemini API via secure serverless functions
- **Live APIs**: Open-Meteo Global Flood & Weather APIs

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- Git

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/deepak8186863620/Disaster-Management.git
cd Disaster-Management

# Install dependencies
npm install
```

### 3. Environment Setup (Optional)
Copy `.env.example` to `.env` to configure Firebase or Gemini AI keys:
```bash
cp .env.example .env
```
*(The system automatically runs in offline/standby demonstration mode with simulated IoT sensors and open public APIs even without external API keys).*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 5. Building for Production
```bash
npm run build
```

---

## 📂 Project Structure

```
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── charts/         # Recharts telemetry visualizers
│   │   ├── common/         # Navbar, Sidebar, Modals, Status Badges
│   │   └── map/            # Leaflet interactive GIS hazard maps
│   ├── context/            # AuthContext & SystemContext state providers
│   ├── pages/              # Command Center, Monitoring, Alerts, AI Recs
│   ├── services/           # Firebase, Open-Meteo, Sensor ingestion, Storage
│   ├── App.jsx             # Root layout and RBAC routing
│   ├── index.css           # Modern theme styling & custom scrollbars
│   └── main.jsx            # React root mount
├── .env.example            # Environment variables template
├── package.json
└── vite.config.js
```

---

## 📄 License
This project is open-source under the MIT License.
