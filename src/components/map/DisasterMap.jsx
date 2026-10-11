import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper to create custom SVG div icons
const createSvgIcon = (svgString, className = "") => {
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center ${className}">${svgString}</div>`,
    className: "custom-leaflet-icon",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const floodIcon = createSvgIcon(`
  <div class="w-9 h-9 rounded-full bg-cyan-600/90 border-2 border-cyan-300 shadow-lg shadow-cyan-600/50 flex items-center justify-center text-white font-bold text-xs">
    🌊
  </div>
`, "animate-bounce");

const cycloneIcon = createSvgIcon(`
  <div class="w-9 h-9 rounded-full bg-orange-600/90 border-2 border-orange-300 shadow-lg shadow-orange-600/50 flex items-center justify-center text-white font-bold text-xs">
    🌀
  </div>
`, "animate-spin-slow");

const earthquakeIcon = createSvgIcon(`
  <div class="w-9 h-9 rounded-full bg-rose-600/90 border-2 border-rose-300 shadow-lg shadow-rose-600/50 flex items-center justify-center text-white font-bold text-xs animate-pulse">
    ⚡
  </div>
`);

const sensorIcon = createSvgIcon(`
  <div class="w-7 h-7 rounded-full bg-emerald-600/90 border-2 border-emerald-300 shadow-md flex items-center justify-center text-white font-bold text-[10px]">
    📡
  </div>
`);

const shelterIcon = createSvgIcon(`
  <div class="w-8 h-8 rounded-full bg-indigo-600/90 border-2 border-indigo-300 shadow-md flex items-center justify-center text-white font-bold text-xs">
    🏠
  </div>
`);

const pickerIcon = createSvgIcon(`
  <div class="w-8 h-8 rounded-full bg-rose-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-sm">
    📍
  </div>
`);

export const DisasterMap = ({
  disasters = [],
  sensors = [],
  shelters = [],
  selectedLocation = null,
  onLocationSelect = null,
  center = [19.0760, 72.8777], // Mumbai default coordinates for seed data
  zoom = 11,
  height = "h-[450px]"
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const pickerMarkerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      // Dark theme CartoDB basemap tiles for high-tech HUD look
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle map click when picker mode is active
      if (onLocationSelect) {
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          onLocationSelect({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) });
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers and Overlays when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    // 1. Disaster Markers with Hazard Radius Circles
    disasters.forEach(disaster => {
      if (!disaster.latitude || !disaster.longitude) return;

      let icon = floodIcon;
      let circleColor = "#06b6d4";

      if (disaster.type === "cyclone") {
        icon = cycloneIcon;
        circleColor = "#f97316";
      } else if (disaster.type === "earthquake") {
        icon = earthquakeIcon;
        circleColor = "#ef4444";
      }

      // Add hazard perimeter circle
      const radiusMeters = (disaster.radiusKm || 5) * 1000;
      L.circle([disaster.latitude, disaster.longitude], {
        radius: radiusMeters,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: "4, 6"
      }).addTo(layerGroupRef.current);

      // Add Marker
      const marker = L.marker([disaster.latitude, disaster.longitude], { icon })
        .addTo(layerGroupRef.current);

      marker.bindPopup(`
        <div class="p-2 space-y-1 text-slate-900">
          <div class="flex items-center gap-1.5 font-bold text-sm">
            <span>${disaster.title}</span>
          </div>
          <p class="text-xs text-slate-700">${disaster.description || ""}</p>
          <div class="pt-1 flex items-center justify-between text-[11px] font-semibold">
            <span class="text-rose-600 uppercase font-mono">SEVERITY: ${disaster.severity || "HIGH"}</span>
            <span class="text-slate-600">Radius: ${disaster.radiusKm || 5} km</span>
          </div>
        </div>
      `);
    });

    // 2. Sensor Nodes
    sensors.forEach(sensor => {
      if (!sensor.latitude || !sensor.longitude) return;

      const marker = L.marker([sensor.latitude, sensor.longitude], { icon: sensorIcon })
        .addTo(layerGroupRef.current);

      marker.bindPopup(`
        <div class="p-2 space-y-1 text-slate-900">
          <p class="font-bold text-xs text-emerald-800">📡 IoT SENSOR: ${sensor.name}</p>
          <p class="text-xs text-slate-600">${sensor.locationName || ""}</p>
          <div class="text-xs font-mono font-bold text-slate-900">
            Current Reading: <span class="text-rose-600">${sensor.latestValue} ${sensor.unit}</span>
          </div>
          <p class="text-[10px] text-slate-500">Status: ${sensor.status?.toUpperCase()}</p>
        </div>
      `);
    });

    // 3. Evacuation Shelters
    shelters.forEach(shelter => {
      if (!shelter.latitude || !shelter.longitude) return;

      const marker = L.marker([shelter.latitude, shelter.longitude], { icon: shelterIcon })
        .addTo(layerGroupRef.current);

      marker.bindPopup(`
        <div class="p-2 space-y-1 text-slate-900">
          <p class="font-bold text-xs text-indigo-700">🏠 SAFE SHELTER: ${shelter.name}</p>
          <p class="text-[11px] text-slate-600">${shelter.address}</p>
          <div class="text-[11px] font-semibold text-slate-800">
            Occupancy: ${shelter.currentOccupancy || 0} / ${shelter.capacity}
          </div>
          <p class="text-[10px] text-slate-500">Contact: ${shelter.contact || "N/A"}</p>
        </div>
      `);
    });

    // 4. Selected Location Marker (Picker mode)
    if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.remove();
      }
      pickerMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: pickerIcon })
        .addTo(layerGroupRef.current)
        .bindPopup(`<div class="p-1 text-xs font-bold text-slate-900">Selected Incident Coordinate</div>`)
        .openPopup();
    }
  }, [disasters, sensors, shelters, selectedLocation]);

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-xl`}>
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] flex flex-wrap items-center gap-3 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span>🌊</span>
          <span className="text-cyan-400 font-medium">Flood</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🌀</span>
          <span className="text-orange-400 font-medium">Cyclone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>⚡</span>
          <span className="text-rose-400 font-medium">Earthquake</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>📡</span>
          <span className="text-emerald-400 font-medium">IoT Sensor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🏠</span>
          <span className="text-indigo-400 font-medium">Shelter</span>
        </div>
      </div>
    </div>
  );
};
