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

const COLLECTION_NAME = "evacuationPlans";

export const evacuationService = {
  async getPlans() {
    if (isLiveFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveToStorage(STORAGE_KEYS.EVACUATIONS, list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore evacuation plans fetch error:", err);
      }
    }
    return getFromStorage(STORAGE_KEYS.EVACUATIONS, []);
  },

  async createPlan(planData) {
    const newPlan = {
      id: `evac-${Date.now()}`,
      disasterEventId: planData.disasterEventId || "",
      disasterTitle: planData.disasterTitle || "General Hazard Plan",
      affectedAreas: planData.affectedAreas || [],
      priority: planData.priority || "IMMEDIATE",
      status: planData.status || "active",
      instructions: planData.instructions || [
        "Proceed immediately to nearest designated shelter via primary clear route.",
        "Keep communication channels open; keep mobile phones charged.",
        "Do not return to low-lying structures until all-clear siren sounds."
      ],
      shelters: planData.shelters || [
        {
          id: `shelter-${Date.now()}`,
          name: "Central Community Hall Shelter",
          address: "Civil Lines Ward 4",
          latitude: 19.0700,
          longitude: 72.8800,
          capacity: 1000,
          currentOccupancy: 150,
          contact: "+91 22 2600 0000",
          facilities: ["Medical First Aid", "Drinking Water", "Bedding"]
        }
      ],
      approvedBy: planData.approvedBy || "Commanding Emergency Officer",
      createdAt: new Date().toISOString()
    };

    if (isLiveFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...newPlan,
          createdAtServer: serverTimestamp()
        });
        newPlan.id = docRef.id;
      } catch (err) {
        console.warn("Firestore create evac plan error:", err);
      }
    }

    const current = getFromStorage(STORAGE_KEYS.EVACUATIONS, []);
    saveToStorage(STORAGE_KEYS.EVACUATIONS, [newPlan, ...current]);
    window.dispatchEvent(new Event("evacuations-updated"));
    return newPlan;
  },

  async updateShelterOccupancy(planId, shelterId, newOccupancy) {
    const plans = getFromStorage(STORAGE_KEYS.EVACUATIONS, []);
    const updated = plans.map(p => {
      if (p.id === planId) {
        const updatedShelters = p.shelters.map(s => {
          if (s.id === shelterId) {
            return { ...s, currentOccupancy: Math.min(s.capacity, Math.max(0, newOccupancy)) };
          }
          return s;
        });
        return { ...p, shelters: updatedShelters };
      }
      return p;
    });

    saveToStorage(STORAGE_KEYS.EVACUATIONS, updated);
    window.dispatchEvent(new Event("evacuations-updated"));
    return true;
  },

  async updatePlanStatus(planId, newStatus) {
    const plans = getFromStorage(STORAGE_KEYS.EVACUATIONS, []);
    const updated = plans.map(p => p.id === planId ? { ...p, status: newStatus } : p);
    saveToStorage(STORAGE_KEYS.EVACUATIONS, updated);
    window.dispatchEvent(new Event("evacuations-updated"));
    return true;
  }
};
