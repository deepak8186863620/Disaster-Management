import React, { useEffect, useRef, useState, useCallback } from "react";
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

// ── Live "You Are Here" GPS marker with double pulse ring animation ──────────
const createUserLocationIcon = () =>
  L.divIcon({
    html: `
      <div style="position:relative;width:24px;height:24px;">
        <div style="
          position:absolute;top:50%;left:50%;
          width:40px;height:40px;
          margin:-20px 0 0 -20px;
          border-radius:50%;
          background:rgba(59,130,246,0.22);
          animation:userPing 1.8s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;
          width:28px;height:28px;
          margin:-14px 0 0 -14px;
          border-radius:50%;
          background:rgba(59,130,246,0.35);
          animation:userPing 1.8s cubic-bezier(0,0,0.2,1) infinite;
          animation-delay:0.4s;
        "></div>
        <div style="
          width:24px;height:24px;
          border-radius:50%;
          background:#3b82f6;
          border:3px solid #ffffff;
          box-shadow:0 0 14px rgba(59,130,246,0.85);
        "></div>
      </div>
    `,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });

// Inject pulse keyframes once into document head (safe to call multiple times)
if (typeof document !== "undefined" && !document.getElementById("user-location-keyframes")) {
  const style = document.createElement("style");
  style.id = "user-location-keyframes";
  style.textContent = `
    @keyframes userPing {
      0%   { transform: scale(0.7); opacity: 0.9; }
      70%  { transform: scale(1.9); opacity: 0; }
      100% { transform: scale(0.7); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export const DisasterMap = ({
  disasters = [],
  sensors = [],
  shelters = [],
  selectedLocation = null,
  onLocationSelect = null,
  center = [19.0760, 72.8777], // Mumbai default coordinates for seed data
  zoom = 11,
  height = "h-[450px]",
  showLocateButton = true,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const pickerMarkerRef = useRef(null);

  // Live location refs (kept in refs to avoid extraneous re-renders)
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const watchIdRef = useRef(null);

  // UI state for locate and GPS tracking status
  const [locating, setLocating] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

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
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
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

  // ── Live GPS Tracking Callbacks ──────────────────────────────────────────

  const placeOrUpdateUserMarker = useCallback((lat, lng, accuracy) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setUserCoords({ lat: lat.toFixed(5), lng: lng.toFixed(5), accuracy: Math.round(accuracy) });

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([lat, lng]);
      accuracyCircleRef.current.setRadius(accuracy);
    } else {
      accuracyCircleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: "3, 5",
      }).addTo(map);
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      userMarkerRef.current = L.marker(
        [lat, lng],
        { icon: createUserLocationIcon(), zIndexOffset: 1000 }
      )
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-slate-900 text-xs space-y-1">
            <p class="font-bold text-blue-700">📍 Your Live Location</p>
            <p class="font-mono text-slate-700">${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
            <p class="text-slate-500">Accuracy: ±${Math.round(accuracy)} m</p>
          </div>
        `);
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);
    setGpsError(null);

    // Quick one-time fix first so map pans immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        placeOrUpdateUserMarker(lat, lng, accuracy);
        mapInstanceRef.current?.flyTo([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 14), {
          animate: true,
          duration: 1.2
        });
        setLocating(false);
        setTracking(true);
      },
      (err) => {
        setLocating(false);
        setGpsError(err.message || "Could not get location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Continuous watch for real-time updates
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        placeOrUpdateUserMarker(lat, lng, accuracy);
        setLocating(false);
        setTracking(true);
        setGpsError(null);

        if (userMarkerRef.current) {
          userMarkerRef.current.setPopupContent(`
            <div class="p-2 text-slate-900 text-xs space-y-1">
              <p class="font-bold text-blue-700">📍 Your Live Location</p>
              <p class="font-mono text-slate-700">${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
              <p class="text-slate-500">Accuracy: ±${Math.round(accuracy)} m</p>
            </div>
          `);
        }
      },
      (err) => {
        setTracking(false);
        setLocating(false);
        setGpsError(err.message || "GPS signal lost.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
    );
  }, [placeOrUpdateUserMarker]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }
    setTracking(false);
    setLocating(false);
    setUserCoords(null);
    setGpsError(null);
  }, []);

  const handleLocateClick = useCallback(() => {
    if (tracking || locating) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [tracking, locating, startTracking, stopTracking]);

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-xl`}>
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Locate Me Button */}
      {showLocateButton && (
        <button
          onClick={handleLocateClick}
          title={tracking ? "Stop live tracking" : locating ? "Acquiring GPS signal…" : "Track my real-time location"}
          style={{ zIndex: 900 }}
          className={[
            "absolute top-3 right-3",
            "flex items-center gap-2",
            "px-3 py-2 rounded-xl",
            "text-[11px] font-bold",
            "border shadow-xl",
            "transition-all duration-200",
            "backdrop-blur-md",
            tracking
              ? "bg-blue-600 border-blue-400 text-white shadow-blue-600/40 hover:bg-blue-700"
              : locating
              ? "bg-amber-500/90 border-amber-400 text-white shadow-amber-500/40 cursor-wait"
              : "bg-slate-950/85 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-500"
          ].join(" ")}
        >
          <span
            className={[
              "w-2 h-2 rounded-full shrink-0",
              tracking ? "bg-white animate-pulse" : locating ? "bg-amber-200 animate-bounce" : "bg-slate-400"
            ].join(" ")}
          />
          <span>
            {tracking ? "Live ✕ Stop" : locating ? "Locating…" : "📍 Locate Me"}
          </span>
        </button>
      )}

      {/* Live Coordinates HUD */}
      {userCoords && tracking && (
        <div
          style={{ zIndex: 900 }}
          className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-950/90 backdrop-blur-md border border-blue-500/50 rounded-xl px-3 py-1.5 text-[11px] font-mono text-blue-200 shadow-xl flex items-center gap-2 whitespace-nowrap pointer-events-none"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
          <span className="text-blue-300 font-bold">YOU</span>
          <span>{userCoords.lat}, {userCoords.lng}</span>
          <span className="text-blue-400/70">±{userCoords.accuracy}m</span>
        </div>
      )}

      {/* GPS Error Banner */}
      {gpsError && (
        <div
          style={{ zIndex: 900 }}
          className="absolute top-3 left-3 right-14 bg-rose-950/90 border border-rose-500/50 rounded-xl px-3 py-2 text-[11px] text-rose-200 shadow-xl backdrop-blur-md flex items-center gap-2"
        >
          <span>⚠️</span>
          <span className="truncate">{gpsError}</span>
          <button
            onClick={() => setGpsError(null)}
            className="ml-auto shrink-0 text-rose-400 hover:text-rose-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Map Legend */}
      <div
        style={{ zIndex: 900 }}
        className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] flex flex-wrap items-center gap-3 shadow-xl"
      >
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
        <div className="flex items-center gap-1.5">
          <span style={{width:10,height:10,borderRadius:"50%",background:"#3b82f6",border:"2px solid #fff",display:"inline-block",flexShrink:0}} />
          <span className="text-blue-400 font-medium">You</span>
        </div>
      </div>
    </div>
  );
};
