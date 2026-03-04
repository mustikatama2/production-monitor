import { useState } from "react";
import { WORKSTATIONS, PRODUCTION_RUNS, PRODUCTS, calcOEE } from "../lib/demoData";

const TODAY = new Date().toISOString().slice(0, 10);

const empty = (wsId = "") => ({
  workstation_id: wsId, date: TODAY, shift: 1, batch: "",
  input_qty: "", output_qty: "", good_qty: "",
  planned_time_mins: 480, actual_time_mins: 480, downtime_mins: 0, notes: "",
});

export default function ProductionEntry({ activeLine }) {
  const product = PRODUCTS.find(p => p.id === activeLine) || PRODUCTS[0];
  const stations = WORKSTATIONS.filter(ws => ws.product_id === product.id);
  const [runs, setRuns] = useState(PRODUCTION_RUNS.filter(r => stations.some(ws => ws.id === r.workstation_id)));
  const [form, setForm] = useState(empty(stations[0]?.id));
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const preview = () => {
    const ws = stations.find(s => s.id === form.workstation_id);
    if (!ws || !form.input_qty || !form.output_qty || !form.good_qty) return null;
    const run = {
      ...form,
      input_qty: Number(form.input_qty),
      output_qty: Number(form.output_qty),
      good_qty: Number(form.good_qty),
      planned_time_mins: Number(form.planned_time_mins),
      actual_time_mins: Number(form.actual_time_mins),
      downtime_mins: Number(form.downtime_mins),
    };
    return calcOEE(run, ws);
  };

  const metrics = preview();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRun = {
      id: `r${Date.now()}`,
      ...form,
      input_qty: Number(form.input_qty),
      output_qty: Number(form.output_qty),
      good_qty: Number(form.good_qty),
      planned_time_mins: Number(form.planned_time_mins),
      actual_time_mins: Number(form.actual_time_mins),
      downtime_mins: Number(form.downtime_mins),
    };
    setRuns(prev => [newRun, ...prev]);
    setSaved(true);
    setForm(empty(form.workstation_id));
    setTimeout(() => setSaved(false), 3000);
  };

  const oeeColor = (v) => v >= 85 ? "text-green-400" : v >= 65 ? "text-amber-400" : "text-red-400";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-1">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Log Production Run</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
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
                <label className="text-xs text-gray-400 block mb-1">Shift</label>
                <select value={form.shift} onChange={e => set("shift", Number(e.target.value))}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm">
                  <option value={1}>Shift 1</option>
                  <option value={2}>Shift 2</option>
                  <option value={3}>Shift 3</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Batch / Work Order</label>
              <input type="text" value={form.batch} onChange={e => set("batch", e.target.value)}
                placeholder="e.g. PL-002" required
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[["Input Qty", "input_qty"], ["Output Qty", "output_qty"], ["Good Qty", "good_qty"]].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{label}</label>
                  <input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)}
                    required
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[["Planned (min)", "planned_time_mins"], ["Actual (min)", "actual_time_mins"], ["Downtime (min)", "downtime_mins"]].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{label}</label>
                  <input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>

            {/* Live OEE preview */}
            {metrics && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Live OEE Preview</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[["OEE", metrics.oee], ["Avail.", metrics.availability], ["Perf.", metrics.performance], ["Qual.", metrics.quality]].map(([l, v]) => (
                    <div key={l}>
                      <p className={`text-sm font-black ${oeeColor(v)}`}>{v.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-colors">
              Save Production Run
            </button>
            {saved && <p className="text-center text-sm text-green-400">✓ Saved successfully</p>}
          </form>
        </div>
      </div>

      {/* Run history */}
      <div className="lg:col-span-2">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-bold text-gray-300">Recent Production Runs — {product.name}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="text-left px-4 py-2">Station</th>
                  <th className="text-left px-4 py-2">Batch</th>
                  <th className="text-right px-4 py-2">Input</th>
                  <th className="text-right px-4 py-2">Good</th>
                  <th className="text-right px-4 py-2">Yield</th>
                  <th className="text-right px-4 py-2">OEE</th>
                  <th className="text-right px-4 py-2">Down</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(run => {
                  const ws = stations.find(s => s.id === run.workstation_id);
                  if (!ws) return null;
                  const m = calcOEE(run, ws);
                  return (
                    <tr key={run.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-2 text-gray-300">{ws.name}</td>
                      <td className="px-4 py-2 text-gray-400 text-xs">{run.batch}</td>
                      <td className="px-4 py-2 text-right">{run.input_qty.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-green-400">{run.good_qty.toLocaleString()}</td>
                      <td className={`px-4 py-2 text-right font-bold ${oeeColor(m.yield)}`}>{m.yield.toFixed(1)}%</td>
                      <td className={`px-4 py-2 text-right font-bold ${oeeColor(m.oee)}`}>{m.oee.toFixed(1)}%</td>
                      <td className="px-4 py-2 text-right text-gray-400">{run.downtime_mins}m</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
