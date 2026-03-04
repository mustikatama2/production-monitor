import { useState } from "react";
import { WORKSTATIONS, DOWNTIME_EVENTS, DOWNTIME_REASONS, PRODUCTS, exportCSV } from "../lib/demoData";

const REASON_COLOR = {
  "Mechanical":          "bg-red-500/20 text-red-400",
  "Electrical":          "bg-orange-500/20 text-orange-400",
  "Material Shortage":   "bg-amber-500/20 text-amber-400",
  "Setup/Changeover":    "bg-blue-500/20 text-blue-400",
  "Operator":            "bg-purple-500/20 text-purple-400",
  "Planned Maintenance": "bg-teal-500/20 text-teal-400",
  "Quality Issue":       "bg-pink-500/20 text-pink-400",
  "Utilities":           "bg-gray-600 text-gray-300",
};

const emptyEvent = (wsId) => ({
  workstation_id: wsId, date: new Date().toISOString().slice(0,10),
  start_time: "", duration_mins: "", reason: "Mechanical", notes: "", shift: 1,
});

export default function DowntimeLog({ activeLine }) {
  const product  = PRODUCTS.find(p => p.id === activeLine) || PRODUCTS[0];
  const stations = WORKSTATIONS.filter(ws => ws.product_id === product.id);
  const [events, setEvents] = useState(
    DOWNTIME_EVENTS.filter(d => stations.some(ws => ws.id === d.workstation_id))
      .sort((a, b) => b.date.localeCompare(a.date))
  );
  const [form, setForm]       = useState(emptyEvent(stations[0]?.id));
  const [filterReason, setFR] = useState("all");
  const [filterWS, setFWS]    = useState("all");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = (e) => {
    e.preventDefault();
    setEvents(prev => [{ ...form, id: `dt_${Date.now()}`, duration_mins: Number(form.duration_mins) }, ...prev]);
    setForm(emptyEvent(form.workstation_id));
  };

  const handleDelete = (id) => setEvents(prev => prev.filter(e => e.id !== id));

  const filtered = events.filter(ev =>
    (filterReason === "all" || ev.reason === filterReason) &&
    (filterWS === "all" || ev.workstation_id === filterWS)
  );

  // Summary by reason
  const byReason = {};
  events.forEach(ev => { byReason[ev.reason] = (byReason[ev.reason] || 0) + Number(ev.duration_mins); });
  const totalMins = events.reduce((s, e) => s + Number(e.duration_mins), 0);

  // MTBF / MTTR estimation
  const uniqueDays = [...new Set(events.map(e => e.date))].length || 1;
  const unplanned  = events.filter(e => e.reason !== "Planned Maintenance");
  const mttr = unplanned.length ? Math.round(unplanned.reduce((s,e) => s + Number(e.duration_mins),0) / unplanned.length) : 0;
  const plannedHrsTotal = stations.length * uniqueDays * 8 * 60;
  const mtbf = unplanned.length ? Math.round((plannedHrsTotal - totalMins) / unplanned.length) : 0;

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-red-400">{totalMins}</p>
          <p className="text-xs text-gray-500">Total Downtime (min)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-amber-400">{events.length}</p>
          <p className="text-xs text-gray-500">Total Events</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-blue-400">{mttr}</p>
          <p className="text-xs text-gray-500">MTTR (min)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-green-400">{mtbf}</p>
          <p className="text-xs text-gray-500">MTBF (min)</p>
        </div>
      </div>

      {/* Reason summary pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(byReason).sort((a,b) => b[1]-a[1]).map(([reason, mins]) => (
          <button key={reason} onClick={() => setFR(filterReason === reason ? "all" : reason)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              filterReason === reason ? "border-white" : "border-transparent"
            } ${REASON_COLOR[reason] || "bg-gray-700 text-gray-300"}`}>
            {reason}: {mins} min ({Math.round(mins/totalMins*100)}%)
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Log entry form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold text-white mb-4">Log Downtime Event</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Workstation</label>
              <select value={form.workstation_id} onChange={e => set("workstation_id", e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm">
                {stations.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Start Time</label>
                <input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} required
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Duration (min)</label>
                <input type="number" min="1" value={form.duration_mins} onChange={e => set("duration_mins", e.target.value)} required
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Shift</label>
                <select value={form.shift} onChange={e => set("shift", Number(e.target.value))}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm">
                  <option value={1}>Shift 1</option><option value={2}>Shift 2</option><option value={3}>Shift 3</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Reason</label>
              <select value={form.reason} onChange={e => set("reason", e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm">
                {DOWNTIME_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Notes / Root Cause</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-sm">
              Log Downtime
            </button>
          </form>
        </div>

        {/* Event list */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <select value={filterWS} onChange={e => setFWS(e.target.value)}
              className="bg-gray-800 text-sm text-white border border-gray-700 rounded-lg px-3 py-1.5">
              <option value="all">All Stations</option>
              {stations.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
            </select>
            <span className="text-xs text-gray-500">{filtered.length} events</span>
            <button onClick={() => exportCSV(filtered, `downtime-${product.id}.csv`)}
              className="ml-auto text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">
              📤 Export
            </button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map(ev => {
              const ws = stations.find(s => s.id === ev.workstation_id);
              return (
                <div key={ev.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-start gap-3">
                  <div className="flex-shrink-0 text-center">
                    <p className={`text-xl font-black ${ev.duration_mins > 60 ? "text-red-400" : ev.duration_mins > 30 ? "text-amber-400" : "text-gray-300"}`}>
                      {ev.duration_mins}
                    </p>
                    <p className="text-xs text-gray-500">min</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-sm text-white">{ws?.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${REASON_COLOR[ev.reason] || "bg-gray-700 text-gray-300"}`}>{ev.reason}</span>
                      <span className="text-xs text-gray-500">Shift {ev.shift}</span>
                    </div>
                    <p className="text-xs text-gray-400">{ev.date} · {ev.start_time}</p>
                    {ev.notes && <p className="text-xs text-gray-500 mt-0.5 italic">"{ev.notes}"</p>}
                  </div>
                  <button onClick={() => handleDelete(ev.id)} className="text-gray-600 hover:text-red-400 text-sm flex-shrink-0">🗑</button>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No downtime events</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
