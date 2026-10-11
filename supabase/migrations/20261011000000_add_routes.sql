-- Añadir tabla routes y route_id en students
-- Hacer school opcional en students

-- ---------- Tabla routes ----------
create table routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text not null default '#16a34a',
  created_at timestamptz not null default now()
);

-- ---------- Columna route_id en students ----------
alter table students add column route_id uuid references routes(id) on delete set null;
create index students_route_id_idx on students (route_id);

-- ---------- Hacer school opcional ----------
alter table students alter column school drop not null;

-- ---------- Seed: ruta por defecto ----------
insert into routes (name, description, color)
values ('IPISA-IPIDBOSCO', 'Ruta principal IPISA-IPIDBOSCO', '#16a34a')
on conflict do nothing;

-- Asignar ruta a estudiantes existentes
update students set route_id = (select id from routes where name = 'IPISA-IPIDBOSCO')
where route_id is null;