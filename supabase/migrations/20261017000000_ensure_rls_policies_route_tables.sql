-- Reconciliar políticas RLS en las tablas de rutas.
-- Idempotente: seguro en entornos que ya tienen las políticas (producción Supabase)
-- y en entornos que no (develop, Postgres plano).
--
-- Contexto: la migración 20261015000000 quedó registrada en producción CON políticas
-- y en develop SIN políticas (el rol 'authenticated' no existe en Postgres plano).
-- Esta migración garantiza el mismo estado final en todos los entornos.

-- 1. Asegurar que exista el rol 'authenticated'
--    Supabase ya lo crea; Postgres plano no lo tiene.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;

-- 2. routes
DROP POLICY IF EXISTS "routes_select_all" ON routes;
DROP POLICY IF EXISTS "routes_insert" ON routes;
DROP POLICY IF EXISTS "routes_update" ON routes;
DROP POLICY IF EXISTS "routes_delete" ON routes;

CREATE POLICY "routes_select_all" ON routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "routes_insert" ON routes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "routes_update" ON routes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "routes_delete" ON routes FOR DELETE TO authenticated USING (true);

-- 3. route_executions
DROP POLICY IF EXISTS "route_executions_select_all" ON route_executions;
DROP POLICY IF EXISTS "route_executions_insert" ON route_executions;
DROP POLICY IF EXISTS "route_executions_update" ON route_executions;
DROP POLICY IF EXISTS "route_executions_delete" ON route_executions;

CREATE POLICY "route_executions_select_all" ON route_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "route_executions_insert" ON route_executions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "route_executions_update" ON route_executions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "route_executions_delete" ON route_executions FOR DELETE TO authenticated USING (true);

-- 4. daily_routes
DROP POLICY IF EXISTS "daily_routes_select_all" ON daily_routes;
DROP POLICY IF EXISTS "daily_routes_insert" ON daily_routes;
DROP POLICY IF EXISTS "daily_routes_update" ON daily_routes;
DROP POLICY IF EXISTS "daily_routes_delete" ON daily_routes;

CREATE POLICY "daily_routes_select_all" ON daily_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "daily_routes_insert" ON daily_routes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "daily_routes_update" ON daily_routes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "daily_routes_delete" ON daily_routes FOR DELETE TO authenticated USING (true);
