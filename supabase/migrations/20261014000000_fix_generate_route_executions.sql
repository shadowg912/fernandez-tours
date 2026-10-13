-- Fix ambigüedad en función generate_route_executions
-- Renombrar alias 'dow' a 'dow_val' en el subquery para evitar conflicto con variable declarada

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
      INSERT INTO route_executions (route_id, execution_date, status, amount_collected)
      VALUES (p_route_id, d, 'pending', 0)
      ON CONFLICT (route_id, execution_date) DO NOTHING;
    END IF;
    d := d + INTERVAL '1 day';
  END LOOP;
END;
$$;