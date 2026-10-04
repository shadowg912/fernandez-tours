-- Fernández Tours v1 — esquema inicial alineado a los mocks de lib/data.ts
-- y los formularios existentes (servicios, clientes, estudiantes, pagos).

-- ---------- Enums ----------
create type service_status as enum ('confirmado', 'pendiente', 'completado', 'cancelado');
create type pay_frequency as enum ('mensual', 'quincenal', 'semanal');
create type payment_method as enum ('efectivo', 'transferencia', 'tarjeta');
create type payment_status as enum ('completado', 'pendiente');

-- ---------- clients ----------
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  address text,
  service_type text not null default 'Transporte regular',
  last_service text,
  balance integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default now()
);

-- ---------- services ----------
create table services (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  date date not null,
  time text not null,
  origin text not null,
  destination text not null,
  passengers integer not null default 1 check (passengers > 0),
  price integer not null check (price >= 0),
  status service_status not null default 'pendiente',
  observations text,
  created_at timestamptz not null default now()
);
create index services_date_idx on services (date);
create index services_status_idx on services (status);

-- ---------- students ----------
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school text not null,
  address text not null,
  schedule text not null,
  days text[] not null default '{}',
  monthly_fee integer not null check (monthly_fee >= 0),
  frequency pay_frequency not null default 'mensual',
  paid boolean not null default false,
  guardian text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- ---------- payments ----------
create table payments (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  date date not null default current_date,
  concept text not null,
  amount integer not null check (amount >= 0),
  method payment_method not null default 'efectivo',
  status payment_status not null default 'completado',
  period text,
  observation text,
  created_at timestamptz not null default now()
);
create index payments_date_idx on payments (date);
create index payments_status_idx on payments (status);
