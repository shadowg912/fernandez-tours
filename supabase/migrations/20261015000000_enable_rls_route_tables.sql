-- Habilitar RLS en tablas de rutas

-- 1. routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes FORCE ROW LEVEL SECURITY;

CREATE POLICY "routes_select_all" ON routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "routes_insert" ON routes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "routes_update" ON routes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "routes_delete" ON routes FOR DELETE TO authenticated USING (true);

-- 2. route_executions
ALTER TABLE route_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_executions FORCE ROW LEVEL SECURITY;

CREATE POLICY "route_executions_select_all" ON route_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "route_executions_insert" ON route_executions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "route_executions_update" ON route_executions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "route_executions_delete" ON route_executions FOR DELETE TO authenticated USING (true);

-- 3. daily_routes
ALTER TABLE daily_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routes FORCE ROW LEVEL SECURITY;

CREATE POLICY "daily_routes_select_all" ON daily_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "daily_routes_insert" ON daily_routes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "daily_routes_update" ON daily_routes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "daily_routes_delete" ON daily_routes FOR DELETE TO authenticated USING (true);