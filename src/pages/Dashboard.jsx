import OEEGauge from "../components/OEEGauge";
import { calcOEE, WORKSTATIONS, PRODUCTION_RUNS, PRODUCTS, WORK_ORDERS, DOWNTIME_EVENTS, MACHINE_STATUS } from "../lib/demoData";

const oeeColor = (v) => v >= 85 ? "text-green-400" : v >= 65 ? "text-amber-400" : "text-red-400";
const oeeBar   = (v) => v >= 85 ? "bg-green-500"  : v >= 65 ? "bg-amber-500"  : "bg-red-500";

const STATUS_DOT = { Running:"bg-green-500 animate-pulse", Idle:"bg-amber-500", Down:"bg-red-500 animate-pulse", Maintenance:"bg-blue-500" };

function StatCard({ label, value, sub, color = "text-white", badge }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs text-gray-500">{label}</p>
        {badge && <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${badge.style}`}>{badge.text}</span>}
      </div>
      <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ activeLine }) {
  const product  = PRODUCTS.find(p => p.id === activeLine) || PRODUCTS[0];
  const stations = WORKSTATIONS.filter(ws => ws.product_id === product.id);
  const today    = new Date().toISOString().slice(0,10);
  const runs     = PRODUCTION_RUNS.filter(r => r.date === today && stations.some(ws => ws.id === r.workstation_id));
  const machStat = MACHINE_STATUS.filter(s => stations.some(ws => ws.id === s.workstation_id));
  const woActive = WORK_ORDERS.filter(wo => wo.product_id === product.id && wo.status === "In Progress");
  const dtToday  = DOWNTIME_EVENTS.filter(d => d.date === today && stations.some(ws => ws.id === d.workstation_id));

  const stationMetrics = stations.map(ws => {
    const run = runs.find(r => r.workstation_id === ws.id);
    if (!run) return { ws, metrics: null };
    return { ws, run, metrics: calcOEE(run, ws) };
  });

  const withMetrics = stationMetrics.filter(x => x.metrics);
  const avgOEE      = withMetrics.length ? withMetrics.reduce((s,x) => s + x.metrics.oee,0) / withMetrics.length : 0;
  const totalInput  = runs.reduce((s,r) => s + r.input_qty,0);
  const totalDown   = runs.reduce((s,r) => s + r.downtime_mins,0);
  const lineYield   = runs.length > 0 && runs[0].input_qty > 0
    ? (runs[runs.length-1].good_qty / runs[0].input_qty) * 100 : 0;

  // Bottleneck
  const bottleneck  = [...withMetrics].sort((a,b) => a.metrics.oee - b.metrics.oee)[0];

  // Alerts
  const alerts = [
    ...withMetrics.filter(x => x.metrics.oee < x.ws.oee_target).map(x => ({
      type: "warning", msg: `${x.ws.name}: OEE ${x.metrics.oee.toFixed(1)}% — below target ${x.ws.oee_target}%`
    })),
    ...machStat.filter(s => s.status === "Down").map(s => ({
      type: "error", msg: `${stations.find(ws=>ws.id===s.workstation_id)?.name} is DOWN — ${s.note}`
    })),
    ...dtToday.filter(d => d.duration_mins > 60).map(d => ({
      type: "warning", msg: `Long downtime at ${stations.find(ws=>ws.id===d.workstation_id)?.name}: ${d.duration_mins}min (${d.reason})`
    })),
    ...woActive.filter(wo => wo.due_date <= today && wo.progress < 100).map(wo => ({
      type: "error", msg: `Work Order ${wo.wo_no} overdue — ${wo.progress}% complete`
    })),
  ];

  // Target vs Actual
  const targetOEE = stations.length > 0
    ? stations.reduce((s,ws) => s + ws.oee_target,0) / stations.length : 80;

  return (
    <div className="space-y-5">

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
              a.type === "error"
                ? "bg-red-500/10 border-red-500/40 text-red-300"
                : "bg-amber-500/10 border-amber-500/40 text-amber-300"
            }`}>
              <span className="text-base flex-shrink-0">{a.type === "error" ? "🔴" : "⚠️"}</span>
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Plant OEE" value={`${avgOEE.toFixed(1)}%`}
          color={oeeColor(avgOEE)} sub={`Target: ${targetOEE.toFixed(0)}%`}
          badge={avgOEE >= targetOEE ? {text:"ON TARGET",style:"bg-green-500/20 text-green-400"} : {text:"BELOW",style:"bg-red-500/20 text-red-400"}} />
        <StatCard label="Line Yield" value={`${lineYield.toFixed(1)}%`}
          color="text-blue-400" sub={`From ${totalInput.toLocaleString()} ${product.unit}`} />
        <StatCard label="Downtime Today" value={`${totalDown} min`}
          color={totalDown > 120 ? "text-red-400" : "text-amber-400"} sub={`${dtToday.length} events logged`} />
        <StatCard label="Bottleneck" value={bottleneck?.ws.name.split(" ")[0] || "—"}
          color="text-red-400" sub={bottleneck ? `OEE ${bottleneck.metrics.oee.toFixed(1)}%` : "None"} />
      </div>

      {/* Target vs Actual bar + Active WOs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* OEE Target vs Actual */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">OEE — Target vs Actual</h3>
          <div className="space-y-3">
            {withMetrics.map(({ws, metrics}) => (
              <div key={ws.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{ws.name}</span>
                  <span className={`font-bold ${metrics.oee >= ws.oee_target ? "text-green-400" : "text-red-400"}`}>
                    {metrics.oee.toFixed(1)}% / {ws.oee_target}%
                  </span>
                </div>
                <div className="relative w-full bg-gray-800 rounded-full h-3">
                  <div className={`${oeeBar(metrics.oee)} h-3 rounded-full`} style={{ width: `${Math.min(100,metrics.oee)}%` }} />
                  {/* Target line */}
                  <div className="absolute top-0 h-3 w-0.5 bg-white/40 rounded"
                    style={{ left: `${ws.oee_target}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Work Orders */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Active Work Orders</h3>
          {woActive.length === 0 ? (
            <p className="text-gray-500 text-sm">No active work orders</p>
          ) : (
            <div className="space-y-3">
              {woActive.map(wo => (
                <div key={wo.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-bold">{wo.wo_no}</span>
                    <span className={`${wo.due_date <= today && wo.progress < 100 ? "text-red-400" : "text-gray-400"}`}>
                      Due {wo.due_date}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{wo.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${wo.progress}%` }} />
                    </div>
                    <span className="text-xs text-blue-400 font-bold w-10 text-right">{wo.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Machine status strip */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Machine Status</h3>
        <div className="flex flex-wrap gap-2">
          {stations.map(ws => {
            const s = machStat.find(m => m.workstation_id === ws.id);
            const status = s?.status || "Idle";
            return (
              <div key={ws.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{ws.name}</p>
                  <p className="text-xs text-gray-500">{s?.operator || "—"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workstation OEE Cards */}
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Workstation Detail — {product.name}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {stationMetrics.map(({ ws, run, metrics }) => (
          <div key={ws.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-white">{ws.name}</p>
                <p className="text-xs text-gray-500">{run ? `Batch: ${run.batch}` : "No data today"}</p>
              </div>
              {metrics && (
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                  metrics.oee >= ws.oee_target ? "bg-green-500/20 text-green-400"
                  : metrics.oee >= ws.oee_target - 10 ? "bg-amber-500/20 text-amber-400"
                  : "bg-red-500/20 text-red-400"
                }`}>
                  {metrics.oee >= ws.oee_target ? "ON TARGET" : metrics.oee >= ws.oee_target - 10 ? "MONITOR" : "BELOW"}
                </span>
              )}
            </div>

            {metrics ? (
              <>
                <div className="flex items-center gap-4">
                  <OEEGauge value={metrics.oee} label="OEE" size={100} />
                  <div className="flex-1 space-y-2">
                    {[["Availability", metrics.availability],["Performance",metrics.performance],["Quality",metrics.quality]].map(([label,val]) => (
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
                <div className="grid grid-cols-4 gap-1 mt-3 border-t border-gray-800 pt-3 text-center">
                  {[["Input",run.input_qty.toLocaleString(),"text-white"],
                    ["Good",run.good_qty.toLocaleString(),"text-green-400"],
                    ["Yield",`${metrics.yield.toFixed(1)}%`,oeeColor(metrics.yield)],
                    ["Down",`${run.downtime_mins}m`,run.downtime_mins>30?"text-red-400":"text-gray-400"]].map(([l,v,c]) => (
                    <div key={l}>
                      <p className="text-xs text-gray-500">{l}</p>
                      <p className={`font-bold text-xs ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>
                {/* Routing */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {ws.output_routing.map((r,i) => (
                    <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${
                      r.destination==="FG"?"bg-blue-500/20 text-blue-400":r.destination==="SCRAP"?"bg-red-500/20 text-red-400":"bg-gray-700 text-gray-300"
                    }`}>{r.label} {r.pct}%</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">⏸</p>
                <p className="text-xs text-gray-500">No production data today</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
