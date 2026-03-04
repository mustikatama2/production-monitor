// ─── Demo data — Plywood & Rice Milling ─────────────────────────────────────

export const PRODUCTS = [
  { id: "p1", name: "Plywood 18mm", industry: "Plywood",      unit: "sheets" },
  { id: "p2", name: "White Rice 5%", industry: "Rice Milling", unit: "kg"   },
];

export const WORKSTATIONS = [
  // ── Plywood ──────────────────────────────────────────────────────────────
  { id:"ws_p1", product_id:"p1", name:"Log Debarking",    order_seq:1, ideal_rate_per_hr:12, planned_hrs_per_shift:8, oee_target:80,
    output_routing:[{destination:"ws_p2",label:"→ Peeling",pct:92},{destination:"SCRAP",label:"Reject",pct:8}] },
  { id:"ws_p2", product_id:"p1", name:"Veneer Peeling",   order_seq:2, ideal_rate_per_hr:10, planned_hrs_per_shift:8, oee_target:75,
    output_routing:[{destination:"ws_p3",label:"→ Drying",pct:88},{destination:"SCRAP",label:"Offcut",pct:12}] },
  { id:"ws_p3", product_id:"p1", name:"Veneer Drying",    order_seq:3, ideal_rate_per_hr:9,  planned_hrs_per_shift:8, oee_target:78,
    output_routing:[{destination:"ws_p4",label:"→ Gluing",pct:96},{destination:"SCRAP",label:"Cracked",pct:4}] },
  { id:"ws_p4", product_id:"p1", name:"Gluing & Lay-up",  order_seq:4, ideal_rate_per_hr:8,  planned_hrs_per_shift:8, oee_target:82,
    output_routing:[{destination:"ws_p5",label:"→ Hot Press",pct:98},{destination:"SCRAP",label:"Mis-glue",pct:2}] },
  { id:"ws_p5", product_id:"p1", name:"Hot Press",         order_seq:5, ideal_rate_per_hr:7,  planned_hrs_per_shift:8, oee_target:80,
    output_routing:[{destination:"ws_p6",label:"→ Sanding",pct:97},{destination:"SCRAP",label:"Blister",pct:3}] },
  { id:"ws_p6", product_id:"p1", name:"Sanding & Grading", order_seq:6, ideal_rate_per_hr:11, planned_hrs_per_shift:8, oee_target:83,
    output_routing:[{destination:"FG",label:"→ Finished",pct:93},{destination:"ws_p4",label:"Rework",pct:4},{destination:"SCRAP",label:"Reject",pct:3}] },
  // ── Rice Milling ─────────────────────────────────────────────────────────
  { id:"ws_r1", product_id:"p2", name:"Pre-cleaning",      order_seq:1, ideal_rate_per_hr:5000, planned_hrs_per_shift:10, oee_target:88,
    output_routing:[{destination:"ws_r2",label:"→ Husking",pct:99},{destination:"SCRAP",label:"Stones/Chaff",pct:1}] },
  { id:"ws_r2", product_id:"p2", name:"Husking",            order_seq:2, ideal_rate_per_hr:4800, planned_hrs_per_shift:10, oee_target:82,
    output_routing:[{destination:"ws_r3",label:"→ Whitening",pct:78},{destination:"SCRAP",label:"Husk",pct:22}] },
  { id:"ws_r3", product_id:"p2", name:"Whitening",          order_seq:3, ideal_rate_per_hr:4500, planned_hrs_per_shift:10, oee_target:80,
    output_routing:[{destination:"ws_r4",label:"→ Polishing",pct:94},{destination:"SCRAP",label:"Bran",pct:6}] },
  { id:"ws_r4", product_id:"p2", name:"Polishing",          order_seq:4, ideal_rate_per_hr:4200, planned_hrs_per_shift:10, oee_target:78,
    output_routing:[{destination:"ws_r5",label:"→ Grading",pct:97},{destination:"SCRAP",label:"Bran loss",pct:3}] },
  { id:"ws_r5", product_id:"p2", name:"Grading & Sorting",  order_seq:5, ideal_rate_per_hr:4000, planned_hrs_per_shift:10, oee_target:80,
    output_routing:[{destination:"FG",label:"→ Head Rice",pct:65},{destination:"FG",label:"→ Broken",pct:30},{destination:"SCRAP",label:"Discard",pct:5}] },
  { id:"ws_r6", product_id:"p2", name:"Packing",            order_seq:6, ideal_rate_per_hr:3800, planned_hrs_per_shift:10, oee_target:85,
    output_routing:[{destination:"FG",label:"→ Finished Goods",pct:100}] },
];

