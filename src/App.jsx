import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import ProcessFlow from "./pages/ProcessFlow";
import ProductionEntry from "./pages/ProductionEntry";
import { PRODUCTS } from "./lib/demoData";

const NAV = [
  { id: "dashboard",  label: "Dashboard",       icon: "📊" },
  { id: "flow",       label: "Process Flow",     icon: "🔀" },
  { id: "entry",      label: "Production Entry", icon: "✏️"  },
];

export default function App() {
  const [page, setPage]         = useState("dashboard");
  const [activeLine, setLine]   = useState(PRODUCTS[0].id);
  const [sidebarOpen, setSidebar] = useState(true);

  const activePage = NAV.find(n => n.id === page);

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
          <span className="text-xl">🏭</span>
          {sidebarOpen && <span className="font-black text-white text-sm">Production Monitor</span>}
        </div>

        {/* Product line selector */}
        {sidebarOpen && (
          <div className="px-3 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 mb-1.5">Production Line</p>
            {PRODUCTS.map(p => (
              <button key={p.id} onClick={() => setLine(p.id)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg mb-1 transition-colors ${
                  activeLine === p.id ? "bg-blue-600 text-white font-bold" : "text-gray-400 hover:bg-gray-800"
                }`}>
                {p.industry === "Plywood" ? "🪵" : "🌾"} {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                page === item.id
                  ? "bg-blue-600 text-white font-bold"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle */}
        <button onClick={() => setSidebar(!sidebarOpen)}
          className="m-3 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs text-center">
          {sidebarOpen ? "◀ Collapse" : "▶"}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-bold text-white">{activePage?.icon} {activePage?.label}</h1>
            <p className="text-xs text-gray-500">
              {PRODUCTS.find(p => p.id === activeLine)?.industry} Line ·{" "}
              {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-3 py-1.5 rounded-lg">
              Demo Data — connect Supabase to go live
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {page === "dashboard" && <Dashboard activeLine={activeLine} />}
          {page === "flow"      && <ProcessFlow activeLine={activeLine} />}
          {page === "entry"     && <ProductionEntry activeLine={activeLine} />}
        </main>
      </div>
    </div>
  );
}
