import { useState } from "react";
import { WORKSTATIONS, PRODUCTS, PRODUCTION_RUNS, calcOEE } from "../lib/demoData";

const DST_LABEL = { FG: "✅ Finished Goods", SCRAP: "🗑️ Scrap/Reject", WIP: "🔄 WIP Hold" };

function RouteEditor({ ws, allStations, onSave, onClose }) {
  const [routes, setRoutes] = useState(
    ws.output_routing.map(r => ({ ...r }))
  );

  const total = routes.reduce((s, r) => s + Number(r.pct), 0);

  const update = (i, field, val) => {
    const next = [...routes];
    next[i] = { ...next[i], [field]: val };
    setRoutes(next);
  };

  const addRoute = () => setRoutes([...routes, { destination: "FG", label: "→ Finished", pct: 0 }]);
  const removeRoute = (i) => setRoutes(routes.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-800">
          <h3 className="font-bold text-white">Edit Output Routing — {ws.name}</h3>
          <p className="text-xs text-gray-400 mt-1">Where does the output go? Total must equal 100%</p>
        </div>
        <div className="p-5 space-y-3">
          {routes.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select value={r.destination} onChange={e => update(i, "destination", e.target.value)}
                className="bg-gray-800 text-sm text-white border border-gray-700 rounded-lg px-2 py-1.5 flex-1">
                {allStations.filter(s => s.id !== ws.id).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="FG">✅ Finished Goods</option>
                <option value="SCRAP">🗑️ Scrap</option>
                <option value="WIP">🔄 WIP Hold</option>
              </select>
              <input type="text" value={r.label} onChange={e => update(i, "label", e.target.value)}
                placeholder="Label"
                className="bg-gray-800 text-sm text-white border border-gray-700 rounded-lg px-2 py-1.5 w-28" />
              <input type="number" value={r.pct} onChange={e => update(i, "pct", Number(e.target.value))}
                min="0" max="100"
                className="bg-gray-800 text-sm text-white border border-gray-700 rounded-lg px-2 py-1.5 w-16 text-right" />
              <span className="text-gray-500 text-sm">%</span>
              <button onClick={() => removeRoute(i)} className="text-red-400 hover:text-red-300 text-lg">×</button>
            </div>
          ))}
          <button onClick={addRoute}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            + Add route
          </button>
          <div className={`text-xs mt-1 ${total === 100 ? "text-green-400" : "text-red-400"}`}>
            Total: {total}% {total !== 100 ? "(must be 100%)" : "✓"}
          </div>
        </div>
        <div className="p-5 border-t border-gray-800 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-800 rounded-lg hover:bg-gray-700">Cancel</button>
          <button onClick={() => onSave(routes)} disabled={total !== 100}
            className="px-4 py-2 text-sm bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-40 font-bold">
            Save Routing
          </button>
        </div>
      </div>
    </div>
  );
}

