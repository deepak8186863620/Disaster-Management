import React from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from "recharts";

export const SensorTrendChart = ({ 
  data = [], 
  title = "Sensor Telemetry Trend", 
  unit = "m", 
  thresholdCritical = null,
  color = "#38bdf8" 
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {title}
        </h4>
        <span className="text-[11px] font-mono text-slate-400">Unit: {unit}</span>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="recordedAt" 
              stroke="#64748b" 
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#0f172a", 
                borderColor: "#334155", 
                borderRadius: "0.5rem",
                color: "#f8fafc",
                fontSize: "12px"
              }} 
            />
            {thresholdCritical && (
              <ReferenceLine 
                y={thresholdCritical} 
                stroke="#ef4444" 
                strokeDasharray="4 4" 
                label={{ value: `DANGER (${thresholdCritical}${unit})`, fill: "#ef4444", fontSize: 10, position: "top" }} 
              />
            )}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2.5} 
              dot={{ r: 3, fill: color }} 
              activeDot={{ r: 5 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const DisasterDistributionBar = ({ disasters = [] }) => {
  const counts = {
    flood: disasters.filter(d => d.type === "flood").length,
    cyclone: disasters.filter(d => d.type === "cyclone").length,
    earthquake: disasters.filter(d => d.type === "earthquake").length,
  };

  const chartData = [
    { name: "Flood", count: counts.flood, color: "#06b6d4" },
    { name: "Cyclone", count: counts.cyclone, color: "#f97316" },
    { name: "Earthquake", count: counts.earthquake, color: "#ef4444" },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
        Active Disasters by Category
      </h4>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#0f172a", 
                borderColor: "#334155", 
                borderRadius: "0.5rem",
                fontSize: "12px"
              }} 
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
