-- Actualizar enum service_status: 'pendiente' → 'pendiente_confirmacion'

-- Paso 1: Renombrar enum viejo
ALTER TYPE service_status RENAME TO service_status_old;

-- Paso 2: Crear nuevo enum
CREATE TYPE service_status AS ENUM ('pendiente_confirmacion', 'confirmado', 'completado', 'cancelado');

-- Paso 3: Eliminar default temporalmente
ALTER TABLE services ALTER COLUMN status DROP DEFAULT;

-- Paso 4: Cambiar columna a text temporalmente
ALTER TABLE services ALTER COLUMN status TYPE text;

-- Paso 5: Actualizar valores
UPDATE services SET status = 'pendiente_confirmacion' WHERE status = 'pendiente';

-- Paso 6: Cambiar columna a nuevo enum
ALTER TABLE services ALTER COLUMN status TYPE service_status USING status::service_status;

-- Paso 7: Set default
ALTER TABLE services ALTER COLUMN status SET DEFAULT 'pendiente_confirmacion';

-- Paso 8: Eliminar enum viejo
DROP TYPE service_status_old;