// ── Generate 7-day historical runs ──────────────────────────────────────────
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0,10);
}

function makeRun(id, wsId, daysBack, batch, inputBase, noise = 0.05) {
  const ws = WORKSTATIONS.find(w => w.id === wsId);
  const jitter = () => 1 + (Math.random() - 0.5) * noise * 2;
  const input = Math.round(inputBase * jitter());
  const outRatio = 0.88 + Math.random() * 0.1;
  const output = Math.round(input * outRatio);
  const good   = Math.round(output * (0.92 + Math.random() * 0.07));
  const planned = ws.planned_hrs_per_shift * 60;
  const downtime = Math.round(Math.random() * 60);
  const actual   = planned - Math.round(downtime * 0.3);
  return { id, workstation_id:wsId, date:daysAgo(daysBack), shift:1, batch,
           input_qty:input, output_qty:output, good_qty:good,
           planned_time_mins:planned, actual_time_mins:actual, downtime_mins:downtime, notes:"" };
}

const TODAY = daysAgo(0);
export const PRODUCTION_RUNS = [
  // Today — plywood
  { id:"r1",  workstation_id:"ws_p1", date:TODAY, shift:1, batch:"PL-001", input_qty:100, output_qty:92,  good_qty:90,  planned_time_mins:480, actual_time_mins:470, downtime_mins:30, notes:"" },
  { id:"r2",  workstation_id:"ws_p2", date:TODAY, shift:1, batch:"PL-001", input_qty:92,  output_qty:81,  good_qty:79,  planned_time_mins:480, actual_time_mins:480, downtime_mins:60, notes:"Belt slippage" },
  { id:"r3",  workstation_id:"ws_p3", date:TODAY, shift:1, batch:"PL-001", input_qty:81,  output_qty:78,  good_qty:77,  planned_time_mins:480, actual_time_mins:460, downtime_mins:20, notes:"" },
  { id:"r4",  workstation_id:"ws_p4", date:TODAY, shift:1, batch:"PL-001", input_qty:78,  output_qty:76,  good_qty:76,  planned_time_mins:480, actual_time_mins:480, downtime_mins:10, notes:"" },
  { id:"r5",  workstation_id:"ws_p5", date:TODAY, shift:1, batch:"PL-001", input_qty:76,  output_qty:74,  good_qty:72,  planned_time_mins:480, actual_time_mins:475, downtime_mins:45, notes:"Press temp fluctuation" },
  { id:"r6",  workstation_id:"ws_p6", date:TODAY, shift:1, batch:"PL-001", input_qty:74,  output_qty:69,  good_qty:68,  planned_time_mins:480, actual_time_mins:480, downtime_mins:15, notes:"" },
  // Today — rice
  { id:"r7",  workstation_id:"ws_r1", date:TODAY, shift:1, batch:"RM-001", input_qty:50000, output_qty:49500, good_qty:49500, planned_time_mins:600, actual_time_mins:590, downtime_mins:10, notes:"" },
  { id:"r8",  workstation_id:"ws_r2", date:TODAY, shift:1, batch:"RM-001", input_qty:49500, output_qty:38610, good_qty:38610, planned_time_mins:600, actual_time_mins:600, downtime_mins:30, notes:"" },
  { id:"r9",  workstation_id:"ws_r3", date:TODAY, shift:1, batch:"RM-001", input_qty:38610, output_qty:36294, good_qty:36294, planned_time_mins:600, actual_time_mins:595, downtime_mins:20, notes:"" },
  { id:"r10", workstation_id:"ws_r4", date:TODAY, shift:1, batch:"RM-001", input_qty:36294, output_qty:35205, good_qty:35000, planned_time_mins:600, actual_time_mins:600, downtime_mins:40, notes:"Motor overheating" },
  { id:"r11", workstation_id:"ws_r5", date:TODAY, shift:1, batch:"RM-001", input_qty:35205, output_qty:33445, good_qty:33000, planned_time_mins:600, actual_time_mins:580, downtime_mins:25, notes:"" },
  { id:"r12", workstation_id:"ws_r6", date:TODAY, shift:1, batch:"RM-001", input_qty:33445, output_qty:33000, good_qty:33000, planned_time_mins:600, actual_time_mins:600, downtime_mins:0,  notes:"" },
  // Historical — plywood (6 days back)
  ...["ws_p1","ws_p2","ws_p3","ws_p4","ws_p5","ws_p6"].flatMap((wsId, wi) =>
    [1,2,3,4,5,6].map((d, di) => makeRun(`h_p${wi}_${d}`, wsId, d, `PL-00${d+1}`, [100,92,81,78,76,74][wi], 0.06))
  ),
  // Historical — rice (6 days back)
  ...["ws_r1","ws_r2","ws_r3","ws_r4","ws_r5","ws_r6"].flatMap((wsId, wi) =>
    [1,2,3,4,5,6].map((d) => makeRun(`h_r${wi}_${d}`, wsId, d, `RM-00${d+1}`, [50000,49500,38610,36294,35205,33445][wi], 0.04))
  ),
];

