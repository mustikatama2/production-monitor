-- Production Monitor — Supabase Schema
-- Run in Supabase SQL Editor

create table if not exists public.products (
  id text primary key,
  name text not null,
  industry text,
  unit text,
  created_at timestamptz default now()
);

create table if not exists public.workstations (
  id text primary key,
  product_id text references public.products(id),
  name text not null,
  order_seq int,
  ideal_rate_per_hr numeric,
  planned_hrs_per_shift numeric default 8,
  output_routing jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.production_runs (
  id text primary key default gen_random_uuid()::text,
  workstation_id text references public.workstations(id),
  date date not null default current_date,
  shift int default 1,
  batch text,
  input_qty numeric default 0,
  output_qty numeric default 0,
  good_qty numeric default 0,
  planned_time_mins numeric default 480,
  actual_time_mins numeric default 480,
  downtime_mins numeric default 0,
  notes text,
  created_at timestamptz default now()
);

-- Public read/write (adjust with auth for production use)
alter table public.products enable row level security;
alter table public.workstations enable row level security;
alter table public.production_runs enable row level security;
create policy "public_all" on public.products for all using (true);
create policy "public_all" on public.workstations for all using (true);
create policy "public_all" on public.production_runs for all using (true);

-- Seed: Products
insert into public.products (id,name,industry,unit) values
  ('p1','Plywood 18mm','Plywood','sheets'),
  ('p2','White Rice 5%','Rice Milling','kg')
on conflict(id) do nothing;

-- Seed: Workstations — Plywood
insert into public.workstations (id,product_id,name,order_seq,ideal_rate_per_hr,planned_hrs_per_shift,output_routing) values
('ws_p1','p1','Log Debarking',1,12,8,'[{"destination":"ws_p2","label":"→ Peeling","pct":92},{"destination":"SCRAP","label":"Reject","pct":8}]'),
('ws_p2','p1','Veneer Peeling',2,10,8,'[{"destination":"ws_p3","label":"→ Drying","pct":88},{"destination":"SCRAP","label":"Offcut","pct":12}]'),
('ws_p3','p1','Veneer Drying',3,9,8,'[{"destination":"ws_p4","label":"→ Gluing","pct":96},{"destination":"SCRAP","label":"Cracked","pct":4}]'),
('ws_p4','p1','Gluing & Lay-up',4,8,8,'[{"destination":"ws_p5","label":"→ Hot Press","pct":98},{"destination":"SCRAP","label":"Mis-glue","pct":2}]'),
('ws_p5','p1','Hot Press',5,7,8,'[{"destination":"ws_p6","label":"→ Sanding","pct":97},{"destination":"SCRAP","label":"Blister","pct":3}]'),
('ws_p6','p1','Sanding & Grading',6,11,8,'[{"destination":"FG","label":"→ Finished","pct":93},{"destination":"ws_p4","label":"Rework","pct":4},{"destination":"SCRAP","label":"Reject","pct":3}]')
on conflict(id) do nothing;

-- Seed: Workstations — Rice Milling
insert into public.workstations (id,product_id,name,order_seq,ideal_rate_per_hr,planned_hrs_per_shift,output_routing) values
('ws_r1','p2','Pre-cleaning',1,5000,10,'[{"destination":"ws_r2","label":"→ Husking","pct":99},{"destination":"SCRAP","label":"Stones/Chaff","pct":1}]'),
('ws_r2','p2','Husking',2,4800,10,'[{"destination":"ws_r3","label":"→ Whitening","pct":78},{"destination":"SCRAP","label":"Husk","pct":22}]'),
('ws_r3','p2','Whitening',3,4500,10,'[{"destination":"ws_r4","label":"→ Polishing","pct":94},{"destination":"SCRAP","label":"Bran","pct":6}]'),
('ws_r4','p2','Polishing',4,4200,10,'[{"destination":"ws_r5","label":"→ Grading","pct":97},{"destination":"SCRAP","label":"Bran loss","pct":3}]'),
('ws_r5','p2','Grading & Sorting',5,4000,10,'[{"destination":"FG","label":"→ Head Rice","pct":65},{"destination":"FG","label":"→ Broken Rice","pct":30},{"destination":"SCRAP","label":"Discard","pct":5}]'),
('ws_r6','p2','Packing',6,3800,10,'[{"destination":"FG","label":"→ Finished Goods","pct":100}]')
on conflict(id) do nothing;
