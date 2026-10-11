import React, { useState, useEffect } from "react";
import { 
  Navigation, 
  Plus, 
  MapPin, 
  Home, 
  Users, 
  Phone, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building
} from "lucide-react";
import { evacuationService } from "../services/evacuationService";
import { disasterService } from "../services/disasterService";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import { StatusBadge } from "../components/common/StatusBadge";
import { DisasterMap } from "../components/map/DisasterMap";
import { Modal } from "../components/common/Modal";

export const EvacuationPlansPage = () => {
  const { currentUser, hasRole } = useAuth();
  const { addToast } = useSystem();

  const [plans, setPlans] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    disasterEventId: "",
    disasterTitle: "",
    affectedAreas: "",
    priority: "IMMEDIATE",
    instructionsText: "1. Avoid driving through standing water.\n2. Proceed immediately to designated school shelters.\n3. Keep phone battery conserved for EOC instructions.",
    shelterName: "Kurla Community Center",
    shelterAddress: "Station Road, Mumbai",
    shelterCapacity: 1000,
    shelterLat: 19.0712,
    shelterLng: 72.8830,
    shelterContact: "+91 22 2650 1122"
  });

  const loadAll = async () => {
    const p = await evacuationService.getPlans();
    const d = await disasterService.getAll();
    setPlans(p);
    setDisasters(d);
    if (d.length > 0 && !formData.disasterEventId) {
      setFormData(prev => ({
        ...prev,
        disasterEventId: d[0].id,
        disasterTitle: d[0].title
      }));
    }
  };

  useEffect(() => {
    loadAll();
    window.addEventListener("evacuations-updated", loadAll);
    return () => window.removeEventListener("evacuations-updated", loadAll);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const selectedDisaster = disasters.find(d => d.id === formData.disasterEventId);
      const instructions = formData.instructionsText.split("\n").filter(Boolean);
      const areas = formData.affectedAreas.split(",").map(a => a.trim()).filter(Boolean);

      await evacuationService.createPlan({
        disasterEventId: formData.disasterEventId,
        disasterTitle: selectedDisaster?.title || formData.disasterTitle || "Active Emergency",
        affectedAreas: areas.length > 0 ? areas : ["Impact Zone Sector"],
        priority: formData.priority,
        status: "active",
        instructions,
        shelters: [
          {
            id: `shelter-${Date.now()}`,
            name: formData.shelterName,
            address: formData.shelterAddress,
            latitude: parseFloat(formData.shelterLat) || 19.0712,
            longitude: parseFloat(formData.shelterLng) || 72.8830,
            capacity: parseInt(formData.shelterCapacity, 10) || 1000,
            currentOccupancy: 120,
            contact: formData.shelterContact,
            facilities: ["Emergency Medical Aid", "Clean Drinking Water", "Baby Rations"]
          }
        ],
        approvedBy: currentUser?.name || "Commanding Officer"
      });

      addToast("Evacuation routing & shelter deployment protocol enacted!", "success");
      setIsModalOpen(false);
    } catch (err) {
      addToast("Error creating evacuation plan: " + err.message, "danger");
    }
  };

  const handleAdjustOccupancy = async (planId, shelterId, current, delta) => {
    const updated = Math.max(0, current + delta);
    await evacuationService.updateShelterOccupancy(planId, shelterId, updated);
    addToast(`Shelter occupancy updated: ${updated}`, "info");
  };

  const canManage = hasRole("officer", "admin");
  const allShelters = plans.flatMap(p => p.shelters || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-500" />
            <span>Evacuation Routing & Shelter Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Coordinated evacuation corridors, safe relief centers, and real-time headcounts.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Evacuation Plan</span>
          </button>
        )}
      </div>

      {/* Map of Evacuation Shelters & Incidents */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Geographic Shelter & Relief Corridors
        </h3>
        <DisasterMap
          disasters={disasters}
          shelters={allShelters}
          height="h-72"
        />
      </div>

      {/* Plans List */}
      <div className="space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Enacted Evacuation Directives ({plans.length})
        </h3>

        {plans.map(plan => (
          <div
            key={plan.id}
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                    DIRECTIVE #{plan.id}
                  </span>
                  <StatusBadge value={plan.priority} type="severity" />
                  <StatusBadge value={plan.status} type="status" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Target Incident: {plan.disasterTitle}
                </h3>
              </div>

              <div className="text-right text-xs text-slate-400">
                <span>Authorized by: </span>
                <span className="font-semibold text-white">{plan.approvedBy}</span>
              </div>
            </div>

            {/* Affected Sectors & Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Impacted Sectors Under Evacuation Order
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {plan.affectedAreas?.map((area, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Civilian Evacuation Directives
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {plan.instructions?.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">›</span>
                      <span>{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Shelters Array with Capacity Gauges */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-400" />
                <span>Designated Relief Shelters</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.shelters?.map(shelter => {
                  const percent = Math.min(100, Math.round(((shelter.currentOccupancy || 0) / (shelter.capacity || 1)) * 100));

                  return (
                    <div
                      key={shelter.id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold text-sm text-white">{shelter.name}</h5>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{shelter.address}</span>
                          </p>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {shelter.capacity - shelter.currentOccupancy} Beds Available
                        </span>
                      </div>

                      {/* Capacity Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                          <span>Occupancy</span>
                          <span className="text-white font-bold">{shelter.currentOccupancy} / {shelter.capacity} ({percent}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              percent > 85 ? "bg-rose-500" : percent > 60 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Contact & Controls */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{shelter.contact || "EOC Line"}</span>
                        </span>

                        {canManage && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAdjustOccupancy(plan.id, shelter.id, shelter.currentOccupancy, -10)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
                              title="Decrease 10 evacuees"
                            >
                              -10
                            </button>
                            <button
                              onClick={() => handleAdjustOccupancy(plan.id, shelter.id, shelter.currentOccupancy, +10)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
                              title="Increase 10 evacuees"
                            >
                              +10
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
            No active evacuation plans logged.
          </div>
        )}
      </div>

      {/* Create Evacuation Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Establish Tactical Evacuation Plan"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Disaster Event
              </label>
              <select
                value={formData.disasterEventId}
                onChange={(e) => setFormData({ ...formData, disasterEventId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {disasters.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Evacuation Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="IMMEDIATE">IMMEDIATE (Mandatory Order)</option>
                <option value="HIGH">HIGH (Urgent Advisory)</option>
                <option value="STANDARD">STANDARD (Precautionary)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Affected Sectors (Comma-separated)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kurla Ward L, Bail Bazar, BKC Lowlands"
              value={formData.affectedAreas}
              onChange={(e) => setFormData({ ...formData, affectedAreas: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Primary Designated Shelter
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Shelter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kurla Municipal High School Shelter #12"
                  value={formData.shelterName}
                  onChange={(e) => setFormData({ ...formData, shelterName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Shelter Capacity (Beds)</label>
                <input
                  type="number"
                  required
                  value={formData.shelterCapacity}
                  onChange={(e) => setFormData({ ...formData, shelterCapacity: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Shelter Physical Address</label>
              <input
                type="text"
                required
                placeholder="e.g. Near Kurla Station West, Mumbai"
                value={formData.shelterAddress}
                onChange={(e) => setFormData({ ...formData, shelterAddress: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Directives & Evacuation Route Guidelines (One per line)
            </label>
            <textarea
              rows={3}
              required
              value={formData.instructionsText}
              onChange={(e) => setFormData({ ...formData, instructionsText: e.target.value })}
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
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/30"
            >
              Enact Evacuation Directive
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
