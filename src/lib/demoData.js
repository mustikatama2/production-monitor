// ─── Demo data — Plywood & Rice Milling ────────────────────────────────────
// Used as fallback when Supabase is not connected

export const PRODUCTS = [
  { id: "p1", name: "Plywood 18mm", industry: "Plywood", unit: "sheets" },
  { id: "p2", name: "White Rice 5%", industry: "Rice Milling", unit: "kg" },
];

export const WORKSTATIONS = [
  // ── Plywood line ─────────────────────────────────────────────────────────
  {
    id: "ws_p1", product_id: "p1", name: "Log Debarking", order_seq: 1,
    ideal_rate_per_hr: 12, planned_hrs_per_shift: 8,
    output_routing: [
      { destination: "ws_p2", label: "→ Peeling", pct: 92 },
      { destination: "SCRAP",  label: "Reject",    pct: 8  },
    ],
  },
  {
    id: "ws_p2", product_id: "p1", name: "Veneer Peeling", order_seq: 2,
    ideal_rate_per_hr: 10, planned_hrs_per_shift: 8,
    output_routing: [
      { destination: "ws_p3", label: "→ Drying",  pct: 88 },
      { destination: "SCRAP",  label: "Offcut",    pct: 12 },
    ],
  },
  {
    id: "ws_p3", product_id: "p1", name: "Veneer Drying", order_seq: 3,
    ideal_rate_per_hr: 9, planned_hrs_per_shift: 8,
    output_routing: [
      { destination: "ws_p4", label: "→ Gluing",  pct: 96 },
      { destination: "SCRAP",  label: "Cracked",   pct: 4  },
    ],
  },
  {
    id: "ws_p4", product_id: "p1", name: "Gluing & Lay-up", order_seq: 4,
    ideal_rate_per_hr: 8, planned_hrs_per_shift: 8,
    output_routing: [
      { destination: "ws_p5", label: "→ Hot Press", pct: 98 },
      { destination: "SCRAP",  label: "Mis-glue",   pct: 2  },
    ],
  },
  {
    id: "ws_p5", product_id: "p1", name: "Hot Press", order_seq: 5,
    ideal_rate_per_hr: 7, planned_hrs_per_shift: 8,
    output_routing: [
      { destination: "ws_p6", label: "→ Sanding",  pct: 97 },
      { destination: "SCRAP",  label: "Blister",   pct: 3  },
    ],
  },
  {
    id: "ws_p6", product_id: "p1", name: "Sanding & Grading", order_seq: 6,
    ideal_rate_per_hr: 11, planned_hrs_per_shift: 8,
    output_routing: [
      { destination: "FG",    label: "→ Finished",  pct: 93 },
      { destination: "ws_p4", label: "Rework",       pct: 4  },
      { destination: "SCRAP", label: "Reject",       pct: 3  },
    ],
  },

  // ── Rice Milling line ────────────────────────────────────────────────────
  {
    id: "ws_r1", product_id: "p2", name: "Pre-cleaning", order_seq: 1,
    ideal_rate_per_hr: 5000, planned_hrs_per_shift: 10,
    output_routing: [
      { destination: "ws_r2", label: "→ Husking", pct: 99 },
      { destination: "SCRAP",  label: "Stones/Chaff", pct: 1 },
    ],
  },
  {
    id: "ws_r2", product_id: "p2", name: "Husking", order_seq: 2,
    ideal_rate_per_hr: 4800, planned_hrs_per_shift: 10,
    output_routing: [
      { destination: "ws_r3", label: "→ Whitening", pct: 78 },
      { destination: "SCRAP",  label: "Husk",        pct: 22 },
    ],
  },
  {
    id: "ws_r3", product_id: "p2", name: "Whitening", order_seq: 3,
    ideal_rate_per_hr: 4500, planned_hrs_per_shift: 10,
    output_routing: [
      { destination: "ws_r4", label: "→ Polishing", pct: 94 },
      { destination: "SCRAP",  label: "Bran",        pct: 6  },
    ],
  },
  {
    id: "ws_r4", product_id: "p2", name: "Polishing", order_seq: 4,
    ideal_rate_per_hr: 4200, planned_hrs_per_shift: 10,
    output_routing: [
      { destination: "ws_r5", label: "→ Grading", pct: 97 },
      { destination: "SCRAP",  label: "Bran loss", pct: 3  },
    ],
  },
  {
    id: "ws_r5", product_id: "p2", name: "Grading & Sorting", order_seq: 5,
    ideal_rate_per_hr: 4000, planned_hrs_per_shift: 10,
    output_routing: [
      { destination: "FG",    label: "→ Head Rice",   pct: 65 },
      { destination: "FG",    label: "→ Broken Rice",  pct: 30 },
      { destination: "SCRAP", label: "Discard",        pct: 5  },
    ],
  },
  {
    id: "ws_r6", product_id: "p2", name: "Packing", order_seq: 6,
    ideal_rate_per_hr: 3800, planned_hrs_per_shift: 10,
    output_routing: [
      { destination: "FG",   label: "→ Finished Goods", pct: 100 },
    ],
  },
];

