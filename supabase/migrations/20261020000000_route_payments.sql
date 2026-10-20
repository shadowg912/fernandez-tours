-- Pago de rutas diarias: separa "días de servicio" de "días pagados".
--
-- - Los días de servicio se siguen registrando en route_executions (status
--   'done' = se hizo la ruta, 'skipped' = no se hizo).
-- - Los pagos se registran aparte en route_payments indicando CUÁNTOS días se
--   pagaron. El precio por día se toma de daily_routes.daily_fee al momento de
--   pagar (se guarda como snapshot en fee_per_day).
--
-- Los días pendientes de pago de una ruta = días hechos (hasta hoy) - días
-- pagados, aplicando los pagos a las fechas más antiguas primero.

-- 0. Asegurar el rol 'authenticated' (Postgres plano no lo tiene).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;

-- 1. Tabla route_payments ------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES daily_routes(id) ON DELETE CASCADE,
  days_paid integer NOT NULL CHECK (days_paid > 0),
  fee_per_day integer NOT NULL CHECK (fee_per_day >= 0),
  amount integer NOT NULL CHECK (amount >= 0),
  payment_date date NOT NULL DEFAULT current_date,
  method payment_method NOT NULL DEFAULT 'efectivo',
  observation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS route_payments_route_id_idx ON route_payments (route_id);
CREATE INDEX IF NOT EXISTS route_payments_date_idx ON route_payments (payment_date);

-- 2. RLS -----------------------------------------------------------------------
DROP POLICY IF EXISTS "route_payments_select_all" ON route_payments;
DROP POLICY IF EXISTS "route_payments_insert" ON route_payments;
DROP POLICY IF EXISTS "route_payments_update" ON route_payments;
DROP POLICY IF EXISTS "route_payments_delete" ON route_payments;

CREATE POLICY "route_payments_select_all" ON route_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "route_payments_insert" ON route_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "route_payments_update" ON route_payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "route_payments_delete" ON route_payments FOR DELETE TO authenticated USING (true);

-- 3. Dejar de guardar dinero en las ejecuciones --------------------------------
--    El cobro vive ahora en route_payments.

CREATE OR REPLACE FUNCTION generate_route_executions(p_route_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  r RECORD;
  d DATE;
  dow INT;
  target_days INT[];
  window_days INT;
  end_date DATE;
BEGIN
  SELECT * INTO r FROM daily_routes WHERE id = p_route_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ruta no encontrada: %', p_route_id;
  END IF;

  -- Mapear days_of_week a números (0=Dom, 1=Lun, ..., 6=Sáb)
  target_days := ARRAY(
    SELECT (CASE dow_val
      WHEN 'Sun' THEN 0 WHEN 'Mon' THEN 1 WHEN 'Tue' THEN 2
      WHEN 'Wed' THEN 3 WHEN 'Thu' THEN 4 WHEN 'Fri' THEN 5 WHEN 'Sat' THEN 6
    END)::INT
    FROM unnest(r.days_of_week) AS dow_val
  );

  window_days := r.generation_window_days;
  end_date := CURRENT_DATE + window_days;

  d := CURRENT_DATE;
  WHILE d <= end_date LOOP
    dow := EXTRACT(DOW FROM d)::INT; -- 0=Dom, 1=Lun, ..., 6=Sáb
    IF dow = ANY(target_days) THEN
      INSERT INTO route_executions (route_id, execution_date, status)
      VALUES (p_route_id, d, 'pending')
      ON CONFLICT (route_id, execution_date) DO NOTHING;
    END IF;
    d := d + INTERVAL '1 day';
  END LOOP;
END;
$$;

ALTER TABLE route_executions DROP COLUMN IF EXISTS amount_collected;
