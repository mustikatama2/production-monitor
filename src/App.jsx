import { useState, useEffect } from "react";
import Dashboard      from "./pages/Dashboard";
import ProcessFlow    from "./pages/ProcessFlow";
import ProductionEntry from "./pages/ProductionEntry";
import Analytics      from "./pages/Analytics";
import StatusBoard    from "./pages/StatusBoard";
import WorkOrders     from "./pages/WorkOrders";
import DowntimeLog    from "./pages/DowntimeLog";
import { PRODUCTS, WORKSTATIONS, PRODUCTION_RUNS, MACHINE_STATUS, calcOEE } from "./lib/demoData";

const NAV_GROUPS = [
  {
    label: "Monitor",
    items: [
      { id:"dashboard",  label:"Dashboard",       icon:"📊" },
      { id:"status",     label:"Status Board",    icon:"🟢" },
      { id:"analytics",  label:"Analytics",       icon:"📈" },
    ],
  },
  {
    label: "Production",
    items: [
      { id:"workorders", label:"Work Orders",      icon:"📋" },
      { id:"entry",      label:"Production Entry", icon:"✏️"  },
      { id:"downtime",   label:"Downtime Log",     icon:"⚠️"  },
    ],
  },
  {
    label: "Configure",
    items: [
      { id:"flow",       label:"Process Flow",     icon:"🔀" },
    ],
  },
];

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span className="font-mono text-xs text-gray-400">{t.toLocaleTimeString("id-ID")}</span>;
}

export default function App() {
  const [page,       setPage]    = useState("dashboard");
  const [activeLine, setLine]    = useState(PRODUCTS[0].id);
  const [collapsed,  setCollapse] = useState(false);

  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const activePage = allItems.find(n => n.id === page);
  const activeProduct = PRODUCTS.find(p => p.id === activeLine);

  // Global alert count (stations below target today)
  const today    = new Date().toISOString().slice(0,10);
  const stations = WORKSTATIONS.filter(ws => ws.product_id === activeLine);
  const runs     = PRODUCTION_RUNS.filter(r => r.date === today && stations.some(ws => ws.id === r.workstation_id));
  const downMachines = MACHINE_STATUS.filter(s => s.status === "Down" && stations.some(ws => ws.id === s.workstation_id)).length;
  const belowTarget  = stations.filter(ws => {
    const run = runs.find(r => r.workstation_id === ws.id);
    if (!run) return false;
    return calcOEE(run, ws).oee < ws.oee_target;
  }).length;
  const alertCount = downMachines + belowTarget;

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-14" : "w-56"} flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className={`flex items-center gap-2 px-4 py-4 border-b border-gray-800 ${collapsed ? "justify-center" : ""}`}>
          <span className="text-xl flex-shrink-0">🏭</span>
          {!collapsed && <span className="font-black text-white text-sm leading-tight">Production<br/>Monitor</span>}
        </div>

        {/* Line selector */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Line</p>
            {PRODUCTS.map(p => (
              <button key={p.id} onClick={() => setLine(p.id)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg mb-0.5 transition-colors ${
                  activeLine === p.id ? "bg-blue-600 text-white font-bold" : "text-gray-400 hover:bg-gray-800"}`}>
                {p.industry === "Plywood" ? "🪵" : "🌾"} {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-xs text-gray-600 uppercase tracking-wider font-bold px-2 mb-1">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <button key={item.id} onClick={() => setPage(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                      page === item.id
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}>
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                    {/* Alert badge on dashboard */}
                    {item.id === "dashboard" && alertCount > 0 && (
                      <span className={`${collapsed ? "absolute top-1 right-1" : "ml-auto"} bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold`}>
                        {alertCount}
                      </span>
                    )}
                    {item.id === "status" && downMachines > 0 && (
                      <span className={`${collapsed ? "absolute top-1 right-1" : "ml-auto"} bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold`}>
                        {downMachines}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button onClick={() => setCollapse(!collapsed)}
          className="m-3 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-500 text-xs text-center">
          {collapsed ? "▶" : "◀ Collapse"}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-bold text-white text-sm">{activePage?.icon} {activePage?.label}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                {activeProduct?.industry} · {new Date().toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
              </span>
              <span className="text-gray-700">·</span>
              <LiveClock />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <button onClick={() => setPage("dashboard")}
                className="flex items-center gap-1.5 text-xs bg-red-500/20 border border-red-500/40 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30">
                🔴 {alertCount} Alert{alertCount > 1 ? "s" : ""}
              </button>
            )}
            <span className="text-xs bg-gray-800 border border-gray-700 text-gray-500 px-3 py-1.5 rounded-lg hidden md:block">
              Demo Data
            </span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-5">
          {page === "dashboard"  && <Dashboard      activeLine={activeLine} />}
          {page === "status"     && <StatusBoard     activeLine={activeLine} />}
          {page === "analytics"  && <Analytics       activeLine={activeLine} />}
          {page === "workorders" && <WorkOrders      activeLine={activeLine} />}
          {page === "entry"      && <ProductionEntry activeLine={activeLine} />}
          {page === "downtime"   && <DowntimeLog     activeLine={activeLine} />}
          {page === "flow"       && <ProcessFlow     activeLine={activeLine} />}
        </main>
      </div>
    </div>
  );
}
