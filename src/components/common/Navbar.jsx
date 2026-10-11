import React, { useState } from "react";
import { 
  ShieldAlert, 
  Bell, 
  Radio, 
  User, 
  LogOut, 
  ChevronDown, 
  Menu, 
  Zap,
  Activity,
  Sliders,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSystem } from "../../context/SystemContext";
import { requestNotificationPermission } from "../../services/notifications";

export const Navbar = ({ onToggleMobileSidebar }) => {
  const { currentUser, logout, switchDemoRole } = useAuth();
  const { activeAlerts, triggerSensorBurst, isTelemetrySimulating, setIsTelemetrySimulating, addToast, isOnline } = useSystem();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleRequestNotifications = async () => {
    const res = await requestNotificationPermission();
    if (res.status === "granted") {
      addToast("Emergency Push Notifications enabled!", "success");
    } else {
      addToast("Notification permissions denied or unsupported.", "warning");
    }
  };

  const formatRoleLabel = (role) => {
    switch (role) {
      case "admin": return "Administrator";
      case "officer": return "Emergency Officer";
      case "sensor_agent": return "IoT Field Agent";
      default: return "Citizen";
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="flex items-center justify-between px-4 lg:px-7 h-16 max-w-7xl mx-auto w-full">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 shadow-md shadow-rose-600/20 text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  DisasterShield
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isOnline ? "Live Sync" : "Cached"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Emergency Alert Badge */}
          {activeAlerts.length > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>{activeAlerts.length} Active Hazard{activeAlerts.length > 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Simulation Tools Pill Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
              title="Simulation & demonstration controls"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Simulation</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {demoMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-60 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs animate-fadeIn"
                onMouseLeave={() => setDemoMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800/80">
                  Telemetry Controls
                </div>
                <button
                  onClick={() => {
                    triggerSensorBurst();
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pulse Sensor Data Now</span>
                </button>
                <button
                  onClick={() => {
                    setIsTelemetrySimulating(!isTelemetrySimulating);
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Auto Telemetry Stream</span>
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isTelemetrySimulating ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                    {isTelemetrySimulating ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="hidden sm:inline text-slate-400">Role:</span>
              <span className="font-semibold text-white">{formatRoleLabel(currentUser?.role)}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {roleMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-xs animate-fadeIn"
                onMouseLeave={() => setRoleMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800/80">
                  Switch Active Role
                </div>
                {[
                  { id: "officer", name: "Emergency Officer (EOC)", color: "text-rose-400" },
                  { id: "citizen", name: "Citizen (Public View)", color: "text-blue-400" },
                  { id: "admin", name: "System Administrator", color: "text-purple-400" },
                  { id: "sensor_agent", name: "IoT Field Agent", color: "text-cyan-400" },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => { switchDemoRole(r.id); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between ${currentUser?.role === r.id ? `${r.color} font-bold bg-slate-800/50` : "text-slate-300"}`}
                  >
                    <span>{r.name}</span>
                    {currentUser?.role === r.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button
            onClick={handleRequestNotifications}
            title="Enable emergency notifications"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/80 flex items-center justify-center text-[11px] font-bold text-slate-200 uppercase">
                {currentUser?.name?.slice(0, 2) || "US"}
              </div>
            </button>

            {userMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-xs animate-fadeIn"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-semibold text-white">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={() => { logout(); setUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
