import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "../services/storageHelper";
import { citizenService } from "../services/citizenService";
import { sensorService } from "../services/sensorService";
import { alertService } from "../services/alertService";

const SystemContext = createContext(null);

export const SystemProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [isTelemetrySimulating, setIsTelemetrySimulating] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const refreshSyncState = useCallback(async () => {
    const alerts = await alertService.getAlerts();
    setActiveAlerts(alerts.filter(a => a.status === "active"));

    const queue = getFromStorage(STORAGE_KEYS.OFFLINE_QUEUE, []);
    setOfflineQueueCount(queue.length);
    setLastSyncTime(new Date().toLocaleTimeString());
  }, []);

  // Listen to network status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      addToast("Network re-established. Syncing offline queue...", "info");
      const res = await citizenService.flushOfflineQueue();
      if (res.synced > 0) {
        addToast(`Successfully synchronized ${res.synced} offline incident reports to database!`, "success");
      }
      refreshSyncState();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast("You are offline. Offline cache activated. Incident reports will be queued.", "warning");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Initial fetch
    refreshSyncState();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addToast, refreshSyncState]);

  // Periodic sensor simulation ticker
  useEffect(() => {
    if (!isTelemetrySimulating) return;

    const interval = setInterval(() => {
      sensorService.simulateTelemetryPulse();
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 12000);

    return () => clearInterval(interval);
  }, [isTelemetrySimulating]);

  // Listen for alert updates
  useEffect(() => {
    const onAlertsChanged = () => {
      const alerts = getFromStorage(STORAGE_KEYS.ALERTS, []);
      setActiveAlerts(alerts.filter(a => a.status === "active"));
    };

    window.addEventListener("alerts-updated", onAlertsChanged);
    window.addEventListener("reports-updated", refreshSyncState);

    return () => {
      window.removeEventListener("alerts-updated", onAlertsChanged);
      window.removeEventListener("reports-updated", refreshSyncState);
    };
  }, [refreshSyncState]);

  const triggerManualSync = async () => {
    addToast("Synchronizing system data with Cloud Firestore...", "info");
    const res = await citizenService.flushOfflineQueue();
    if (res.synced > 0) {
      addToast(`Synchronized ${res.synced} queued incident reports!`, "success");
    }
    refreshSyncState();
  };

  const triggerSensorBurst = () => {
    sensorService.simulateTelemetryPulse();
    addToast("IoT sensor pulse triggered across hydrological & seismic nodes.", "info");
  };

  return (
    <SystemContext.Provider value={{
      isOnline,
      lastSyncTime,
      offlineQueueCount,
      activeAlerts,
      isTelemetrySimulating,
      setIsTelemetrySimulating,
      triggerSensorBurst,
      triggerManualSync,
      addToast,
      refreshSyncState
    }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-2xl border text-sm backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              toast.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : toast.type === "warning"
                ? "bg-amber-950/90 border-amber-500/50 text-amber-200"
                : toast.type === "danger"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
                : "bg-slate-900/90 border-blue-500/50 text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">
                {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠️" : toast.type === "danger" ? "🚨" : "ℹ️"}
              </span>
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);
