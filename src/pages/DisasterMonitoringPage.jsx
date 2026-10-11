import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Users, 
  AlertTriangle,
  Edit,
  Trash2,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { disasterService } from "../services/disasterService";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";

export const DisasterMonitoringPage = () => {
  const { currentUser, hasRole } = useAuth();
  const { addToast } = useSystem();

  const [disasters, setDisasters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "flood",
    description: "",
    affectedAreaName: "",
    latitude: 19.0760,
    longitude: 72.8777,
    severity: "high",
    status: "active",
    radiusKm: 5.0,
    casualtiesReported: 0
  });

  const loadDisasters = async () => {
    setLoading(true);
    try {
      const data = await disasterService.getAll();
      setDisasters(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisasters();
    window.addEventListener("disasters-updated", loadDisasters);
    return () => window.removeEventListener("disasters-updated", loadDisasters);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await disasterService.create({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radiusKm: parseFloat(formData.radiusKm),
        casualtiesReported: parseInt(formData.casualtiesReported, 10) || 0
      });
      addToast("Disaster incident logged successfully to command registry.", "success");
      setIsModalOpen(false);
      setFormData({
        title: "",
        type: "flood",
        description: "",
        affectedAreaName: "",
        latitude: 19.0760,
        longitude: 72.8777,
        severity: "high",
        status: "active",
        radiusKm: 5.0,
        casualtiesReported: 0
      });
    } catch (err) {
      addToast("Error creating disaster event: " + err.message, "danger");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await disasterService.update(id, { status: newStatus });
      addToast(`Disaster status updated to ${newStatus.toUpperCase()}`, "info");
    } catch (err) {
      addToast("Failed to update status", "danger");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this disaster record?")) {
      await disasterService.delete(id);
      addToast("Disaster record removed from registry.", "info");
    }
  };

  const filteredDisasters = disasters.filter(d => {
    const matchesSearch = 
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.affectedAreaName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || d.type === typeFilter;
    const matchesSeverity = severityFilter === "all" || d.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const canManage = hasRole("officer", "admin");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-rose-500" />
            <span>Disaster Monitoring & Incident Registry</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track and classify hydrological surges, cyclonic trajectories, and tectonic tremors.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register Disaster Event</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, location, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Disaster Types</option>
            <option value="flood">🌊 Flood</option>
            <option value="cyclone">🌀 Cyclone</option>
            <option value="earthquake">⚡ Earthquake</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Disaster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDisasters.map(disaster => (
          <div 
            key={disaster.id}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xl">
                  {disaster.type === "flood" ? "🌊" : disaster.type === "cyclone" ? "🌀" : "⚡"}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusBadge value={disaster.severity} type="severity" />
                  <StatusBadge value={disaster.status} type="status" />
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-1">
                {disaster.title}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{disaster.affectedAreaName}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                {disaster.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                <div>Hazard Radius: <span className="text-white">{disaster.radiusKm} km</span></div>
                <div>Coordinates: <span className="text-white">{disaster.latitude?.toFixed(2)}, {disaster.longitude?.toFixed(2)}</span></div>
              </div>

              {/* Status change actions for officers */}
              {canManage && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusChange(disaster.id, "active")}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${disaster.status === "active" ? "bg-rose-500/20 text-rose-300" : "text-slate-400 hover:text-white"}`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleStatusChange(disaster.id, "monitoring")}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${disaster.status === "monitoring" ? "bg-blue-500/20 text-blue-300" : "text-slate-400 hover:text-white"}`}
                    >
                      Monitor
                    </button>
                    <button
                      onClick={() => handleStatusChange(disaster.id, "resolved")}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${disaster.status === "resolved" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-white"}`}
                    >
                      Resolved
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(disaster.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDisasters.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <p className="text-sm text-slate-400">No disaster incidents found matching criteria.</p>
        </div>
      )}

      {/* Modal: Register New Disaster Event */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Disaster Event"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Disaster Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="flood">Flood (Hydrological)</option>
                <option value="cyclone">Cyclone (Meteorological)</option>
                <option value="earthquake">Earthquake (Seismic)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Rating</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Mithi River Inundation Phase 2"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Affected Area / Zone</label>
            <input
              type="text"
              required
              placeholder="e.g. Kurla West Ward L & BKC Basin"
              value={formData.affectedAreaName}
              onChange={(e) => setFormData({ ...formData, affectedAreaName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hazard Radius (km)</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.radiusKm}
                onChange={(e) => setFormData({ ...formData, radiusKm: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Description & Field Notes</label>
            <textarea
              rows={3}
              required
              placeholder="Describe telemetry breach, breach trajectory, immediate threats..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 shadow-lg shadow-rose-600/30"
            >
              Register Incident
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
