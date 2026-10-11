import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  isLiveFirebaseConfigured 
} from "./firebase";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "./storageHelper";

const COLLECTION_NAME = "disasterEvents";

export const disasterService = {
  // Get all disaster records
  async getAll() {
    if (isLiveFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          saveToStorage(STORAGE_KEYS.DISASTERS, list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore fetch failed, using cached storage:", err);
      }
    }
    return getFromStorage(STORAGE_KEYS.DISASTERS, []);
  },

  // Create new disaster event
  async create(data) {
    const newRecord = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: data.status || "active",
      severity: data.severity || "high"
    };

    if (isLiveFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...newRecord,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        newRecord.id = docRef.id;
      } catch (err) {
        console.warn("Firestore add failed, writing to local cache:", err);
        newRecord.id = `disaster-${Date.now()}`;
      }
    } else {
      newRecord.id = `disaster-${Date.now()}`;
    }

    const current = getFromStorage(STORAGE_KEYS.DISASTERS, []);
    const updated = [newRecord, ...current];
    saveToStorage(STORAGE_KEYS.DISASTERS, updated);
    window.dispatchEvent(new Event("disasters-updated"));
    return newRecord;
  },

  // Update existing disaster event
  async update(id, updates) {
    if (isLiveFirebaseConfigured && db) {
      try {
        const ref = doc(db, COLLECTION_NAME, id);
        await updateDoc(ref, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore update failed, fallback to local:", err);
      }
    }

    const current = getFromStorage(STORAGE_KEYS.DISASTERS, []);
    const updated = current.map(item => {
      if (item.id === id) {
        return { ...item, ...updates, updatedAt: new Date().toISOString() };
      }
      return item;
    });
    saveToStorage(STORAGE_KEYS.DISASTERS, updated);
    window.dispatchEvent(new Event("disasters-updated"));
    return true;
  },

  // Delete disaster event
  async delete(id) {
    if (isLiveFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (err) {
        console.warn("Firestore delete failed:", err);
      }
    }

    const current = getFromStorage(STORAGE_KEYS.DISASTERS, []);
    const filtered = current.filter(item => item.id !== id);
    saveToStorage(STORAGE_KEYS.DISASTERS, filtered);
    window.dispatchEvent(new Event("disasters-updated"));
    return true;
  }
};
