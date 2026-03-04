import { useState, useEffect } from "react";
import { WORKSTATIONS, MACHINE_STATUS, PRODUCTION_RUNS, PRODUCTS, calcOEE } from "../lib/demoData";

const STATUS_CONFIG = {
  Running:     { color: "bg-green-500",  text: "text-green-400",  border: "border-green-500",  bg: "bg-green-500/10",  icon: "🟢", label: "Running"     },
  Idle:        { color: "bg-amber-500",  text: "text-amber-400",  border: "border-amber-500",  bg: "bg-amber-500/10",  icon: "🟡", label: "Idle"        },
  Down:        { color: "bg-red-500",    text: "text-red-400",    border: "border-red-500",    bg: "bg-red-500/10",    icon: "🔴", label: "Down"        },
  Maintenance: { color: "bg-blue-500",   text: "text-blue-400",   border: "border-blue-500",   bg: "bg-blue-500/10",   icon: "🔵", label: "Maintenance" },
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="font-mono text-lg font-bold text-white">{time.toLocaleTimeString("id-ID")}</span>;
}

function StatusCard({ ws, status, run, onStatusChange }) {
  const cfg = STATUS_CONFIG[status.status] || STATUS_CONFIG.Idle;
  const metrics = run ? calcOEE(run, ws) : null;
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(status.status);
  const [newNote, setNewNote]     = useState(status.note);

  return (
    <div className={`border-2 ${cfg.border} ${cfg.bg} rounded-xl p-4 relative`}>
      {/* Status pulse dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.color} ${status.status === "Running" ? "animate-pulse" : ""}`} />
        <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
      </div>

      {/* Station name */}
      <p className="font-black text-white text-sm pr-24">{ws.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">Since {status.since} · {status.operator}</p>

      {/* OEE today */}
      {metrics ? (
        <div className="flex gap-3 mt-3">
          <div>
            <p className={`text-2xl font-black ${metrics.oee >= ws.oee_target ? "text-green-400" : metrics.oee >= ws.oee_target - 10 ? "text-amber-400" : "text-red-400"}`}>
              {metrics.oee.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">OEE today</p>
          </div>
          <div className="border-l border-gray-700 pl-3 space-y-0.5 text-xs mt-0.5">
            <p className="text-gray-400">A: <span className="text-white">{metrics.availability.toFixed(0)}%</span></p>
            <p className="text-gray-400">P: <span className="text-white">{metrics.performance.toFixed(0)}%</span></p>
            <p className="text-gray-400">Q: <span className="text-white">{metrics.quality.toFixed(0)}%</span></p>
          </div>
          <div className="border-l border-gray-700 pl-3 text-xs mt-0.5">
            <p className="text-gray-400">Yield</p>
            <p className="text-white font-bold">{metrics.yield.toFixed(1)}%</p>
            <p className="text-gray-400 mt-1">Down</p>
            <p className={`font-bold ${run.downtime_mins > 30 ? "text-red-400" : "text-gray-300"}`}>{run.downtime_mins}m</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600 mt-3">No production data today</p>
      )}

      {/* Note */}
      {status.note && <p className="text-xs text-gray-400 mt-2 italic">"{status.note}"</p>}

      {/* Edit button */}
      <button onClick={() => setEditing(!editing)}
        className="mt-3 text-xs text-gray-500 hover:text-gray-300 underline">
        {editing ? "Cancel" : "Update status"}
      </button>

      {editing && (
        <div className="mt-2 space-y-2 border-t border-gray-700 pt-2">
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
            className="w-full bg-gray-800 text-white text-xs border border-gray-700 rounded px-2 py-1">
            {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
            placeholder="Note (optional)" className="w-full bg-gray-800 text-white text-xs border border-gray-700 rounded px-2 py-1" />
          <button onClick={() => { onStatusChange(ws.id, newStatus, newNote); setEditing(false); }}
            className="w-full bg-blue-600 text-white text-xs rounded py-1 font-bold">
            Update
          </button>
        </div>
      )}
    </div>
  );
}

export default function StatusBoard({ activeLine }) {
  const product  = PRODUCTS.find(p => p.id === activeLine) || PRODUCTS[0];
  const stations = WORKSTATIONS.filter(ws => ws.product_id === product.id);
  const [statuses, setStatuses] = useState(
    MACHINE_STATUS.filter(s => stations.some(ws => ws.id === s.workstation_id))
  );
  const runs = PRODUCTION_RUNS.filter(r => r.date === new Date().toISOString().slice(0,10) && stations.some(ws => ws.id === r.workstation_id));

  const updateStatus = (wsId, newStatus, note) => {
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setStatuses(prev => prev.map(s => s.workstation_id === wsId
      ? { ...s, status: newStatus, since: now, note }
      : s));
  };

  // Summary counts
  const counts = Object.fromEntries(Object.keys(STATUS_CONFIG).map(k => [k, 0]));
  statuses.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++; });

  return (
    <div className="space-y-5">
      {/* Live header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className={`flex items-center gap-1.5 ${cfg.bg} border ${cfg.border} rounded-lg px-3 py-1.5`}>
              <span className={`text-xs font-bold ${cfg.text}`}>{cfg.icon} {counts[key]} {key}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <span>Live ·</span>
          <LiveClock />
        </div>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stations.map(ws => {
          const status = statuses.find(s => s.workstation_id === ws.id) ||
            { workstation_id: ws.id, status: "Idle", since: "--:--", operator: "—", note: "" };
          const run = runs.find(r => r.workstation_id === ws.id);
          return <StatusCard key={ws.id} ws={ws} status={status} run={run} onStatusChange={updateStatus} />;
        })}
      </div>

      {/* Plant floor summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Plant Floor Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-green-400">{Math.round((counts.Running / stations.length) * 100)}%</p>
            <p className="text-xs text-gray-500">Availability Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-amber-400">{counts.Running}</p>
            <p className="text-xs text-gray-500">Stations Running</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-400">{counts.Down}</p>
            <p className="text-xs text-gray-500">Stations Down</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-blue-400">{counts.Maintenance}</p>
            <p className="text-xs text-gray-500">In Maintenance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
