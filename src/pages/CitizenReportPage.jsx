import React, { useState, useEffect } from "react";
import { 
  FileText, 
  MapPin, 
  Camera, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  WifiOff, 
  Navigation,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react";
import { citizenService } from "../services/citizenService";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import { StatusBadge } from "../components/common/StatusBadge";
import { DisasterMap } from "../components/map/DisasterMap";

export const CitizenReportPage = () => {
  const { currentUser, hasRole } = useAuth();
  const { isOnline, addToast, refreshSyncState } = useSystem();

  const [reports, setReports] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    disasterType: "flood",
    description: "",
    address: "",
    lat: 19.0760,
    lng: 72.8777,
    imageUrl: ""
  });

  const loadReports = async () => {
    const list = await citizenService.getReports();
    setReports(list);
  };

  useEffect(() => {
    loadReports();
    window.addEventListener("reports-updated", loadReports);
    return () => window.removeEventListener("reports-updated", loadReports);
  }, []);

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            address: prev.address || "Current GPS Location Coordinates"
          }));
          addToast("GPS coordinates acquired!", "success");
        },
        (err) => {
          addToast("Could not retrieve GPS coordinates: " + err.message, "warning");
        }
      );
    } else {
      addToast("Geolocation is not supported in this browser.", "warning");
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        citizenId: currentUser?.id || "citizen-public",
        citizenName: currentUser?.name || "Citizen Reporter",
        disasterType: formData.disasterType,
        description: formData.description,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          address: formData.address || "Impact Location"
        },
        imageUrl: formData.imageUrl || null
      };

      const result = await citizenService.submitReport(payload);

      if (result.isOffline) {
        addToast("Report queued locally in offline storage. Will auto-sync when online!", "warning");
      } else {
        addToast("Citizen incident report transmitted to Emergency Command Center!", "success");
      }

      // Reset form
      setFormData({
        disasterType: "flood",
        description: "",
        address: "",
        lat: 19.0760,
        lng: 72.8777,
        imageUrl: ""
      });
      setShowMapPicker(false);
      refreshSyncState();
    } catch (err) {
      addToast("Submission error: " + err.message, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (reportId, status) => {
    await citizenService.updateStatus(reportId, status);
    addToast(`Report marked as ${status.replace("_", " ").toUpperCase()}`, "info");
  };

  const canVerify = hasRole("officer", "admin");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-rose-500" />
          <span>Citizen Incident Reporting Center</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Crowdsourced ground reconnaissance. Reports are verified by emergency officers before triggering tactical response.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Incident Submission */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Submit Ground Report</span>
                {!isOnline && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-normal">
                    <WifiOff className="w-3 h-3" /> Offline Queue
                  </span>
                )}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Step 1 of 1</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observed Disaster Type
                </label>
                <select
                  value={formData.disasterType}
                  onChange={(e) => setFormData({ ...formData, disasterType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="flood">🌊 Flood / Waterlogging</option>
                  <option value="cyclone">🌀 Cyclone / Severe Wind & Tree Fall</option>
                  <option value="earthquake">⚡ Earthquake / Structural Damage</option>
                  <option value="other">⚠️ Other Hazardous Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location Address / Landmark
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near Station Gate #2, Kurla West"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    title="Use GPS Coordinates"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="w-full py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 font-medium transition-colors"
              >
                {showMapPicker ? "✕ Close Map Coordinate Picker" : "🗺️ Pick Location on Interactive Map"}
              </button>

              {showMapPicker && (
                <div className="rounded-xl overflow-hidden border border-slate-800">
                  <DisasterMap
                    selectedLocation={{ lat: formData.lat, lng: formData.lng }}
                    onLocationSelect={(coords) => {
                      setFormData(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }));
                      addToast(`Selected coordinates: ${coords.lat}, ${coords.lng}`, "info");
                    }}
                    height="h-56"
                    zoom={12}
                  />
                  <div className="p-2 bg-slate-950 text-[10px] text-slate-400 text-center">
                    Click anywhere on the map to place the incident pin.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Incident Description & Conditions
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail water depth, stranded people, collapsed powerlines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Optional Ground Photo (Upload or Paste URL)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                  />
                  <input
                    type="url"
                    placeholder="Or paste image URL (e.g. https://...)"
                    value={formData.imageUrl.startsWith("data:") ? "" : formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {formData.imageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-40">
                  <img src={formData.imageUrl} alt="Incident preview" className="w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                    className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-rose-300"
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Transmitting..." : "Submit Incident Report"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right List: Submitted Reports Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Community Incident Feed ({reports.length})
            </h3>
            <span className="text-xs text-slate-400">
              Chronological Verification Log
            </span>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {reports.map(report => (
              <div
                key={report.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {report.disasterType === "flood" ? "🌊" : report.disasterType === "cyclone" ? "🌀" : "⚡"}
                      </span>
                      <span className="font-bold text-sm text-white capitalize">
                        {report.disasterType} Incident
                      </span>
                      {report.isOfflineQueued && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-semibold animate-pulse">
                          Offline Queued
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{report.location?.address || `${report.location?.lat}, ${report.location?.lng}`}</span>
                    </p>
                  </div>

                  <StatusBadge value={report.status} type="status" />
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  {report.description}
                </p>

                {report.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48">
                    <img 
                      src={report.imageUrl} 
                      alt="Incident attachment" 
                      className="w-full object-cover max-h-48"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Reported by: {report.citizenName || "Anonymous"}</span>
                  <span>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Officer verification actions */}
                {canVerify && report.status === "pending_verification" && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => handleStatusUpdate(report.id, "dismissed")}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Dismiss Report</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(report.id, "verified")}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify Incident</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {reports.length === 0 && (
              <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                No citizen reports logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
