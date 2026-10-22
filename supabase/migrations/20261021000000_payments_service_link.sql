-- Vincular pagos a servicios.
--
-- Un servicio puede tener varios pagos: por ejemplo un adelanto y el pago
-- final al completarlo. El nombre del cliente y el concepto se mantienen como
-- snapshot en payments, y service_id permite agrupar todos los pagos del
-- mismo servicio (y generar un recibo único más adelante).
--
-- ON DELETE SET NULL: si se borra el servicio, los pagos se conservan.

alter table payments add column if not exists service_id uuid references services(id) on delete set null;

create index if not exists payments_service_id_idx on payments (service_id);
