-- Rutas de ingreso diario (distintas a routes de estudiantes)
-- Cobro por día operativo, con días de semana y rango de fechas

-- ---------- Tabla daily_routes ----------
create table daily_routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  daily_fee integer not null check (daily_fee >= 0),
  days_of_week text[] not null default '{}',  -- ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create index daily_routes_date_range_idx on daily_routes (start_date, end_date);

-- ---------- Ejecuciones diarias ----------
create table route_executions (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references daily_routes(id) on delete cascade,
  execution_date date not null,
  status text not null check (status in ('pending','done','skipped')) default 'pending',
  amount_collected integer not null default 0,
  created_at timestamptz not null default now(),
  unique(route_id, execution_date)
);

create index route_executions_route_date_idx on route_executions (route_id, execution_date);
create index route_executions_status_idx on route_executions (status);

-- ---------- Función helper: generar ejecuciones para una ruta ----------
create or replace function generate_route_executions(p_route_id uuid)
returns void language plpgsql as $$
declare
  r record;
  d date;
  dow_text text;
  day_num int;
begin
  select * into r from daily_routes where id = p_route_id;
  if not found then
    raise exception 'Ruta no encontrada: %', p_route_id;
  end if;

  d := r.start_date;
  while d <= r.end_date loop
    day_num := extract(dow from d)::int; -- 0=Sun, 1=Mon, ..., 6=Sat
    dow_text := case day_num
      when 0 then 'Sun'
      when 1 then 'Mon'
      when 2 then 'Tue'
      when 3 then 'Wed'
      when 4 then 'Thu'
      when 5 then 'Fri'
      when 6 then 'Sat'
    end;

    if dow_text = any(r.days_of_week) then
      insert into route_executions (route_id, execution_date, status, amount_collected)
      values (p_route_id, d, 'pending', 0)
      on conflict (route_id, execution_date) do nothing;
    end if;

    d := d + interval '1 day';
  end loop;
end;
$$;

-- ---------- Función helper: copiar ruta al mes siguiente ----------
create or replace function copy_route_to_next_month(p_route_id uuid)
returns uuid language plpgsql as $$
declare
  r record;
  new_id uuid;
  new_start date;
  new_end date;
  last_day_of_next_month date;
begin
  select * into r from daily_routes where id = p_route_id;
  if not found then
    raise exception 'Ruta no encontrada: %', p_route_id;
  end if;

  -- Calcular primer día del mes siguiente al end_date
  new_start := date_trunc('month', r.end_date + interval '1 month')::date;
  -- Último día de ese mes
  last_day_of_next_month := (new_start + interval '1 month - 1 day')::date;
  new_end := last_day_of_next_month;

  insert into daily_routes (name, daily_fee, days_of_week, start_date, end_date)
  values (r.name || ' (copia)', r.daily_fee, r.days_of_week, new_start, new_end)
  returning id into new_id;

  -- Generar ejecuciones para el nuevo rango
  perform generate_route_executions(new_id);

  return new_id;
end;
$$;