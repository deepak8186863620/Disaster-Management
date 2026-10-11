import React, { useState, useEffect } from "react";
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  AlertTriangle, 
  MapPin, 
  ShieldAlert, 
  FileText, 
  Activity,
  SlidersHorizontal,
  Clock,
  UserCheck
} from "lucide-react";
import { aiService } from "../services/aiService";
import { disasterService } from "../services/disasterService";
import { sensorService } from "../services/sensorService";
import { citizenService } from "../services/citizenService";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";

export const AIRecommendationsPage = () => {
  const { currentUser, hasRole } = useAuth();
  const { addToast } = useSystem();

  const [recommendations, setRecommendations] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDisasterId, setSelectedDisasterId] = useState("");

  // Override Modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedRecForOverride, setSelectedRecForOverride] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    newRiskLevel: "HIGH",
    newPriority: "HIGH_ALERT",
    overrideNotes: ""
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [recs, dis, sens, reps] = await Promise.all([
        aiService.getRecommendations(),
        disasterService.getAll(),
        sensorService.getSensors(),
        citizenService.getReports()
      ]);
      setRecommendations(recs);
      setDisasters(dis);
      setSensors(sens);
      setReports(reps);
      if (dis.length > 0 && !selectedDisasterId) {
        setSelectedDisasterId(dis[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    window.addEventListener("ai-recs-updated", loadAll);
    return () => window.removeEventListener("ai-recs-updated", loadAll);
  }, []);

  const handleRunAIAnalysis = async () => {
    const targetDisaster = disasters.find(d => d.id === selectedDisasterId);
    if (!targetDisaster) {
      addToast("Please select a valid disaster incident to evaluate.", "warning");
      return;
    }

    setIsAnalyzing(true);
    addToast("Synthesizing hydrological telemetry & satellite parameters via Gemini...", "info");

    try {
      const rec = await aiService.analyzeRisk(targetDisaster, sensors, reports);
      addToast(`Gemini Risk Assessment synthesized: [${rec.riskLevel}] awaiting officer sign-off.`, "success");
      loadAll();
    } catch (err) {
      addToast("AI evaluation failed: " + err.message, "danger");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async (recId) => {
    await aiService.approveRecommendation(recId, currentUser?.name);
    addToast("AI recommendation verified and approved as active operational protocol.", "success");
  };

  const handleReject = async (recId) => {
    const reason = prompt("Enter officer justification for rejecting this algorithmic recommendation:");
    if (reason !== null) {
      await aiService.rejectRecommendation(recId, currentUser?.name, reason);
      addToast("Recommendation dismissed by commanding officer.", "info");
    }
  };

  const handleOpenOverride = (rec) => {
    setSelectedRecForOverride(rec);
    setOverrideForm({
      newRiskLevel: rec.riskLevel,
      newPriority: rec.suggestedEvacuationPriority,
      overrideNotes: ""
    });
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!selectedRecForOverride) return;

    await aiService.overrideRecommendation(
      selectedRecForOverride.id,
      currentUser?.name,
      overrideForm
    );

    addToast("Manual command override registered and signed off.", "success");
    setOverrideModalOpen(false);
    setSelectedRecForOverride(null);
  };

  const canReview = hasRole("officer", "admin");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              GEMINI 1.5 PRO / FLASH REASONING ENGINE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-purple-400" />
            <span>AI Risk Analysis & Recommendation Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Correlates sensor telemetry, meteorological barometrics, and citizen ground reports. 
            <strong> Mandatory Policy:</strong> All AI outputs are advisory. Officers must approve or override before any evacuation protocol is enacted.
          </p>
        </div>

        {/* Generate Analysis Trigger */}
        {canReview && (
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 self-start md:self-auto">
            <select
              value={selectedDisasterId}
              onChange={(e) => setSelectedDisasterId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white max-w-[200px] truncate"
            >
              {disasters.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
            <button
              onClick={handleRunAIAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? "Synthesizing..." : "Run AI Analysis"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Safety Compliance Banner */}
      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
            Human-In-The-Loop Safety Mandate
          </span>
          <p className="text-indigo-200/90 mt-0.5">
            The DisasterShield AI Engine generates predictive recommendations regarding surge velocities and affected sectors. 
            No automatic evacuation orders or civil curfews may be triggered solely on algorithmic probability. 
            Authorized emergency officers retain final command oversight and manual override authority.
          </p>
        </div>
      </div>

      {/* Recommendations Feed */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Generated AI Recommendations ({recommendations.length})
        </h3>

        <div className="grid grid-cols-1 gap-5">
          {recommendations.map(rec => {
            const isPending = rec.approvalStatus === "pending";

            return (
              <div
                key={rec.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isPending 
                    ? "bg-slate-900/90 border-purple-500/50 shadow-2xl shadow-purple-950/30 ring-1 ring-purple-500/30" 
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase text-purple-300 font-mono">
                        ADVISORY #{rec.id}
                      </span>
                      <StatusBadge value={rec.riskLevel} type="severity" />
                      <StatusBadge value={rec.approvalStatus} type="status" />
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      Target Incident: {rec.disasterTitle}
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-mono block">
                      Evacuation Priority Recommendation:
                    </span>
                    <span className={`text-xs font-black font-mono uppercase px-2 py-0.5 rounded inline-block mt-0.5 ${
                      rec.suggestedEvacuationPriority === "IMMEDIATE" 
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {rec.suggestedEvacuationPriority}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="py-4 space-y-4">
                  {/* Meteorological / Technical Explanation */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      AI Telemetric Risk Explanation
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                      {rec.explanation}
                    </p>
                  </div>

                  {/* Impacted Locations & Precautions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Impacted Locations */}
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>Projected Impact Zones</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {rec.affectedLocations?.map((loc, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{loc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Precautions */}
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                        <span>Recommended Tactical Actions</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {rec.recommendedActions?.map((act, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 font-bold">›</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Officer Sign-off & Override Notes (if any) */}
                  {rec.reviewedBy && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">
                          Verified by {rec.reviewedBy}
                        </span>
                        {rec.overrideNotes && (
                          <p className="text-slate-400 mt-0.5">
                            Field Justification: {rec.overrideNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls for Officers */}
                {canReview && (
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Timestamp: {new Date(rec.createdAt).toLocaleString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenOverride(rec)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Manual Override</span>
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => handleReject(rec.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Dismiss Recommendation</span>
                          </button>

                          <button
                            onClick={() => handleApprove(rec.id)}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify & Enact Protocol</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {recommendations.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
              No recommendations generated yet. Select an active disaster and click "Run AI Analysis".
            </div>
          )}
        </div>
      </div>

      {/* Manual Override Modal */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="Officer Manual Override & Re-Classification"
      >
        <form onSubmit={handleSaveOverride} className="space-y-4">
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200">
            Emergency officers have the constitutional mandate to override AI hazard levels based on physical reconnaissance and localized ground realities.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Command Risk Level</label>
              <select
                value={overrideForm.newRiskLevel}
                onChange={(e) => setOverrideForm({ ...overrideForm, newRiskLevel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MODERATE">MODERATE</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Evacuation Priority</label>
              <select
                value={overrideForm.newPriority}
                onChange={(e) => setOverrideForm({ ...overrideForm, newPriority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="IMMEDIATE">IMMEDIATE</option>
                <option value="HIGH_ALERT">HIGH_ALERT</option>
                <option value="STANDBY">STANDBY</option>
                <option value="ROUTINE">ROUTINE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Officer Justification & Audit Notes (Required)
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Field reconnaissance by NDRF Boat Unit 2 confirms river wall reinforced; tidal ebb started early..."
              value={overrideForm.overrideNotes}
              onChange={(e) => setOverrideForm({ ...overrideForm, overrideNotes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOverrideModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 shadow-lg shadow-purple-600/30"
            >
              Commit Manual Override
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
