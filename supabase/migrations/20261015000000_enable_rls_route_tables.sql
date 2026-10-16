-- Habilitar RLS en tablas de rutas (sin políticas de authenticated - se agregarán cuando se configure auth)

-- 1. routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes FORCE ROW LEVEL SECURITY;

-- 2. route_executions
ALTER TABLE route_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_executions FORCE ROW LEVEL SECURITY;

-- 3. daily_routes
ALTER TABLE daily_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routes FORCE ROW LEVEL SECURITY;