-- Separar horario en entry_time y exit_time

-- Agregar columnas nuevas
ALTER TABLE students ADD COLUMN entry_time time;
ALTER TABLE students ADD COLUMN exit_time time;

-- Migrar datos existentes: "6:45 AM - 2:30 PM" → entry_time='06:45', exit_time='14:30'
UPDATE students SET 
  entry_time = split_part(schedule, ' - ', 1)::time,
  exit_time = split_part(schedule, ' - ', 2)::time
WHERE schedule LIKE '% - %';

-- Para registros que no tengan el formato esperado, poner defaults
UPDATE students SET 
  entry_time = '07:00',
  exit_time = '14:00'
WHERE entry_time IS NULL OR exit_time IS NULL;

-- Hacerlas NOT NULL con defaults
ALTER TABLE students ALTER COLUMN entry_time SET NOT NULL;
ALTER TABLE students ALTER COLUMN entry_time SET DEFAULT '07:00';
ALTER TABLE students ALTER COLUMN exit_time SET NOT NULL;
ALTER TABLE students ALTER COLUMN exit_time SET DEFAULT '14:00';

-- Eliminar columna vieja
ALTER TABLE students DROP COLUMN schedule;