// ── Downtime Events ──────────────────────────────────────────────────────────
export const DOWNTIME_REASONS = ["Mechanical","Electrical","Material Shortage","Setup/Changeover","Operator","Planned Maintenance","Quality Issue","Utilities"];

export const DOWNTIME_EVENTS = [
  { id:"dt1",  workstation_id:"ws_p2", date:TODAY,      start_time:"08:15", duration_mins:45, reason:"Mechanical",       notes:"Belt slippage on peeling drum", shift:1 },
  { id:"dt2",  workstation_id:"ws_p5", date:TODAY,      start_time:"10:30", duration_mins:30, reason:"Utilities",         notes:"Steam pressure drop to hot press", shift:1 },
  { id:"dt3",  workstation_id:"ws_r4", date:TODAY,      start_time:"09:00", duration_mins:40, reason:"Electrical",        notes:"Motor overheating, thermal trip", shift:1 },
  { id:"dt4",  workstation_id:"ws_p1", date:daysAgo(1), start_time:"07:45", duration_mins:60, reason:"Planned Maintenance",notes:"Monthly lubrication schedule", shift:1 },
  { id:"dt5",  workstation_id:"ws_p3", date:daysAgo(1), start_time:"13:00", duration_mins:25, reason:"Material Shortage",  notes:"Veneer stack ran out, waiting refeed", shift:2 },
  { id:"dt6",  workstation_id:"ws_r2", date:daysAgo(2), start_time:"06:30", duration_mins:55, reason:"Mechanical",         notes:"Husker rubber roll replacement", shift:1 },
  { id:"dt7",  workstation_id:"ws_p4", date:daysAgo(2), start_time:"11:15", duration_mins:20, reason:"Quality Issue",      notes:"Glue viscosity out of spec, batch hold", shift:1 },
  { id:"dt8",  workstation_id:"ws_r5", date:daysAgo(3), start_time:"08:00", duration_mins:35, reason:"Setup/Changeover",   notes:"Grade screen change for new paddy variety", shift:1 },
  { id:"dt9",  workstation_id:"ws_p6", date:daysAgo(3), start_time:"14:30", duration_mins:15, reason:"Operator",           notes:"Operator shift handover delay", shift:2 },
  { id:"dt10", workstation_id:"ws_p2", date:daysAgo(4), start_time:"09:45", duration_mins:90, reason:"Electrical",         notes:"Lathe motor controller fault — electrician called", shift:1 },
  { id:"dt11", workstation_id:"ws_r1", date:daysAgo(4), start_time:"07:00", duration_mins:20, reason:"Material Shortage",  notes:"Paddy truck delayed 20 min", shift:1 },
  { id:"dt12", workstation_id:"ws_p5", date:daysAgo(5), start_time:"10:00", duration_mins:50, reason:"Planned Maintenance",notes:"Press plate cleaning & calibration", shift:1 },
  { id:"dt13", workstation_id:"ws_r3", date:daysAgo(5), start_time:"12:00", duration_mins:30, reason:"Mechanical",         notes:"Whitening chamber screen clog", shift:2 },
];

