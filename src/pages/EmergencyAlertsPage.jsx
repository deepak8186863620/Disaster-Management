import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Plus, 
  Radio, 
  MapPin, 
  Clock, 
  Archive, 
  Volume2, 
  ShieldAlert,
  Send,
  Bell
} from "lucide-react";
import { alertService } from "../services/alertService";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";

export const EmergencyAlertsPage = () => {
  const { currentUser, hasRole } = useAuth();
  const { addToast } = useSystem();

  const [alerts, setAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "emergency",
    affectedAreas: ""
  });

  const loadAlerts = async () => {
    const data = await alertService.getAlerts();
    setAlerts(data);
  };

  useEffect(() => {
    loadAlerts();
    window.addEventListener("alerts-updated", loadAlerts);
    return () => window.removeEventListener("alerts-updated", loadAlerts);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const areas = formData.affectedAreas.split(",").map(a => a.trim()).filter(Boolean);
      await alertService.createAlert({
        title: formData.title,
        message: formData.message,
        severity: formData.severity,
        affectedAreas: areas.length > 0 ? areas : ["General Municipality"],
        createdBy: currentUser?.id,
        createdByName: `${currentUser?.name} (${currentUser?.role?.toUpperCase()})`
      });

      addToast("Emergency broadcast alert issued successfully across all channels!", "success");
      setIsModalOpen(false);
      setFormData({
        title: "",
        message: "",
        severity: "emergency",
        affectedAreas: ""
      });
    } catch (err) {
      addToast("Failed to broadcast alert: " + err.message, "danger");
    }
  };

  const handleArchive = async (id) => {
    await alertService.archiveAlert(id);
    addToast("Alert archived to historical registry.", "info");
  };

  const canBroadcast = hasRole("officer", "admin");

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === "all") return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
            <span>Emergency Public Alert & Early Warning Broadcasting</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Instantaneous citizen notification network. All alerts appear prominently on public portals and mobile devices.
          </p>
        </div>

        {canBroadcast && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Broadcast Emergency Alert</span>
          </button>
        )}
      </div>

      {/* Severity Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Filter Severity:</span>
        <div className="flex gap-1.5">
          {["all", "emergency", "warning", "advisory"].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterSeverity === sev 
                  ? "bg-slate-800 text-white border border-slate-700" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => {
          const isActive = alert.status === "active";
          const isEmergency = alert.severity === "emergency";

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all ${
                isEmergency && isActive
                  ? "bg-rose-950/40 border-rose-500/50 shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/40"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <StatusBadge value={alert.severity} type="severity" />
                  <StatusBadge value={alert.status} type="status" />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${isEmergency ? "text-rose-400 animate-bounce" : "text-amber-400"}`} />
                <span>{alert.title}</span>
              </h3>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                {alert.message}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-semibold text-slate-300">Target Sectors:</span>
                  <span className="font-mono text-slate-300">
                    {alert.affectedAreas?.join(", ") || "General Metropolitan Area"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-500">
                    By: {alert.createdByName}
                  </span>

                  {canBroadcast && isActive && (
                    <button
                      onClick={() => handleArchive(alert.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Archive className="w-3 h-3 text-slate-400" />
                      <span>Archive</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
            No alerts found under this classification.
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Public Emergency Broadcast"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Alert Severity Tier
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="emergency">🚨 EMERGENCY (Immediate Threat to Life/Property)</option>
              <option value="warning">⚠️ WARNING (Potential Hazard Within 6 Hours)</option>
              <option value="advisory">ℹ️ ADVISORY (Precautionary Public Guidance)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Broadcast Title / Headline
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FLASH FLOOD RED ALERT: Kurla & BKC Sectors"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Impacted Areas (Comma-separated)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kurla West, BKC Lowlands, Bail Bazar"
              value={formData.affectedAreas}
              onChange={(e) => setFormData({ ...formData, affectedAreas: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Instructional Message for Citizens
            </label>
            <textarea
              rows={4}
              required
              placeholder="Explicit life-safety instructions (e.g. Move to upper floors, stay clear of subway underpasses, proceed to Shelter #12)..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmit Emergency Broadcast</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
