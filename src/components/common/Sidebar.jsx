import React from "react";
import { 
  LayoutDashboard, 
  Flame, 
  Activity, 
  FileText, 
  BrainCircuit, 
  AlertTriangle, 
  Navigation, 
  Users, 
  Settings, 
  X,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Command Center", icon: LayoutDashboard, roles: ["citizen", "officer", "admin", "sensor_agent"] },
      { id: "disasters", label: "Disaster Monitoring", icon: Flame, roles: ["citizen", "officer", "admin"] },
      { id: "sensors", label: "Sensor Telemetry", icon: Activity, roles: ["officer", "admin", "sensor_agent"] },
    ]
  },
  {
    title: "Response & AI",
    items: [
      { id: "ai-recommendations", label: "AI Risk Analysis", icon: BrainCircuit, badge: "GEMINI", roles: ["officer", "admin"] },
      { id: "emergency-alerts", label: "Emergency Alerts", icon: AlertTriangle, badge: "LIVE", roles: ["citizen", "officer", "admin"] },
      { id: "evacuation-plans", label: "Evacuation Routing", icon: Navigation, roles: ["citizen", "officer", "admin"] },
      { id: "citizen-reports", label: "Citizen Reports", icon: FileText, roles: ["citizen", "officer", "admin"] },
    ]
  },
  {
    title: "System",
    items: [
      { id: "user-management", label: "User Access", icon: Users, roles: ["admin"] },
      { id: "system-settings", label: "Settings & Demo", icon: Settings, roles: ["citizen", "officer", "admin", "sensor_agent"] },
    ]
  }
];

export const Sidebar = ({ activeTab, onSelectTab, isMobileOpen, onCloseMobile }) => {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || "citizen";

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-60 bg-slate-950 border-r border-slate-800/60 flex flex-col transition-transform duration-200 ease-out
        lg:static lg:translate-x-0
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60 lg:hidden">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-sm text-white">DisasterShield</span>
          </div>
          <button 
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
          {NAV_SECTIONS.map(section => {
            const visibleItems = section.items.filter(item => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div className="px-2.5 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {section.title}
                </div>

                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`
                        w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group
                        ${isActive 
                          ? "bg-slate-800 text-white font-semibold" 
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"}
                      `}
                    >
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-rose-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          item.badge === "GEMINI" 
                            ? "bg-purple-500/15 text-purple-300" 
                            : "bg-rose-500/15 text-rose-300"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom Status Card */}
        <div className="p-3 border-t border-slate-800/60">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-slate-300">System Ready</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Role: <span className="capitalize text-slate-300">{userRole}</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
