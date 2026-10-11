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
import { 
  getFromStorage, 
  saveToStorage, 
  queueOfflineReport, 
  getOfflineQueue, 
  clearOfflineQueue, 
  STORAGE_KEYS 
} from "./storageHelper";

const COLLECTION_NAME = "citizenReports";

export const citizenService = {
  // Get all reports
  async getReports() {
    if (isLiveFirebaseConfigured && db && navigator.onLine) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveToStorage(STORAGE_KEYS.REPORTS, list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore reports fetch failed:", err);
      }
    }
    return getFromStorage(STORAGE_KEYS.REPORTS, []);
  },

  // Submit report (with automatic offline queueing if offline or Firestore error)
  async submitReport(reportData) {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    const baseReport = {
      ...reportData,
      status: "pending_verification",
      createdAt: new Date().toISOString()
    };

    if (!isOnline) {
      const queued = queueOfflineReport(baseReport);
      // Also update local list so the user immediately sees it marked as 'Offline Queued'
      const current = getFromStorage(STORAGE_KEYS.REPORTS, []);
      saveToStorage(STORAGE_KEYS.REPORTS, [{ ...queued, id: `offline-${Date.now()}` }, ...current]);
      window.dispatchEvent(new Event("reports-updated"));
      return { ...queued, isOffline: true };
    }

    let reportId = `rep-${Date.now()}`;
    if (isLiveFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...baseReport,
          serverTimestamp: serverTimestamp()
        });
        reportId = docRef.id;
      } catch (err) {
        console.warn("Firestore report submission error, queueing locally:", err);
        const queued = queueOfflineReport(baseReport);
        const current = getFromStorage(STORAGE_KEYS.REPORTS, []);
        saveToStorage(STORAGE_KEYS.REPORTS, [{ ...queued, id: reportId }, ...current]);
        window.dispatchEvent(new Event("reports-updated"));
        return { ...queued, isOffline: true };
      }
    }

    const savedReport = { ...baseReport, id: reportId };
    const current = getFromStorage(STORAGE_KEYS.REPORTS, []);
    saveToStorage(STORAGE_KEYS.REPORTS, [savedReport, ...current]);
    window.dispatchEvent(new Event("reports-updated"));
    return savedReport;
  },

  // Update report verification status (Emergency Officer / Admin)
  async updateStatus(id, newStatus) {
    if (isLiveFirebaseConfigured && db && navigator.onLine) {
      try {
        const ref = doc(db, COLLECTION_NAME, id);
        await updateDoc(ref, {
          status: newStatus,
          verifiedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore update report failed:", err);
      }
    }

    const current = getFromStorage(STORAGE_KEYS.REPORTS, []);
    const updated = current.map(item => item.id === id ? { ...item, status: newStatus } : item);
    saveToStorage(STORAGE_KEYS.REPORTS, updated);
    window.dispatchEvent(new Event("reports-updated"));
    return true;
  },

  // Flush offline queue when connectivity returns
  async flushOfflineQueue() {
    const queue = getOfflineQueue();
    if (!queue || queue.length === 0) return { synced: 0 };

    let syncedCount = 0;
    const currentReports = getFromStorage(STORAGE_KEYS.REPORTS, []);

    for (const item of queue) {
      try {
        if (isLiveFirebaseConfigured && db) {
          await addDoc(collection(db, COLLECTION_NAME), {
            citizenId: item.citizenId || "anonymous",
            citizenName: item.citizenName || "Citizen",
            disasterType: item.disasterType,
            description: item.description,
            location: item.location,
            imageUrl: item.imageUrl || null,
            status: "pending_verification",
            createdAt: item.createdAt || new Date().toISOString(),
            syncedAt: serverTimestamp()
          });
        }
        syncedCount++;
      } catch (err) {
        console.error("Failed to sync queued item:", err);
      }
    }

    // Remove isOfflineQueued flag from local list
    const updatedLocal = currentReports.map(rep => {
      if (rep.isOfflineQueued) {
        return { ...rep, isOfflineQueued: false, syncedNow: true };
      }
      return rep;
    });
    saveToStorage(STORAGE_KEYS.REPORTS, updatedLocal);
    clearOfflineQueue();
    window.dispatchEvent(new Event("reports-updated"));
    return { synced: syncedCount };
  }
};