function StationBox({ ws, run, editing, onClick }) {
  const metrics = run ? calcOEE(run, ws) : null;
  const oee = metrics?.oee ?? 0;
  const borderColor = !metrics ? "border-gray-700"
    : oee >= 85 ? "border-green-500" : oee >= 65 ? "border-amber-500" : "border-red-500";
  const bgColor = !metrics ? "bg-gray-900"
    : oee >= 85 ? "bg-green-500/10" : oee >= 65 ? "bg-amber-500/10" : "bg-red-500/10";

  return (
    <div onClick={onClick}
      className={`relative border-2 ${borderColor} ${bgColor} rounded-xl p-3 cursor-pointer hover:scale-105 transition-all w-36 text-center ${editing ? "ring-2 ring-blue-400" : ""}`}>
      <p className="text-xs font-bold text-white leading-tight">{ws.name}</p>
      {metrics ? (
        <>
          <p className={`text-lg font-black mt-1 ${oee >= 85 ? "text-green-400" : oee >= 65 ? "text-amber-400" : "text-red-400"}`}>
            {oee.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">OEE</p>
          <p className="text-xs text-gray-500 mt-1">Yield {metrics.yield.toFixed(1)}%</p>
        </>
      ) : (
        <p className="text-xs text-gray-600 mt-1">No data</p>
      )}
      <p className="text-xs text-blue-400 mt-1 opacity-0 group-hover:opacity-100">Edit routing →</p>
    </div>
  );
}

function Arrow({ label, pct, color = "text-gray-500" }) {
  return (
    <div className="flex flex-col items-center justify-center w-16 flex-shrink-0">
      <div className={`text-xs text-center ${color} font-medium`}>{label}</div>
      <div className="text-gray-600 text-lg">→</div>
      <div className={`text-xs ${color}`}>{pct}%</div>
    </div>
  );
}

export default function ProcessFlow({ activeLine }) {
  const product = PRODUCTS.find(p => p.id === activeLine) || PRODUCTS[0];
  const [stations, setStations] = useState(
    WORKSTATIONS.filter(ws => ws.product_id === product.id)
  );
  const [editing, setEditing] = useState(null);
  const runs = PRODUCTION_RUNS.filter(r => stations.some(ws => ws.id === r.workstation_id));

  const handleSaveRouting = (wsId, routes) => {
    setStations(prev => prev.map(ws => ws.id === wsId ? { ...ws, output_routing: routes } : ws));
    setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">{product.name} — Process Flow</h2>
          <p className="text-xs text-gray-400 mt-0.5">Click any workstation to edit its output routing</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> OEE ≥85%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 65–84%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &lt;65%</span>
        </div>
      </div>

      {/* Flow chart — horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-0 min-w-max">
          {stations.map((ws, idx) => {
            const run = runs.find(r => r.workstation_id === ws.id);
            const mainRoute = ws.output_routing.find(r => r.destination !== "SCRAP" && r.destination !== "WIP");
            const sideRoutes = ws.output_routing.filter(r => r.destination === "SCRAP" || r.destination === "WIP");

            return (
              <div key={ws.id} className="flex items-start">
                {/* Station + side outputs */}
                <div className="flex flex-col items-center">
                  <StationBox ws={ws} run={run} editing={editing === ws.id}
                    onClick={() => setEditing(editing === ws.id ? null : ws.id)} />
                  {/* Side routes (scrap/WIP) */}
                  {sideRoutes.map((sr, si) => (
                    <div key={si} className="flex flex-col items-center mt-1">
                      <div className="w-0.5 h-4 bg-red-500/50" />
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        sr.destination === "SCRAP" ? "bg-red-500/20 text-red-400" : "bg-gray-700 text-gray-400"
                      }`}>
                        {sr.destination === "SCRAP" ? "🗑️" : "🔄"} {sr.pct}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Arrow to next station or FG */}
                {mainRoute && (
                  <Arrow
                    label={mainRoute.destination === "FG" ? "FG" : ""}
                    pct={mainRoute.pct}
                    color={mainRoute.destination === "FG" ? "text-blue-400" : "text-gray-400"}
                  />
                )}

                {/* FG box at end */}
                {mainRoute?.destination === "FG" && idx === stations.length - 1 && (
                  <div className="border-2 border-blue-500 bg-blue-500/10 rounded-xl p-3 text-center w-32">
                    <p className="text-lg">📦</p>
                    <p className="text-xs font-bold text-blue-400">Finished Goods</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Routing table */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-bold text-gray-300">Routing Summary</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500">
              <th className="text-left px-4 py-2">Workstation</th>
              <th className="text-left px-4 py-2">Destination</th>
              <th className="text-right px-4 py-2">%</th>
              <th className="text-center px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {stations.map(ws =>
              ws.output_routing.map((route, i) => (
                <tr key={`${ws.id}-${i}`} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2 text-gray-300">{i === 0 ? ws.name : ""}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      route.destination === "FG" ? "bg-blue-500/20 text-blue-400"
                      : route.destination === "SCRAP" ? "bg-red-500/20 text-red-400"
                      : route.destination === "WIP" ? "bg-gray-700 text-gray-400"
                      : "bg-gray-700 text-gray-300"
                    }`}>
                      {route.destination === "FG" ? "✅ Finished Goods"
                       : route.destination === "SCRAP" ? "🗑️ Scrap"
                       : route.destination === "WIP" ? "🔄 WIP Hold"
                       : stations.find(s => s.id === route.destination)?.name || route.destination}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-300">{route.pct}%</td>
                  <td className="px-4 py-2 text-center">
                    {i === 0 && (
                      <button onClick={() => setEditing(ws.id)}
                        className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <RouteEditor
          ws={stations.find(ws => ws.id === editing)}
          allStations={stations}
          onSave={(routes) => handleSaveRouting(editing, routes)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
