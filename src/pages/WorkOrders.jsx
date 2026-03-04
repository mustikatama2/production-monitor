import { useState } from "react";
import { WORK_ORDERS, PRODUCTS, exportCSV } from "../lib/demoData";

const STATUS_STYLE = {
  "Planned":     "bg-gray-700 text-gray-300",
  "In Progress": "bg-blue-500/20 text-blue-400",
  "Completed":   "bg-green-500/20 text-green-400",
  "On Hold":     "bg-amber-500/20 text-amber-400",
};
const PRIORITY_STYLE = {
  "High":   "bg-red-500/20 text-red-400",
  "Medium": "bg-amber-500/20 text-amber-400",
  "Low":    "bg-gray-700 text-gray-400",
};

const emptyWO = (productId) => ({
  wo_no: "", description: "", product_id: productId, target_qty: "", unit: "sheets",
  status: "Planned", priority: "Medium", start_date: new Date().toISOString().slice(0,10),
  due_date: "", batch: "", progress: 0, produced_qty: 0,
});

export default function WorkOrders({ activeLine }) {
  const product  = PRODUCTS.find(p => p.id === activeLine) || PRODUCTS[0];
  const [orders, setOrders] = useState(WORK_ORDERS.filter(wo => wo.product_id === product.id));
  const [filter, setFilter]  = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyWO(product.id));
  const [editId, setEditId]     = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const displayed = filter === "all" ? orders : orders.filter(wo => wo.status === filter);

  const handleSave = (e) => {
    e.preventDefault();
    if (editId) {
      setOrders(prev => prev.map(wo => wo.id === editId ? { ...wo, ...form } : wo));
      setEditId(null);
    } else {
      setOrders(prev => [...prev, { ...form, id: `wo_${Date.now()}`, produced_qty: 0, progress: 0 }]);
    }
    setForm(emptyWO(product.id));
    setShowForm(false);
  };

  const handleEdit = (wo) => {
    setForm({ ...wo });
    setEditId(wo.id);
    setShowForm(true);
  };

  const cycleStatus = (id) => {
    const cycle = ["Planned", "In Progress", "On Hold", "Completed"];
    setOrders(prev => prev.map(wo => wo.id === id
      ? { ...wo, status: cycle[(cycle.indexOf(wo.status) + 1) % cycle.length] }
      : wo));
  };

  // Summary
  const total     = orders.length;
  const inProg    = orders.filter(o => o.status === "In Progress").length;
  const completed = orders.filter(o => o.status === "Completed").length;
  const overdue   = orders.filter(o => o.due_date < new Date().toISOString().slice(0,10) && o.status !== "Completed").length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Total WOs", total, "text-white"], ["In Progress", inProg, "text-blue-400"],
          ["Completed", completed, "text-green-400"], ["Overdue", overdue, overdue > 0 ? "text-red-400" : "text-gray-400"]]
          .map(([label, val, color]) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{val}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {["all","Planned","In Progress","Completed","On Hold"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === s ? "bg-blue-600 text-white font-bold" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {s === "all" ? "All" : s}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => exportCSV(orders, `work-orders-${product.id}.csv`)}
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">
            📤 Export
          </button>
          <button onClick={() => { setEditId(null); setForm(emptyWO(product.id)); setShowForm(true); }}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold">
            + New Work Order
          </button>
        </div>
      </div>

      {/* Work order list */}
      <div className="space-y-2">
        {displayed.map(wo => {
          const isOverdue = wo.due_date < new Date().toISOString().slice(0,10) && wo.status !== "Completed";
          return (
            <div key={wo.id} className={`bg-gray-900 border rounded-xl p-4 ${isOverdue ? "border-red-800" : "border-gray-800"}`}>
              <div className="flex items-start gap-4 flex-wrap">
                {/* Progress circle */}
                <div className="flex-shrink-0 relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#374151" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none"
                      stroke={wo.progress === 100 ? "#22c55e" : "#3b82f6"} strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 22 * wo.progress / 100} ${2 * Math.PI * 22}`}
                      strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {wo.progress}%
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-gray-400">{wo.wo_no}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${STATUS_STYLE[wo.status]}`}>{wo.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${PRIORITY_STYLE[wo.priority]}`}>{wo.priority}</span>
                    {isOverdue && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">OVERDUE</span>}
                  </div>
                  <p className="font-bold text-white">{wo.description}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                    <span>Batch: {wo.batch}</span>
                    <span>Target: {Number(wo.target_qty).toLocaleString()} {wo.unit}</span>
                    <span>Produced: <span className="text-green-400">{Number(wo.produced_qty).toLocaleString()}</span></span>
                    <span>Start: {wo.start_date}</span>
                    <span className={isOverdue ? "text-red-400" : ""}>Due: {wo.due_date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(wo)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg">Edit</button>
                  <button onClick={() => cycleStatus(wo.id)}
                    className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-2 py-1.5 rounded-lg font-bold">
                    → Next Status
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${wo.progress === 100 ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${wo.progress}%` }} />
              </div>
            </div>
          );
        })}
        {displayed.length === 0 && (
          <div className="text-center py-12 text-gray-500">No work orders in this status</div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-white">{editId ? "Edit Work Order" : "New Work Order"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">WO Number</label>
                  <input value={form.wo_no} onChange={e => set("wo_no", e.target.value)} required placeholder="WO-2026-035"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Batch</label>
                  <input value={form.batch} onChange={e => set("batch", e.target.value)} placeholder="PL-003"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <input value={form.description} onChange={e => set("description", e.target.value)} required
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Target Qty</label>
                  <input type="number" value={form.target_qty} onChange={e => set("target_qty", e.target.value)} required
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Unit</label>
                  <input value={form.unit} onChange={e => set("unit", e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Priority</label>
                  <select value={form.priority} onChange={e => set("priority", e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm">
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} required
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              {editId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Produced Qty</label>
                    <input type="number" value={form.produced_qty} onChange={e => set("produced_qty", Number(e.target.value))}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Progress %</label>
                    <input type="number" min="0" max="100" value={form.progress} onChange={e => set("progress", Number(e.target.value))}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-800 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white">
                  {editId ? "Update" : "Create Work Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