// ── Work Orders ───────────────────────────────────────────────────────────────
export const WORK_ORDERS = [
  { id:"wo1", product_id:"p1", wo_no:"WO-2026-031", description:"Plywood 18mm — Grade A Export", target_qty:500, produced_qty:380, unit:"sheets", status:"In Progress", priority:"High",   start_date:daysAgo(3), due_date:daysAgo(-2), batch:"PL-001", progress:76 },
  { id:"wo2", product_id:"p1", wo_no:"WO-2026-032", description:"Plywood 12mm — Local Market",   target_qty:300, produced_qty:0,   unit:"sheets", status:"Planned",     priority:"Medium", start_date:daysAgo(-1),due_date:daysAgo(-5), batch:"PL-002", progress:0  },
  { id:"wo3", product_id:"p2", wo_no:"WO-2026-033", description:"White Rice 5% — 50kg Bags",     target_qty:30000,produced_qty:28500,unit:"kg",   status:"In Progress", priority:"High",   start_date:daysAgo(1), due_date:TODAY,       batch:"RM-001", progress:95 },
  { id:"wo4", product_id:"p2", wo_no:"WO-2026-034", description:"Premium Rice — Restaurant Grade",target_qty:10000,produced_qty:0,   unit:"kg",   status:"Planned",     priority:"Low",    start_date:daysAgo(-3),due_date:daysAgo(-7), batch:"RM-002", progress:0  },
  { id:"wo5", product_id:"p1", wo_no:"WO-2026-030", description:"Plywood 18mm — Construction",   target_qty:200, produced_qty:200, unit:"sheets", status:"Completed",   priority:"Medium", start_date:daysAgo(7), due_date:daysAgo(2),  batch:"PL-000", progress:100},
  { id:"wo6", product_id:"p2", wo_no:"WO-2026-029", description:"White Rice 5% — Govt Tender",   target_qty:50000,produced_qty:50000,unit:"kg",  status:"Completed",   priority:"High",   start_date:daysAgo(8), due_date:daysAgo(4),  batch:"RM-000", progress:100},
];

// ── Machine Status ────────────────────────────────────────────────────────────
export const MACHINE_STATUS = [
  { workstation_id:"ws_p1", status:"Running",     since:"07:00", operator:"Budi S.",    shift:1, note:"" },
  { workstation_id:"ws_p2", status:"Running",     since:"07:30", operator:"Andi R.",    shift:1, note:"Post-repair running normally" },
  { workstation_id:"ws_p3", status:"Running",     since:"07:00", operator:"Sari D.",    shift:1, note:"" },
  { workstation_id:"ws_p4", status:"Idle",        since:"11:45", operator:"Doni P.",    shift:1, note:"Waiting for veneer from drying" },
  { workstation_id:"ws_p5", status:"Maintenance", since:"10:30", operator:"Teknisi",    shift:1, note:"Scheduled press plate inspection" },
  { workstation_id:"ws_p6", status:"Running",     since:"07:00", operator:"Rini L.",    shift:1, note:"" },
  { workstation_id:"ws_r1", status:"Running",     since:"06:00", operator:"Agus M.",    shift:1, note:"" },
  { workstation_id:"ws_r2", status:"Running",     since:"06:00", operator:"Heri S.",    shift:1, note:"" },
  { workstation_id:"ws_r3", status:"Running",     since:"06:00", operator:"Wahyu K.",   shift:1, note:"" },
  { workstation_id:"ws_r4", status:"Down",        since:"09:00", operator:"Teknisi",    shift:1, note:"Motor overheating — awaiting spare part" },
  { workstation_id:"ws_r5", status:"Running",     since:"06:30", operator:"Dewi A.",    shift:1, note:"" },
  { workstation_id:"ws_r6", status:"Running",     since:"07:00", operator:"Bayu T.",    shift:1, note:"" },
];

// ── OEE Calculator ────────────────────────────────────────────────────────────
export function calcOEE(run, ws) {
  const availability = run.planned_time_mins > 0
    ? Math.max(0, (run.planned_time_mins - run.downtime_mins) / run.planned_time_mins) : 0;
  const actualHrs = run.actual_time_mins / 60;
  const performance = actualHrs > 0 && ws.ideal_rate_per_hr > 0
    ? Math.min(1, run.output_qty / (actualHrs * ws.ideal_rate_per_hr)) : 0;
  const quality = run.output_qty > 0
    ? Math.min(1, run.good_qty / run.output_qty) : 0;
  return {
    availability: availability * 100,
    performance:  performance  * 100,
    quality:      quality      * 100,
    oee:          availability * performance * quality * 100,
    yield:        run.input_qty > 0 ? (run.good_qty / run.input_qty) * 100 : 0,
  };
}

// ── Export CSV helper ─────────────────────────────────────────────────────────
export function exportCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
