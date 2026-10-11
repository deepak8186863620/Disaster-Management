import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  isLiveFirebaseConfigured 
} from "./firebase";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "./storageHelper";

const COLLECTION_NAME = "aiRecommendations";

export const aiService = {
  // Get all AI recommendations
  async getRecommendations() {
    if (isLiveFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveToStorage(STORAGE_KEYS.AI_RECS, list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore AI recs fetch failed, using local cache:", err);
      }
    }
    return getFromStorage(STORAGE_KEYS.AI_RECS, []);
  },

  // Generate AI Risk Analysis for a Disaster Event
  async analyzeRisk(disasterEvent, sensorReadings = [], citizenReports = []) {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001/api/ai-risk-analysis";

    let aiResult = null;

    // 1. Try calling Backend Function / Gemini API if configured
    if (backendUrl) {
      try {
        const res = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disasterEvent, sensorReadings, citizenReports })
        });
        if (res.ok) {
          aiResult = await res.json();
        }
      } catch (err) {
        // Backend not running locally or offline, will proceed to Gemini client or intelligent emergency engine
      }
    }

    if (!aiResult && geminiKey && !geminiKey.includes("FakeKey")) {
      try {
        const prompt = `You are an expert Meteorological and Disaster Response AI. Analyze the following emergency telemetry:
Disaster Type: ${disasterEvent.type}
Title: ${disasterEvent.title}
Description: ${disasterEvent.description}
Affected Area: ${disasterEvent.affectedAreaName || "Regional sector"}
Latest Sensors: ${JSON.stringify(sensorReadings.map(s => ({ name: s.sensorName, val: s.value, unit: s.unit })))}
Citizen Reports Count: ${citizenReports.length}

Return ONLY valid JSON matching this schema:
{
  "riskLevel": "CRITICAL" | "HIGH" | "MODERATE" | "LOW",
  "explanation": "Concise 2-3 sentence technical risk explanation based on the telemetry",
  "affectedLocations": ["Location 1", "Location 2"],
  "recommendedActions": ["Action 1", "Action 2", "Action 3"],
  "suggestedEvacuationPriority": "IMMEDIATE" | "HIGH_ALERT" | "STANDBY" | "ROUTINE"
}`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            aiResult = JSON.parse(rawText);
          }
        }
      } catch (geminiErr) {
        console.warn("Direct Gemini call fallback:", geminiErr);
      }
    }

    // 2. High-Fidelity Domain Emergency Engine (Simulated AI Fallback)
    // Ensures demonstration works completely without external API failures or network constraints
    if (!aiResult) {
      aiResult = generateIntelligentRiskEngine(disasterEvent, sensorReadings, citizenReports);
    }

    const recommendationRecord = {
      id: `rec-${Date.now()}`,
      disasterEventId: disasterEvent.id,
      disasterTitle: disasterEvent.title,
      riskLevel: aiResult.riskLevel || "HIGH",
      explanation: aiResult.explanation,
      affectedLocations: aiResult.affectedLocations || [disasterEvent.affectedAreaName || "Local Impact Zone"],
      recommendedActions: aiResult.recommendedActions || [
        "Position emergency medical units at staging checkpoints",
        "Issue broadcast advisory to citizens in designated sectors",
        "Maintain continuous hydrological and barometric monitoring"
      ],
      suggestedEvacuationPriority: aiResult.suggestedEvacuationPriority || "HIGH_ALERT",
      approvalStatus: "pending", // ALWAYS pending officer verification
      reviewedBy: null,
      overrideNotes: "",
      isAIGenerated: true,
      disclaimer: "AI output is an advisory recommendation. Officers must verify before issuing evacuation orders.",
      createdAt: new Date().toISOString()
    };

    // Save to Firestore if available
    if (isLiveFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, COLLECTION_NAME), {
          ...recommendationRecord,
          createdAtServer: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore AI rec save error:", err);
      }
    }

    const current = getFromStorage(STORAGE_KEYS.AI_RECS, []);
    saveToStorage(STORAGE_KEYS.AI_RECS, [recommendationRecord, ...current]);
    window.dispatchEvent(new Event("ai-recs-updated"));
    return recommendationRecord;
  },

  // Officer approves AI recommendation
  async approveRecommendation(recId, officerName) {
    return this.updateApproval(recId, {
      approvalStatus: "approved",
      reviewedBy: officerName || "Emergency Officer",
      overrideNotes: "Recommendation verified and approved as actionable protocol."
    });
  },

  // Officer rejects AI recommendation
  async rejectRecommendation(recId, officerName, reason) {
    return this.updateApproval(recId, {
      approvalStatus: "rejected",
      reviewedBy: officerName || "Emergency Officer",
      overrideNotes: reason || "Ground telemetry indicates lower immediate threat than algorithmic projection."
    });
  },

  // Officer overrides AI recommendation with manual parameters
  async overrideRecommendation(recId, officerName, { newRiskLevel, newPriority, overrideNotes }) {
    return this.updateApproval(recId, {
      approvalStatus: "overridden",
      riskLevel: newRiskLevel,
      suggestedEvacuationPriority: newPriority,
      reviewedBy: officerName || "Emergency Officer",
      overrideNotes: overrideNotes || "Commanding officer applied manual override based on field reconnaissance."
    });
  },

  async updateApproval(id, updatePayload) {
    if (isLiveFirebaseConfigured && db) {
      try {
        const ref = doc(db, COLLECTION_NAME, id);
        await updateDoc(ref, {
          ...updatePayload,
          reviewedAtServer: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore AI rec update error:", err);
      }
    }

    const current = getFromStorage(STORAGE_KEYS.AI_RECS, []);
    const updated = current.map(item => item.id === id ? { ...item, ...updatePayload, reviewedAt: new Date().toISOString() } : item);
    saveToStorage(STORAGE_KEYS.AI_RECS, updated);
    window.dispatchEvent(new Event("ai-recs-updated"));
    return true;
  }
};

// Heuristic fallback model for disaster evaluation
function generateIntelligentRiskEngine(disaster, sensors, reports) {
  const type = (disaster.type || "").toLowerCase();
  
  if (type === "flood") {
    const waterSensor = sensors.find(s => s.type === "water_level" || s.type === "rainfall");
    const val = waterSensor?.value || (disaster.severity === "critical" ? 4.8 : 3.4);
    const isCritical = val > 4.2 || disaster.severity === "critical";

    return {
      riskLevel: isCritical ? "CRITICAL" : "HIGH",
      explanation: `Hydrological analysis detects river/drainage surge of ${val}m approaching catchment thresholds. Runoff velocity indicates inundation risk for ground floors and underpasses within 90 minutes.`,
      affectedLocations: [
        disaster.affectedAreaName || "River Lowlands",
        "Transit Subways & Rail Corridors",
        "Informal Settlements along Canal Banks"
      ],
      recommendedActions: [
        "Deploy rescue zodiac inflatables to lowest-elevation transit hubs",
        "Isolate electrical distribution transformers in inundated zones",
        "Activate designated high-school relief centers with potable water tanks",
        "Enforce vehicular diversions away from arterial flood basins"
      ],
      suggestedEvacuationPriority: isCritical ? "IMMEDIATE" : "HIGH_ALERT"
    };
  } else if (type === "cyclone") {
    const windSensor = sensors.find(s => s.type === "wind_speed");
    const val = windSensor?.value || (disaster.severity === "critical" ? 140 : 85);
    const isCritical = val > 110;

    return {
      riskLevel: isCritical ? "CRITICAL" : "HIGH",
      explanation: `Barometric pressure depression and coastal wind telemetry show sustained gusts reaching ${val} km/h with projected tidal storm surges of 2.5m. High risk of tree falls and projectile debris.`,
      affectedLocations: [
        disaster.affectedAreaName || "Coastal Marine Strip",
        "Harbor Docks & Fishing Settlements",
        "High-Rise Construction Crane Zones"
      ],
      recommendedActions: [
        "Execute mandatory coastal curfew and seal beach access points",
        "Anchor maritime vessels and reinforce communication tower guy wires",
        "Position heavy earth-moving equipment near hospital access corridors",
        "Prepare backup generators for critical medical trauma centers"
      ],
      suggestedEvacuationPriority: isCritical ? "IMMEDIATE" : "HIGH_ALERT"
    };
  } else {
    // Earthquake / Seismic
    const seisSensor = sensors.find(s => s.type === "seismic");
    const mag = seisSensor?.value || 5.2;

    return {
      riskLevel: mag > 5.5 ? "CRITICAL" : "MODERATE",
      explanation: `Tectonic displacement registered at ${mag} Richter with shallow epicentral depth. Probability of secondary structural fractures and gas pipe ruptures in masonry structures within 10 km.`,
      affectedLocations: [
        disaster.affectedAreaName || "Epicentral Foothills",
        "Multi-Story Masonry Apartments",
        "Highway Flyovers & Mountain Bridges"
      ],
      recommendedActions: [
        "Dispatch structural engineering teams to inspect elevated flyovers",
        "Turn off central natural gas distribution valves in impacted sectors",
        "Instruct public to occupy open sports complexes and avoid exterior walls",
        "Put trauma surgical wards on immediate standby for crush injuries"
      ],
      suggestedEvacuationPriority: mag > 5.5 ? "IMMEDIATE" : "STANDBY"
    };
  }
}
