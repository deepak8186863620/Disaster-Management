import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Activity, 
  AlertTriangle, 
  BrainCircuit, 
  Navigation, 
  MapPin, 
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Radio
} from "lucide-react";
import { disasterService } from "../services/disasterService";
import { sensorService } from "../services/sensorService";
import { alertService } from "../services/alertService";
import { aiService } from "../services/aiService";
import { evacuationService } from "../services/evacuationService";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import { StatusBadge } from "../components/common/StatusBadge";
import { DisasterMap } from "../components/map/DisasterMap";
import { DisasterDistributionBar } from "../components/charts/SensorCharts";

export const DashboardPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { isOnline } = useSystem();

  const [disasters, setDisasters] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [aiRecs, setAiRecs] = useState([]);
  const [evacuations, setEvacuations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const [d, s, a, r, e] = await Promise.all([
        disasterService.getAll(),
        sensorService.getSensors(),
        alertService.getAlerts(),
        aiService.getRecommendations(),
        evacuationService.getPlans()
      ]);
      setDisasters(d);
      setSensors(s);
      setAlerts(a);
      setAiRecs(r);
      setEvacuations(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();

    const handleUpdate = () => loadAll();
    window.addEventListener("disasters-updated", handleUpdate);
    window.addEventListener("sensors-updated", handleUpdate);
    window.addEventListener("alerts-updated", handleUpdate);
    window.addEventListener("ai-recs-updated", handleUpdate);
    window.addEventListener("evacuations-updated", handleUpdate);

    return () => {
      window.removeEventListener("disasters-updated", handleUpdate);
      window.removeEventListener("sensors-updated", handleUpdate);
      window.removeEventListener("alerts-updated", handleUpdate);
      window.removeEventListener("ai-recs-updated", handleUpdate);
      window.removeEventListener("evacuations-updated", handleUpdate);
    };
  }, []);

  const activeDisasters = disasters.filter(d => d.status === "active" || d.status === "monitoring");
  const abnormalSensors = sensors.filter(s => s.status === "abnormal");
  const pendingAiRecs = aiRecs.filter(r => r.approvalStatus === "pending");
  const activeAlertsList = alerts.filter(a => a.status === "active");

  const sheltersList = evacuations.flatMap(e => e.shelters || []);
  const totalShelterCapacity = sheltersList.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalShelterOccupancy = sheltersList.reduce((acc, s) => acc + (s.currentOccupancy || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 font-mono">
              Emergency Operations Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time hazard surveillance, IoT telemetry streams, and AI-assisted evacuation routing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {currentUser?.role !== "citizen" && (
            <button
              onClick={() => onNavigate("ai-recommendations")}
              className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <span>AI Analysis ({pendingAiRecs.length})</span>
            </button>
          )}

          <button
            onClick={() => onNavigate("citizen-reports")}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
          >
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Sleek Emergency Broadcast Ribbon (If active) */}
      {activeAlertsList.length > 0 && (
        <div 
          onClick={() => onNavigate("emergency-alerts")}
          className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 hover:border-rose-500/50 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-rose-300 mr-2 uppercase tracking-wider text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded">
                Active Broadcast
              </span>
              <span className="font-semibold text-white">
                {activeAlertsList[0].title}
              </span>
              <span className="text-slate-400 hidden md:inline ml-2">
                — {activeAlertsList[0].affectedAreas?.join(", ")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 whitespace-nowrap">
            <span>View Alerts ({activeAlertsList.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Hazards */}
        <div 
          onClick={() => onNavigate("disasters")}
          className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400">Active Hazards</span>
            <Flame className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            {activeDisasters.length}
          </div>
          <p className="text-[11px] text-rose-400/90 mt-1 font-medium">
            {disasters.filter(d => d.severity === "critical").length} Critical severity
          </p>
        </div>

        {/* Sensor Grid */}
        <div 
          onClick={() => onNavigate("sensors")}
          className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400">Sensor Grid</span>
            <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            {sensors.length} Nodes
          </div>
          <p className="text-[11px] text-amber-400/90 mt-1 font-medium">
            {abnormalSensors.length} Anomalies flagged
          </p>
        </div>

        {/* AI Recommendations */}
        <div 
          onClick={() => onNavigate("ai-recommendations")}
          className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400">AI Risk Queue</span>
            <BrainCircuit className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            {pendingAiRecs.length}
          </div>
          <p className="text-[11px] text-purple-300/90 mt-1 font-medium">
            Awaiting Officer Verification
          </p>
        </div>

        {/* Shelters */}
        <div 
          onClick={() => onNavigate("evacuation-plans")}
          className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400">Evacuation Shelters</span>
            <Navigation className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            {totalShelterOccupancy}
            <span className="text-xs font-normal text-slate-400 ml-1">/ {totalShelterCapacity}</span>
          </div>
          <p className="text-[11px] text-blue-400/90 mt-1 font-medium">
            {sheltersList.length} Operational Shelters
          </p>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Live Hazards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Geographic Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Geographic Incident & Sensor Radar
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Interactive OpenStreetMap Layer
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900/30">
            <DisasterMap 
              disasters={disasters}
              sensors={sensors}
              shelters={sheltersList}
              height="h-[460px]"
            />
          </div>
        </div>

        {/* Right 1 Col: Monitored Incidents & Analytics */}
        <div className="space-y-6">
          {/* Active Disaster Feed */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Active Incidents ({activeDisasters.length})
              </h3>
              <button 
                onClick={() => onNavigate("disasters")}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
              >
                <span>Details</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {activeDisasters.map(d => (
                <div 
                  key={d.id}
                  onClick={() => onNavigate("disasters")}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-white line-clamp-1">{d.title}</span>
                    <StatusBadge value={d.severity} type="severity" />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{d.affectedAreaName}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                    <span>Radius: {d.radiusKm} km</span>
                    <StatusBadge value={d.status} type="status" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disaster Type Distribution Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-1">
            <DisasterDistributionBar disasters={disasters} />
          </div>
        </div>
      </div>
    </div>
  );
};
