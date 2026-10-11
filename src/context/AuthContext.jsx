import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  isLiveFirebaseConfigured 
} from "../services/firebase";
import { userService } from "../services/userService";
import { SEED_USERS } from "../services/seedData";
import { getFromStorage, saveToStorage, STORAGE_KEYS, initializeSeedStorage } from "../services/storageHelper";

const AuthContext = createContext(null);

const CURRENT_USER_STORAGE_KEY = "disastershield_current_user";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    // Default to the Emergency Officer demo profile for rich initial experience
    return getFromStorage(CURRENT_USER_STORAGE_KEY, SEED_USERS[1]);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeSeedStorage();

    if (isLiveFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const users = await userService.getUsers();
          const match = users.find(u => u.email === firebaseUser.email || u.id === firebaseUser.uid);
          if (match) {
            setCurrentUser(match);
            saveToStorage(CURRENT_USER_STORAGE_KEY, match);
          } else {
            const newUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
              email: firebaseUser.email,
              role: "citizen", // Default safe role
              status: "active",
              createdAt: new Date().toISOString()
            };
            setCurrentUser(newUser);
            saveToStorage(CURRENT_USER_STORAGE_KEY, newUser);
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      if (isLiveFirebaseConfigured && auth) {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Match from existing users or fallback
      const users = await userService.getUsers();
      let matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!matched) {
        matched = {
          id: `user-${Date.now()}`,
          name: email.split("@")[0],
          email,
          role: "citizen",
          status: "active",
          createdAt: new Date().toISOString()
        };
      }
      setCurrentUser(matched);
      saveToStorage(CURRENT_USER_STORAGE_KEY, matched);
      setLoading(false);
      return { success: true, user: matched };
    } catch (err) {
      setLoading(false);
      // For demo resilience, if email matches demo seed users, let user in
      const demoMatch = SEED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (demoMatch) {
        setCurrentUser(demoMatch);
        saveToStorage(CURRENT_USER_STORAGE_KEY, demoMatch);
        return { success: true, user: demoMatch };
      }
      return { success: false, error: err.message };
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      let uid = `user-${Date.now()}`;
      if (isLiveFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
      }
      // Security check: users can NEVER assign themselves admin or officer role on registration
      const newUser = {
        id: uid,
        name,
        email,
        role: "citizen", // strictly citizen
        status: "active",
        createdAt: new Date().toISOString()
      };
      
      const users = await userService.getUsers();
      saveToStorage(STORAGE_KEYS.USERS, [newUser, ...users]);
      setCurrentUser(newUser);
      saveToStorage(CURRENT_USER_STORAGE_KEY, newUser);
      setLoading(false);
      return { success: true, user: newUser };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    if (isLiveFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Sign out error", e);
      }
    }
    // Switch to Citizen demo default or null
    setCurrentUser(SEED_USERS[2]); // Rohan Verma (Citizen)
    saveToStorage(CURRENT_USER_STORAGE_KEY, SEED_USERS[2]);
  };

  // Quick switch role (Essential for live defense / presentation testing)
  const switchDemoRole = (role) => {
    const matched = SEED_USERS.find(u => u.role === role) || SEED_USERS[0];
    setCurrentUser(matched);
    saveToStorage(CURRENT_USER_STORAGE_KEY, matched);
  };

  const hasRole = (...roles) => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      register,
      logout,
      switchDemoRole,
      hasRole,
      isLiveAuth: isLiveFirebaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