// Today's sample production runs
const TODAY = new Date().toISOString().slice(0, 10);

export const PRODUCTION_RUNS = [
  // Plywood
  { id:"r1",  workstation_id:"ws_p1", date:TODAY, shift:1, batch:"PL-001", input_qty:100, output_qty:92, good_qty:90, planned_time_mins:480, actual_time_mins:470, downtime_mins:30 },
  { id:"r2",  workstation_id:"ws_p2", date:TODAY, shift:1, batch:"PL-001", input_qty:92,  output_qty:81, good_qty:79, planned_time_mins:480, actual_time_mins:480, downtime_mins:60 },
  { id:"r3",  workstation_id:"ws_p3", date:TODAY, shift:1, batch:"PL-001", input_qty:81,  output_qty:78, good_qty:77, planned_time_mins:480, actual_time_mins:460, downtime_mins:20 },
  { id:"r4",  workstation_id:"ws_p4", date:TODAY, shift:1, batch:"PL-001", input_qty:78,  output_qty:76, good_qty:76, planned_time_mins:480, actual_time_mins:480, downtime_mins:10 },
  { id:"r5",  workstation_id:"ws_p5", date:TODAY, shift:1, batch:"PL-001", input_qty:76,  output_qty:74, good_qty:72, planned_time_mins:480, actual_time_mins:475, downtime_mins:45 },
  { id:"r6",  workstation_id:"ws_p6", date:TODAY, shift:1, batch:"PL-001", input_qty:74,  output_qty:69, good_qty:68, planned_time_mins:480, actual_time_mins:480, downtime_mins:15 },
  // Rice Milling
  { id:"r7",  workstation_id:"ws_r1", date:TODAY, shift:1, batch:"RM-001", input_qty:50000, output_qty:49500, good_qty:49500, planned_time_mins:600, actual_time_mins:590, downtime_mins:10 },
  { id:"r8",  workstation_id:"ws_r2", date:TODAY, shift:1, batch:"RM-001", input_qty:49500, output_qty:38610, good_qty:38610, planned_time_mins:600, actual_time_mins:600, downtime_mins:30 },
  { id:"r9",  workstation_id:"ws_r3", date:TODAY, shift:1, batch:"RM-001", input_qty:38610, output_qty:36294, good_qty:36294, planned_time_mins:600, actual_time_mins:595, downtime_mins:20 },
  { id:"r10", workstation_id:"ws_r4", date:TODAY, shift:1, batch:"RM-001", input_qty:36294, output_qty:35205, good_qty:35000, planned_time_mins:600, actual_time_mins:600, downtime_mins:40 },
  { id:"r11", workstation_id:"ws_r5", date:TODAY, shift:1, batch:"RM-001", input_qty:35205, output_qty:33445, good_qty:33000, planned_time_mins:600, actual_time_mins:580, downtime_mins:25 },
  { id:"r12", workstation_id:"ws_r6", date:TODAY, shift:1, batch:"RM-001", input_qty:33445, output_qty:33000, good_qty:33000, planned_time_mins:600, actual_time_mins:600, downtime_mins:0  },
];

// ── OEE Calculator ────────────────────────────────────────────────────────────
export function calcOEE(run, ws) {
  const availability = run.planned_time_mins > 0
    ? Math.max(0, (run.planned_time_mins - run.downtime_mins) / run.planned_time_mins)
    : 0;
  const actualHrs = run.actual_time_mins / 60;
  const performance = actualHrs > 0 && ws.ideal_rate_per_hr > 0
    ? Math.min(1, run.output_qty / (actualHrs * ws.ideal_rate_per_hr))
    : 0;
  const quality = run.output_qty > 0
    ? Math.min(1, run.good_qty / run.output_qty)
    : 0;
  const oee = availability * performance * quality;
  return {
    availability: availability * 100,
    performance: performance * 100,
    quality: quality * 100,
    oee: oee * 100,
    yield: run.input_qty > 0 ? (run.good_qty / run.input_qty) * 100 : 0,
  };
}
