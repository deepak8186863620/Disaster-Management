import { 
  db, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  isLiveFirebaseConfigured 
} from "./firebase";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "./storageHelper";

const COLLECTION_NAME = "users";

export const userService = {
  async getUsers() {
    if (isLiveFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveToStorage(STORAGE_KEYS.USERS, list);
          return list;
        }
      } catch (err) {
        console.warn("Firestore users fetch error:", err);
      }
    }
    return getFromStorage(STORAGE_KEYS.USERS, []);
  },

  async updateUserRole(userId, newRole) {
    // Only valid roles
    const validRoles = ["citizen", "officer", "admin", "sensor_agent"];
    if (!validRoles.includes(newRole)) throw new Error("Invalid role specified");

    if (isLiveFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, COLLECTION_NAME, userId), {
          role: newRole,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore update user role error:", err);
      }
    }

    const current = getFromStorage(STORAGE_KEYS.USERS, []);
    const updated = current.map(u => u.id === userId ? { ...u, role: newRole } : u);
    saveToStorage(STORAGE_KEYS.USERS, updated);
    window.dispatchEvent(new Event("users-updated"));
    return true;
  },

  async updateUserStatus(userId, newStatus) {
    const current = getFromStorage(STORAGE_KEYS.USERS, []);
    const updated = current.map(u => u.id === userId ? { ...u, status: newStatus } : u);
    saveToStorage(STORAGE_KEYS.USERS, updated);
    window.dispatchEvent(new Event("users-updated"));
    return true;
  }
};
