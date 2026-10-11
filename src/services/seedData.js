// Realistic seed data for DisasterShield - AI-Powered Disaster Response System
// Clearly labeled as simulated emergency demonstration data.

export const SEED_DISASTERS = [
  {
    id: "disaster-flood-01",
    type: "flood",
    title: "Mithi River Basin Flash Flood",
    description: "Torrential downpours exceeded 180mm in 6 hours. Storm runoff caused water levels to breach critical safety margins at Kurla and BKC catchment areas.",
    latitude: 19.0657,
    longitude: 72.8797,
    affectedAreaName: "Kurla West & BKC Lowlands",
    severity: "critical",
    status: "active",
    radiusKm: 4.5,
    casualtiesReported: 0,
    evacueesCount: 840,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: "disaster-cyclone-02",
    type: "cyclone",
    title: "Cyclone Varun - Coastal Impact Phase",
    description: "Category 3 severe cyclonic storm approaching coastline. Sustained wind speeds of 135 km/h with storm surges projected at 2.8 meters along fishing harbors.",
    latitude: 18.9220,
    longitude: 72.8347,
    affectedAreaName: "South Bay & Colaba Coastal Belt",
    severity: "high",
    status: "monitoring",
    radiusKm: 12.0,
    casualtiesReported: 0,
    evacueesCount: 1520,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: "disaster-earthquake-03",
    type: "earthquake",
    title: "Seismic Tremor - Koyna Fault Line",
    description: "Moderate tectonic tremor registered at 5.4 magnitude on the Richter scale. Shallow focal depth (10km) causing structural hair cracks and rockslide risk on mountain bypasses.",
    latitude: 19.2183,
    longitude: 72.9781,
    affectedAreaName: "Ghodbunder Foothills & Thane Ridge",
    severity: "moderate",
    status: "monitoring",
    radiusKm: 8.0,
    casualtiesReported: 0,
    evacueesCount: 320,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export const SEED_SENSORS = [
  {
    id: "sensor-hyd-01",
    name: "Kurla River Bridge Gauge",
    type: "water_level",
    latitude: 19.0680,
    longitude: 72.8750,
    locationName: "Kurla Station Bridge (Mithi River)",
    latestValue: 4.85,
    unit: "meters",
    thresholdHigh: 3.5,
    thresholdCritical: 4.5,
    status: "abnormal",
    batteryLevel: 91,
    lastUpdated: new Date(Date.now() - 180000).toISOString(),
    isSimulated: true
  },
  {
    id: "sensor-rain-02",
    name: "Santacruz Doppler Rain Gauge",
    type: "rainfall",
    latitude: 19.0896,
    longitude: 72.8656,
    locationName: "Santacruz Meteorological Station",
    latestValue: 64.2,
    unit: "mm/hr",
    thresholdHigh: 40.0,
    thresholdCritical: 60.0,
    status: "abnormal",
    batteryLevel: 88,
    lastUpdated: new Date(Date.now() - 120000).toISOString(),
    isSimulated: true
  },
  {
    id: "sensor-wind-03",
    name: "Harbor Anemometer Array",
    type: "wind_speed",
    latitude: 18.9300,
    longitude: 72.8400,
    locationName: "Gateway Marine Pier",
    latestValue: 82.5,
    unit: "km/h",
    thresholdHigh: 65.0,
    thresholdCritical: 90.0,
    status: "active",
    batteryLevel: 95,
    lastUpdated: new Date(Date.now() - 90000).toISOString(),
    isSimulated: true
  },
  {
    id: "sensor-seis-04",
    name: "Koyna Ridge Seismometer",
    type: "seismic",
    latitude: 19.2150,
    longitude: 72.9820,
    locationName: "Thane Geological Station 4",
    latestValue: 3.2,
    unit: "Richter",
    thresholdHigh: 4.0,
    thresholdCritical: 5.5,
    status: "active",
    batteryLevel: 99,
    lastUpdated: new Date(Date.now() - 300000).toISOString(),
    isSimulated: true
  },
  {
    id: "sensor-hyd-05",
    name: "Dharavi Canal Flow Meter",
    type: "water_level",
    latitude: 19.0420,
    longitude: 72.8580,
    locationName: "Dharavi Culvert Junction",
    latestValue: 2.1,
    unit: "meters",
    thresholdHigh: 3.0,
    thresholdCritical: 4.0,
    status: "active",
    batteryLevel: 76,
    lastUpdated: new Date(Date.now() - 240000).toISOString(),
    isSimulated: true
  }
];

export const SEED_SENSOR_READINGS = [
  { id: "read-01", sensorId: "sensor-hyd-01", sensorName: "Kurla River Bridge Gauge", type: "water_level", value: 3.2, unit: "m", recordedAt: "10:00", validationStatus: "verified" },
  { id: "read-02", sensorId: "sensor-hyd-01", sensorName: "Kurla River Bridge Gauge", type: "water_level", value: 3.8, unit: "m", recordedAt: "11:00", validationStatus: "verified" },
  { id: "read-03", sensorId: "sensor-hyd-01", sensorName: "Kurla River Bridge Gauge", type: "water_level", value: 4.4, unit: "m", recordedAt: "12:00", validationStatus: "verified" },
  { id: "read-04", sensorId: "sensor-hyd-01", sensorName: "Kurla River Bridge Gauge", type: "water_level", value: 4.85, unit: "m", recordedAt: "13:00", validationStatus: "anomalous" },
  
  { id: "read-05", sensorId: "sensor-rain-02", sensorName: "Santacruz Doppler Rain Gauge", type: "rainfall", value: 18.0, unit: "mm/hr", recordedAt: "10:00", validationStatus: "verified" },
  { id: "read-06", sensorId: "sensor-rain-02", sensorName: "Santacruz Doppler Rain Gauge", type: "rainfall", value: 32.5, unit: "mm/hr", recordedAt: "11:00", validationStatus: "verified" },
  { id: "read-07", sensorId: "sensor-rain-02", sensorName: "Santacruz Doppler Rain Gauge", type: "rainfall", value: 55.0, unit: "mm/hr", recordedAt: "12:00", validationStatus: "verified" },
  { id: "read-08", sensorId: "sensor-rain-02", sensorName: "Santacruz Doppler Rain Gauge", type: "rainfall", value: 64.2, unit: "mm/hr", recordedAt: "13:00", validationStatus: "anomalous" },

  { id: "read-09", sensorId: "sensor-wind-03", sensorName: "Harbor Anemometer Array", type: "wind_speed", value: 45.0, unit: "km/h", recordedAt: "10:00", validationStatus: "verified" },
  { id: "read-10", sensorId: "sensor-wind-03", sensorName: "Harbor Anemometer Array", type: "wind_speed", value: 58.0, unit: "km/h", recordedAt: "11:00", validationStatus: "verified" },
  { id: "read-11", sensorId: "sensor-wind-03", sensorName: "Harbor Anemometer Array", type: "wind_speed", value: 74.0, unit: "km/h", recordedAt: "12:00", validationStatus: "verified" },
  { id: "read-12", sensorId: "sensor-wind-03", sensorName: "Harbor Anemometer Array", type: "wind_speed", value: 82.5, unit: "km/h", recordedAt: "13:00", validationStatus: "verified" }
];

export const SEED_ALERTS = [
  {
    id: "alert-01",
    title: "RED ALERT: High Flood Hazard at Kurla Lowlands",
    message: "Water levels at Mithi River have exceeded 4.8m. Ground floor residents in Kurla West (Ward L) are advised to evacuate immediately to designated relief shelters.",
    severity: "emergency",
    affectedAreas: ["Kurla West", "BKC", "Bail Bazar"],
    createdBy: "officer-01",
    createdByName: "Capt. Rajesh Sharma (EOC Lead)",
    status: "active",
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: "alert-02",
    title: "CYCLONE ADVISORY: Marine Harbor Warning",
    message: "Wind speeds over 80 km/h detected. Fishermen are strictly prohibited from entering deep sea. Moored boats must be reinforced immediately.",
    severity: "warning",
    affectedAreas: ["Colaba Harbor", "Sassoon Docks", "Worli Koliwada"],
    createdBy: "officer-01",
    createdByName: "Capt. Rajesh Sharma (EOC Lead)",
    status: "active",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export const SEED_AI_RECOMMENDATIONS = [
  {
    id: "rec-flood-01",
    disasterEventId: "disaster-flood-01",
    disasterTitle: "Mithi River Basin Flash Flood",
    riskLevel: "CRITICAL",
    explanation: "Combined telemetry shows river gauge at 4.85m (+1.35m above flood danger threshold) coinciding with high tide window in 45 minutes. Runoff velocity predicts waterlogging depth exceeding 1.2 meters across arterial roadways within 2 hours.",
    affectedLocations: ["Kurla West Ward L", "BKC G-Block", "Bail Bazar Sector 4"],
    recommendedActions: [
      "Deploy NDRF Team 4 with inflatable rescue boats to Kurla West rail underpass",
      "Cut electrical grid power to low-lying substations at Bail Bazar to prevent electrocution hazards",
      "Reroute vehicular traffic from LBS Marg via Eastern Express Highway",
      "Open Municipal Schools #12 and #15 as priority warm shelters"
    ],
    suggestedEvacuationPriority: "IMMEDIATE",
    approvalStatus: "pending",
    reviewedBy: null,
    overrideNotes: "",
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    isAIGenerated: true
  },
  {
    id: "rec-cyclone-02",
    disasterEventId: "disaster-cyclone-02",
    disasterTitle: "Cyclone Varun - Coastal Impact Phase",
    riskLevel: "HIGH",
    explanation: "Barometric pressure drop to 978 hPa indicates intensifying peripheral bands. Structural risks to temporary roofs and utility poles along shoreline within 15 km radius.",
    affectedLocations: ["South Bay Promenade", "Colaba Coastal Belt", "Cuffe Parade"],
    recommendedActions: [
      "Issue mandatory beach clearance and tourist evacuation notices",
      "Order preventative trimming of weak boughs near hospital grid lines",
      "Position emergency standby generators at St. George Hospital"
    ],
    suggestedEvacuationPriority: "HIGH_ALERT",
    approvalStatus: "approved",
    reviewedBy: "Capt. Rajesh Sharma",
    overrideNotes: "Approved with additional instruction for coastal fishing boat tie-downs.",
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    isAIGenerated: true
  }
];

export const SEED_EVACUATION_PLANS = [
  {
    id: "evac-01",
    disasterEventId: "disaster-flood-01",
    disasterTitle: "Mithi River Basin Flash Flood",
    affectedAreas: ["Kurla West", "Bail Bazar", "BKC Lowlands"],
    priority: "IMMEDIATE",
    status: "active",
    instructions: [
      "Move to higher ground immediately; do not walk or drive through flowing water.",
      "Bring emergency go-bag (medicines, documents, drinking water, phone powerbank).",
      "Elderly and infants are granted first boarding onto shuttle buses stationed at Phoenix Marketcity East Gate."
    ],
    shelters: [
      {
        id: "shelter-01",
        name: "Kurla Municipal High School Shelter #12",
        address: "Near Kurla Station West, Mumbai",
        latitude: 19.0712,
        longitude: 72.8830,
        capacity: 1200,
        currentOccupancy: 640,
        contact: "+91 22 2650 4411",
        facilities: ["Medical First Aid", "Dry Rations", "Clean Water", "Backup Power Generator"]
      },
      {
        id: "shelter-02",
        name: "BKC Sports Complex Emergency Relief Center",
        address: "Bandra Kurla Complex, Bandra East",
        latitude: 19.0605,
        longitude: 72.8640,
        capacity: 2500,
        currentOccupancy: 810,
        contact: "+91 22 2659 0088",
        facilities: ["Field Hospital", "Ambulance Bay", "Food Distribution", "Child Care Facility"]
      }
    ],
    approvedBy: "Capt. Rajesh Sharma",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export const SEED_CITIZEN_REPORTS = [
  {
    id: "report-01",
    citizenId: "citizen-demo-01",
    citizenName: "Aarav Mehta",
    disasterType: "flood",
    description: "Water level is waist high outside Kurla railway subway. Three vehicles stalled and water is entering ground floor shops.",
    location: {
      lat: 19.0665,
      lng: 72.8785,
      address: "Kurla Subway West, Mumbai"
    },
    imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80",
    status: "verified",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "report-02",
    citizenId: "citizen-demo-02",
    citizenName: "Priya Nair",
    disasterType: "cyclone",
    description: "Large banyan tree fallen across coastal promenade blocking ambulance access toward Navy Nagar.",
    location: {
      lat: 18.9180,
      lng: 72.8290,
      address: "Cuffe Parade Coastal Road"
    },
    imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=600&q=80",
    status: "pending_verification",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export const SEED_USERS = [
  {
    id: "user-admin-01",
    name: "Dr. Ananya Roy",
    email: "admin@disastershield.org",
    role: "admin",
    status: "active",
    badgeNumber: "ADM-901",
    department: "National Disaster Management Authority",
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
  },
  {
    id: "user-officer-01",
    name: "Capt. Rajesh Sharma",
    email: "officer@disastershield.org",
    role: "officer",
    status: "active",
    badgeNumber: "EOC-402",
    department: "Emergency Operations Command (EOC)",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: "user-citizen-01",
    name: "Rohan Verma",
    email: "citizen@disastershield.org",
    role: "citizen",
    status: "active",
    badgeNumber: null,
    department: "Registered Citizen (Zone 3)",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: "user-sensor-01",
    name: "IoT Telemetry Gateway Service",
    email: "telemetry@sensors.disastershield.org",
    role: "sensor_agent",
    status: "active",
    badgeNumber: "IOT-GW-1",
    department: "Automated Weather & Seismic Network",
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString()
  }
];
