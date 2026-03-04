import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, ComposedChart
} from "recharts";
import { WORKSTATIONS, PRODUCTION_RUNS, PRODUCTS, DOWNTIME_EVENTS, calcOEE, exportCSV } from "../lib/demoData";

function Card({ title, children, action }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-200 text-sm">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Analytics({ activeLine }) {
  const product  = PRODUCTS.find(p => p.id === activeLine) || PRODUCTS[0];
  const stations = WORKSTATIONS.filter(ws => ws.product_id === product.id);
  const runs     = PRODUCTION_RUNS.filter(r => stations.some(ws => ws.id === r.workstation_id));
  const dtEvents = DOWNTIME_EVENTS.filter(d => stations.some(ws => ws.id === d.workstation_id));

  const [focusStation, setFocus] = useState("all");

  // ── 7-day OEE trend ──────────────────────────────────────────────────────
  const last7 = [...new Set(runs.map(r => r.date))].sort().slice(-7);

  const trendData = last7.map(date => {
    const dayRuns = runs.filter(r => r.date === date);
    const row = { date: date.slice(5) }; // MM-DD
    const focusedStations = focusStation === "all" ? stations : stations.filter(s => s.id === focusStation);
    const metrics = focusedStations.map(ws => {
      const run = dayRuns.find(r => r.workstation_id === ws.id);
      return run ? calcOEE(run, ws).oee : null;
    }).filter(v => v !== null);
    row.oee    = metrics.length ? Math.round(metrics.reduce((a, b) => a + b, 0) / metrics.length) : null;
    row.target = focusedStations[0]?.oee_target ?? 80;
    // Per-station for detail view
    stations.forEach(ws => {
      const run = dayRuns.find(r => r.workstation_id === ws.id);
      row[ws.id] = run ? Math.round(calcOEE(run, ws).oee) : null;
    });
    return row;
  });

  // ── Yield trend ──────────────────────────────────────────────────────────
  const yieldData = last7.map(date => {
    const dayRuns = runs.filter(r => r.date === date);
    const row = { date: date.slice(5) };
    stations.forEach(ws => {
      const run = dayRuns.find(r => r.workstation_id === ws.id);
      row[ws.id] = run ? Math.round(calcOEE(run, ws).yield) : null;
    });
    return row;
  });

  // ── Station comparison ────────────────────────────────────────────────────
  const stationComp = stations.map(ws => {
    const wsRuns = runs.filter(r => r.workstation_id === ws.id);
    const avgOEE = wsRuns.length
      ? wsRuns.reduce((s, r) => s + calcOEE(r, ws).oee, 0) / wsRuns.length : 0;
    const totalDown = wsRuns.reduce((s, r) => s + r.downtime_mins, 0);
    return { name: ws.name.split(" ")[0] + (ws.name.split(" ")[1] ? " " + ws.name.split(" ")[1][0] + "." : ""),
             fullName: ws.name, oee: Math.round(avgOEE), target: ws.oee_target, downtime: totalDown, id: ws.id };
  });

  // ── Downtime Pareto ───────────────────────────────────────────────────────
  const reasonMap = {};
  dtEvents.forEach(d => {
    reasonMap[d.reason] = (reasonMap[d.reason] || 0) + d.duration_mins;
  });
  const paretoRaw = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]);
  const totalDownMins = paretoRaw.reduce((s, [, v]) => s + v, 0);
  let cumPct = 0;
  const paretoData = paretoRaw.map(([reason, mins]) => {
    cumPct += (mins / totalDownMins) * 100;
    return { reason: reason.split("/")[0], mins, cumPct: Math.round(cumPct) };
  });

  // Colours per station
  const COLORS = ["#3b82f6","#22c55e","#f59e0b","#a855f7","#ef4444","#14b8a6"];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-gray-400">Focus station:</span>
        <select value={focusStation} onChange={e => setFocus(e.target.value)}
          className="bg-gray-800 text-sm text-white border border-gray-700 rounded-lg px-3 py-1.5">
          <option value="all">All Stations (avg)</option>
          {stations.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
        </select>
        <button onClick={() => exportCSV(runs.map(r => {
          const ws = stations.find(s => s.id === r.workstation_id);
          const m = ws ? calcOEE(r, ws) : {};
          return { ...r, oee: m.oee?.toFixed(1), availability: m.availability?.toFixed(1), performance: m.performance?.toFixed(1), quality: m.quality?.toFixed(1), yield: m.yield?.toFixed(1) };
        }), `oee-export-${product.id}.csv`)}
          className="ml-auto text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
          📤 Export CSV
        </button>
      </div>

      {/* Row 1: OEE Trend + Station Comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="📈 OEE Trend — Last 7 Days">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis domain={[40, 100]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                       labelStyle={{ color: "#f3f4f6" }} />
              <ReferenceLine y={80} stroke="#6b7280" strokeDasharray="4 4" label={{ value: "Target", fill: "#9ca3af", fontSize: 10 }} />
              {focusStation === "all" ? (
                <Line type="monotone" dataKey="oee" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} name="Avg OEE" connectNulls />
              ) : (
                stations.map((ws, i) => (
                  <Line key={ws.id} type="monotone" dataKey={ws.id} stroke={COLORS[i % COLORS.length]}
                    strokeWidth={ws.id === focusStation ? 3 : 1}
                    strokeOpacity={ws.id === focusStation ? 1 : 0.25}
                    dot={ws.id === focusStation ? { fill: COLORS[i % COLORS.length], r: 4 } : false}
                    name={ws.name} connectNulls />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="🏭 Station OEE Comparison (7-day avg)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stationComp} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                       labelStyle={{ color: "#f3f4f6" }}
                       formatter={(v, n) => [`${v}%`, n]} />
              <ReferenceLine x={80} stroke="#6b7280" strokeDasharray="4 4" />
              <Bar dataKey="oee" name="OEE %" radius={[0,4,4,0]}>
                {stationComp.map((s, i) => (
                  <Cell key={s.id} fill={s.oee >= s.target ? "#22c55e" : s.oee >= s.target - 10 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 2: Yield Trend + Downtime Pareto */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="🎯 Yield Trend — All Stations">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={yieldData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis domain={[50, 105]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                       formatter={(v) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#9ca3af" }} />
              {stations.map((ws, i) => (
                <Line key={ws.id} type="monotone" dataKey={ws.id}
                  stroke={COLORS[i % COLORS.length]} strokeWidth={1.5}
                  dot={false} name={ws.name.split(" ")[0]} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="📉 Downtime Pareto — by Reason">
          {paretoData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No downtime events recorded</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="reason" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                         formatter={(v, n) => [n === "cumPct" ? `${v}%` : `${v} min`, n]} />
                <Bar yAxisId="left" dataKey="mins" name="Downtime (min)" fill="#ef4444" radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="#f59e0b" strokeWidth={2}
                  dot={{ fill: "#f59e0b", r: 3 }} name="Cumulative %" />
                <ReferenceLine yAxisId="right" y={80} stroke="#6b7280" strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Row 3: KPI Summary Table */}
      <Card title="📊 7-Day KPI Summary">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="text-left py-2">Station</th>
                <th className="text-right py-2">Avg OEE</th>
                <th className="text-right py-2">Target</th>
                <th className="text-right py-2">Gap</th>
                <th className="text-right py-2">Total Downtime</th>
                <th className="text-right py-2">Downtime Events</th>
                <th className="text-right py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {stationComp.map(s => {
                const gap = s.oee - s.target;
                const events = dtEvents.filter(d => d.workstation_id === s.id).length;
                return (
                  <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 text-gray-300">{s.fullName}</td>
                    <td className={`py-2 text-right font-bold ${s.oee >= s.target ? "text-green-400" : s.oee >= s.target - 10 ? "text-amber-400" : "text-red-400"}`}>{s.oee}%</td>
                    <td className="py-2 text-right text-gray-400">{s.target}%</td>
                    <td className={`py-2 text-right font-bold ${gap >= 0 ? "text-green-400" : "text-red-400"}`}>{gap > 0 ? "+" : ""}{gap}%</td>
                    <td className="py-2 text-right text-gray-400">{s.downtime} min</td>
                    <td className="py-2 text-right text-gray-400">{events}</td>
                    <td className="py-2 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${s.oee >= s.target ? "bg-green-500/20 text-green-400" : s.oee >= s.target - 10 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                        {s.oee >= s.target ? "ON TARGET" : s.oee >= s.target - 10 ? "MONITOR" : "BELOW TARGET"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
