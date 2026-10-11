import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Droplets, 
  CloudRain, 
  Wind, 
  Gauge, 
  PlusCircle, 
  Zap,
  Globe,
  Waves,
  Thermometer,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { sensorService } from "../services/sensorService";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import { StatusBadge } from "../components/common/StatusBadge";
import { SensorTrendChart } from "../components/charts/SensorCharts";
import { Modal } from "../components/common/Modal";

export const SensorMonitoringPage = () => {
  const { currentUser } = useAuth();
  const { triggerSensorBurst, isTelemetrySimulating, setIsTelemetrySimulating, addToast } = useSystem();

  const [sensors, setSensors] = useState([]);
  const [readings, setReadings] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");

  // Live Open-Meteo API states
  const [isLoadingFlood, setIsLoadingFlood] = useState(false);
  const [liveFloodData, setLiveFloodData] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [liveWeatherData, setLiveWeatherData] = useState(null);

  // Ingestion form state
  const [ingestForm, setIngestForm] = useState({
    sensorId: "sensor-hyd-01",
    value: "",
    unit: "meters",
    type: "water_level"
  });

  const loadSensorData = async () => {
    const s = await sensorService.getSensors();
    const r = await sensorService.getReadings();
    setSensors(s);
    setReadings(r);
    if (!selectedSensor && s.length > 0) {
      setSelectedSensor(s[0]);
    }
  };

  useEffect(() => {
    loadSensorData();
    window.addEventListener("sensors-updated", loadSensorData);
    return () => window.removeEventListener("sensors-updated", loadSensorData);
  }, []);

  const handleFetchLiveFlood = async () => {
    setIsLoadingFlood(true);
    try {
      const res = await sensorService.fetchLiveOpenMeteoFlood(59.91, 10.75);
      setLiveFloodData(res);
      addToast(`Live Flood API: ${res.currentDischarge} ${res.unit} discharge synced`, "success");
      await loadSensorData();
    } catch (err) {
      addToast("Failed to fetch Open-Meteo flood feed: " + err.message, "danger");
    } finally {
      setIsLoadingFlood(false);
    }
  };

  const handleFetchLiveWeather = async () => {
    setIsLoadingWeather(true);
    try {
      const res = await sensorService.fetchLiveOpenMeteoWeather(52.52, 13.41);
      setLiveWeatherData(res);
      addToast(`Live Weather API: ${res.currentTemperature}${res.unit} synced`, "success");
      await loadSensorData();
    } catch (err) {
      addToast("Failed to fetch Open-Meteo weather feed: " + err.message, "danger");
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    try {
      const chosen = sensors.find(s => s.id === ingestForm.sensorId);
      const res = await sensorService.ingestReading({
        sensorId: ingestForm.sensorId,
        sensorName: chosen?.name || ingestForm.sensorId,
        type: chosen?.type || ingestForm.type,
        value: ingestForm.value,
        unit: chosen?.unit || ingestForm.unit
      });

      if (res.validationStatus === "anomalous") {
        addToast(`⚠️ Reading flagged abnormal for ${chosen?.name}`, "warning");
      } else {
        addToast(`Reading ingested for ${chosen?.name}`, "success");
      }

      setIsIngestModalOpen(false);
      setIngestForm(prev => ({ ...prev, value: "" }));
    } catch (err) {
      addToast("Failed to ingest sensor telemetry: " + err.message, "danger");
    }
  };

  const getSensorIcon = (type) => {
    switch (type) {
      case "water_level":
        return <Droplets className="w-5 h-5 text-cyan-400" />;
      case "rainfall":
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case "wind_speed":
        return <Wind className="w-5 h-5 text-teal-400" />;
      case "seismic":
        return <Gauge className="w-5 h-5 text-rose-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredSensors = filterType === "all" 
    ? sensors 
    : sensors.filter(s => s.type === filterType);

  const activeReadings = readings.filter(r => r.sensorId === selectedSensor?.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Environmental Telemetry</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {sensors.length} Nodes
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time hydrological gauges, Doppler rain meters, anemometers, and seismic sensors.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Ingest Reading</span>
          </button>

          <button
            onClick={triggerSensorBurst}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Pulse Telemetry</span>
          </button>
        </div>
      </div>

      {/* Live External Public APIs Card */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 lg:p-5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Connected External Feeds
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live meteorological and hydrological telemetry streams via Open-Meteo global APIs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleFetchLiveFlood}
              disabled={isLoadingFlood}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Waves className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingFlood ? "animate-spin" : ""}`} />
              <span>{isLoadingFlood ? "Syncing..." : "Sync River Flood API"}</span>
            </button>

            <button
              onClick={handleFetchLiveWeather}
              disabled={isLoadingWeather}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Thermometer className={`w-3.5 h-3.5 text-amber-400 ${isLoadingWeather ? "animate-spin" : ""}`} />
              <span>{isLoadingWeather ? "Syncing..." : "Sync Weather API"}</span>
            </button>
          </div>
        </div>

        {/* Live Feeds Data Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          {/* Flood Feed */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Open-Meteo Flood Discharge</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {liveFloodData ? `Lat: 59.9°N, Lon: 10.7°E` : "Endpoint: flood-api.open-meteo.com"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-cyan-300">
                {liveFloodData ? `${liveFloodData.currentDischarge} ${liveFloodData.unit}` : "10.64 m³/s"}
              </span>
              <p className="text-[10px] text-emerald-400 font-semibold">
                {liveFloodData ? "Synced Live" : "Ready"}
              </p>
            </div>
          </div>

          {/* Weather Feed */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Open-Meteo Atmospheric Temp</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {liveWeatherData ? `Lat: 52.5°N, Lon: 13.4°E` : "Endpoint: api.open-meteo.com"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-amber-300">
                {liveWeatherData ? `${liveWeatherData.currentTemperature}${liveWeatherData.unit}` : "10.6°C"}
              </span>
              <p className="text-[10px] text-emerald-400 font-semibold">
                {liveWeatherData ? "Synced Live" : "Ready"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto text-xs">
        {[
          { id: "all", label: "All Sensors" },
          { id: "water_level", label: "River & Water" },
          { id: "rainfall", label: "Precipitation" },
          { id: "wind_speed", label: "Wind & Storms" },
          { id: "seismic", label: "Seismic" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterType === tab.id
                ? "bg-slate-800 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sensor Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSensors.map(sensor => {
          const isSelected = selectedSensor?.id === sensor.id;
          const isAbnormal = sensor.status === "abnormal";

          return (
            <div
              key={sensor.id}
              onClick={() => setSelectedSensor(sensor)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected 
                  ? "bg-slate-900/90 border-cyan-500/80 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/40" 
                  : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  {getSensorIcon(sensor.type)}
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge value={sensor.status} type="status" />
                </div>
              </div>

              <h4 className="font-semibold text-sm text-white mb-0.5">{sensor.name}</h4>
              <p className="text-xs text-slate-400 mb-3 truncate">{sensor.locationName}</p>

              <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/60">
                <div>
                  <span className="text-xl font-bold text-white font-mono">
                    {sensor.latestValue}
                  </span>
                  <span className="text-xs text-slate-400 ml-1 font-mono">{sensor.unit}</span>
                </div>

                {sensor.thresholdCritical && (
                  <span className="text-[11px] text-rose-400/90 font-mono">
                    Limit: {sensor.thresholdCritical} {sensor.unit}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Sensor Analytics Section */}
      {selectedSensor && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{selectedSensor.name}</h3>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {selectedSensor.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Location: {selectedSensor.locationName} ({selectedSensor.latitude?.toFixed(4)}, {selectedSensor.longitude?.toFixed(4)})
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Current Reading:</span>
              <span className="text-lg font-bold font-mono text-cyan-400">
                {selectedSensor.latestValue} {selectedSensor.unit}
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <SensorTrendChart 
              readings={activeReadings} 
              sensorType={selectedSensor.type}
              unit={selectedSensor.unit} 
            />
          </div>
        </div>
      )}

      {/* Ingest Modal */}
      <Modal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        title="Ingest Sensor Reading"
        subtitle="Simulate an IoT device data packet transmission"
      >
        <form onSubmit={handleIngest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Sensor Node
            </label>
            <select
              value={ingestForm.sensorId}
              onChange={(e) => setIngestForm(prev => ({ ...prev, sensorId: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {sensors.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.locationName})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Telemetry Value ({sensors.find(s => s.id === ingestForm.sensorId)?.unit || "units"})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={ingestForm.value}
              onChange={(e) => setIngestForm(prev => ({ ...prev, value: e.target.value }))}
              placeholder="e.g. 8.4"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsIngestModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              Submit Telemetry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
