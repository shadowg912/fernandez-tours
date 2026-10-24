-- Autenticación simple de Fernández Tours.
-- Un solo usuario operativo (alison) con login por contraseña.
-- Las sesiones son opacas: en la BD solo se guarda el hash SHA-256 del token.

-- ---------- users ----------
create table users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  name text not null,
  password_hash text not null,
  is_active boolean not null default true,
  failed_login_attempts integer not null default 0 check (failed_login_attempts >= 0),
  locked_until timestamptz,
  password_changed_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- sessions ----------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index sessions_user_id_idx on sessions (user_id);
create index sessions_expires_at_idx on sessions (expires_at);

-- RLS: bloquear el acceso por la API REST de Supabase (roles anon/authenticated).
-- La app accede con la conexión directa pg (rol con bypass de RLS).
alter table users enable row level security;
alter table sessions enable row level security;

-- Usuario inicial.
-- Contraseña inicial: alison123 (se debe cambiar desde /mas/seguridad).
-- El valor es un hash scrypt con sal aleatoria; no contiene la contraseña en claro.
insert into users (username, name, password_hash)
values (
  'alison',
  'Alison Fernández',
  'scrypt$1abcc36b659b8103be27a024dec1623b$e39c66538474f8caa4ce3ac6c56b82f8f8508dda2e06b2da4937380568fadfc48d35214a26752b8e3a9eacf544327b41c590741e238b2fa5bf8c431bc81b7c6e'
);
