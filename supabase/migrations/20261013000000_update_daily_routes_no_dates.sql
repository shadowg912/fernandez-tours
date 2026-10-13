-- Eliminar start_date y end_date, agregar generation_window_days (60 días por defecto)

-- Eliminar columnas de fecha
ALTER TABLE daily_routes DROP COLUMN IF EXISTS start_date;
ALTER TABLE daily_routes DROP COLUMN IF EXISTS end_date;

-- Agregar ventana de generación (60 días por defecto)
ALTER TABLE daily_routes ADD COLUMN generation_window_days INT NOT NULL DEFAULT 60;

-- Actualizar función generate_route_executions para usar days_of_week + generation_window_days
CREATE OR REPLACE FUNCTION generate_route_executions(p_route_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  r RECORD;
  d DATE;
  dow INT;
  target_days INT[];
  day_map TEXT[] := ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
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
      INSERT INTO route_executions (route_id, execution_date, status, amount_collected)
      VALUES (p_route_id, d, 'pending', 0)
      ON CONFLICT (route_id, execution_date) DO NOTHING;
    END IF;
    d := d + INTERVAL '1 day';
  END LOOP;
END;
$$;

-- Actualizar función copy_route_to_next_month
CREATE OR REPLACE FUNCTION copy_route_to_next_month(p_route_id uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  r RECORD;
  new_id UUID;
BEGIN
  SELECT * INTO r FROM daily_routes WHERE id = p_route_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ruta no encontrada: %', p_route_id;
  END IF;

  INSERT INTO daily_routes (name, daily_fee, days_of_week, generation_window_days)
  VALUES (r.name || ' (copia)', r.daily_fee, r.days_of_week, r.generation_window_days)
  RETURNING id INTO new_id;

  PERFORM generate_route_executions(new_id);

  RETURN new_id;
END;
$$;