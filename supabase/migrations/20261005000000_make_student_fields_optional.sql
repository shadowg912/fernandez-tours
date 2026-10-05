-- Hacer opcionales guardian, phone y address en students
-- Permite crear estudiantes sin representante, teléfono o dirección de recogida

ALTER TABLE students ALTER COLUMN guardian DROP NOT NULL;
ALTER TABLE students ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE students ALTER COLUMN address DROP NOT NULL;