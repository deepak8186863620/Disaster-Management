import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useSystem } from "../../context/SystemContext";

export const OfflineBanner = () => {
  const { isOnline, offlineQueueCount, triggerManualSync } = useSystem();

  // If online, do not render any banner to keep the interface clean and spacious
  if (isOnline) return null;

  return (
    <aside aria-label="Offline Mode Notice" className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-200 flex items-center justify-between backdrop-blur-sm animate-fadeIn">
      <div className="flex items-center gap-2.5">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-medium">
          Offline Mode Active — Changes will sync automatically when your connection is restored.
        </span>
        {offlineQueueCount > 0 && (
          <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[11px] text-amber-300 font-semibold border border-amber-500/30">
            {offlineQueueCount} queued
          </span>
        )}
      </div>
      <button
        onClick={triggerManualSync}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors font-medium text-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry Sync</span>
      </button>
    </aside>
  );
};
