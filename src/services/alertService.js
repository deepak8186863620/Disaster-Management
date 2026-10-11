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

const COLLECTION_NAME = "alerts";

export const alertService = {
  async getAlerts() {
    if (isLiveFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveToStorage(STORAGE_KEYS.ALERTS, list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore alerts fetch error:", err);
      }
    }
    return getFromStorage(STORAGE_KEYS.ALERTS, []);
  },

  async createAlert({ title, message, severity, affectedAreas, createdBy, createdByName }) {
    const alertRecord = {
      id: `alert-${Date.now()}`,
      title,
      message,
      severity: severity || "warning",
      affectedAreas: Array.isArray(affectedAreas) ? affectedAreas : [affectedAreas],
      createdBy: createdBy || "officer-01",
      createdByName: createdByName || "Emergency Command Center",
      status: "active",
      createdAt: new Date().toISOString()
    };

    if (isLiveFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...alertRecord,
          createdAtServer: serverTimestamp()
        });
        alertRecord.id = docRef.id;
      } catch (err) {
        console.warn("Firestore create alert error:", err);
      }
    }

    const current = getFromStorage(STORAGE_KEYS.ALERTS, []);
    saveToStorage(STORAGE_KEYS.ALERTS, [alertRecord, ...current]);
    window.dispatchEvent(new Event("alerts-updated"));

    // Also trigger browser notification if allowed
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification(`🚨 ${alertRecord.title}`, {
          body: alertRecord.message,
          icon: "/favicon.svg"
        });
      } catch (e) {
        // Notification blocked in some frames
      }
    }

    return alertRecord;
  },

  async archiveAlert(id) {
    if (isLiveFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, COLLECTION_NAME, id), {
          status: "archived",
          archivedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore archive alert error:", err);
      }
    }

    const current = getFromStorage(STORAGE_KEYS.ALERTS, []);
    const updated = current.map(item => item.id === id ? { ...item, status: "archived" } : item);
    saveToStorage(STORAGE_KEYS.ALERTS, updated);
    window.dispatchEvent(new Event("alerts-updated"));
    return true;
  }
};
