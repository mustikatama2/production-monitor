import OEEGauge from "../components/OEEGauge";
import { calcOEE, WORKSTATIONS, PRODUCTION_RUNS, PRODUCTS } from "../lib/demoData";

const oeeColor = (v) => v >= 85 ? "text-green-400" : v >= 65 ? "text-amber-400" : "text-red-400";
const oeeBar  = (v) => v >= 85 ? "bg-green-500" : v >= 65 ? "bg-amber-500" : "bg-red-500";

function StatCard({ label, value, sub, color = "text-white" }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ activeLine }) {
  const product = PRODUCTS.find(p => p.id === activeLine) || PRODUCTS[0];
  const stations = WORKSTATIONS.filter(ws => ws.product_id === product.id);
  const runs = PRODUCTION_RUNS.filter(r =>
    stations.some(ws => ws.id === r.workstation_id)
  );

  // Aggregate OEE across all stations
  const stationMetrics = stations.map(ws => {
    const run = runs.find(r => r.workstation_id === ws.id);
    if (!run) return { ws, metrics: null };
    return { ws, run, metrics: calcOEE(run, ws) };
  }).filter(x => x.metrics);

  const avgOEE = stationMetrics.length
    ? stationMetrics.reduce((s, x) => s + x.metrics.oee, 0) / stationMetrics.length
    : 0;

  const totalInput  = runs.reduce((s, r) => s + r.input_qty, 0);
  const totalGood   = runs.reduce((s, r) => s + r.good_qty, 0);
  const totalDown   = runs.reduce((s, r) => s + r.downtime_mins, 0);
  const overallYield = totalInput > 0 ? (totalGood / (runs[0]?.input_qty || 1)) * 100 : 0;

  // Bottleneck: lowest OEE station
  const bottleneck = [...stationMetrics].sort((a, b) => a.metrics.oee - b.metrics.oee)[0];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Plant OEE" value={`${avgOEE.toFixed(1)}%`}
          color={oeeColor(avgOEE)} sub="Avg across all stations" />
        <StatCard label="Line Yield" value={`${overallYield.toFixed(1)}%`}
          color="text-blue-400" sub={`${product.unit} good / input`} />
        <StatCard label="Total Downtime" value={`${totalDown} min`}
          color={totalDown > 120 ? "text-red-400" : "text-amber-400"}
          sub="All stations today" />
        <StatCard label="Bottleneck"
          value={bottleneck?.ws.name || "—"}
          color="text-red-400"
          sub={bottleneck ? `OEE ${bottleneck.metrics.oee.toFixed(1)}%` : "None"} />
      </div>

      {/* Per-station cards */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
          Workstation Detail — {product.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {stationMetrics.map(({ ws, run, metrics }) => (
            <div key={ws.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{ws.name}</p>
                  <p className="text-xs text-gray-500">Batch: {run.batch} · Shift {run.shift}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                  metrics.oee >= 85 ? "bg-green-500/20 text-green-400"
                  : metrics.oee >= 65 ? "bg-amber-500/20 text-amber-400"
                  : "bg-red-500/20 text-red-400"
                }`}>
                  {metrics.oee >= 85 ? "GOOD" : metrics.oee >= 65 ? "AVG" : "LOW"}
                </span>
              </div>

              {/* OEE gauge + sub-metrics */}
              <div className="flex items-center gap-4">
                <OEEGauge value={metrics.oee} label="OEE" size={100} />
                <div className="flex-1 space-y-2">
                  {[
                    ["Availability", metrics.availability],
                    ["Performance",  metrics.performance],
                    ["Quality",      metrics.quality],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-400">{label}</span>
                        <span className={oeeColor(val)}>{val.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div className={`${oeeBar(val)} h-1.5 rounded-full`} style={{ width: `${Math.min(100,val)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Production stats */}
              <div className="grid grid-cols-3 gap-2 mt-3 border-t border-gray-800 pt-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Input</p>
                  <p className="font-bold text-sm">{run.input_qty.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Good</p>
                  <p className="font-bold text-sm text-green-400">{run.good_qty.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Yield</p>
                  <p className={`font-bold text-sm ${oeeColor(metrics.yield)}`}>{metrics.yield.toFixed(1)}%</p>
                </div>
              </div>

              {/* Routing */}
              <div className="mt-3 border-t border-gray-800 pt-3">
                <p className="text-xs text-gray-500 mb-1">Output Routing</p>
                <div className="flex flex-wrap gap-1">
                  {ws.output_routing.map((route, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded ${
                      route.destination === "FG" ? "bg-blue-500/20 text-blue-400"
                      : route.destination === "SCRAP" ? "bg-red-500/20 text-red-400"
                      : "bg-gray-700 text-gray-300"
                    }`}>
                      {route.label} {route.pct}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
