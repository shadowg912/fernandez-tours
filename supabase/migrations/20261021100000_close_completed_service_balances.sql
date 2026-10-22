-- Cerrar el saldo de los servicios que ya estaban marcados como completados.
--
-- Los servicios completados antes de que existiera la vinculación de pagos
-- (payments.service_id) no tienen pagos asociados. Como el saldo se calcula
-- con la suma de pagos completados, esos servicios aparecen con pendiente
-- igual a su precio.
--
-- Esta migración:
--   1. Marca como completados los pagos pendientes vinculados a un servicio
--      que ya está completado (mismo criterio que usa la app al completar un
--      servicio confirmando que el pago se recibió).
--   2. Inserta un pago de ajuste por la diferencia que falte para cubrir el
--      precio total del servicio. El ajuste se fecha con la fecha del servicio
--      y usa el método del último pago vinculado (o efectivo si no hay pagos).
--
-- Es idempotente: al volver a ejecutarla, los servicios completados ya no
-- tienen diferencia y no se insertan pagos nuevos.

begin;

-- 1. Los pagos pendientes de un servicio completado se consideran cobrados.
update payments p
set status = 'completado'
from services s
where p.service_id = s.id
  and s.status = 'completado'
  and p.status = 'pendiente';

-- 2. Insertar el pago de ajuste por el saldo restante.
with paid as (
  select service_id, sum(amount)::int as amount
  from payments
  where status = 'completado'
    and service_id is not null
  group by service_id
)
insert into payments (
  client_name,
  date,
  concept,
  amount,
  method,
  status,
  period,
  observation,
  service_id,
  advance
)
select
  s.client_name,
  s.date,
  'Ajuste de saldo · Servicio: ' || s.origin || ' → ' || s.destination,
  s.price - coalesce(paid.amount, 0),
  coalesce(last_payment.method, 'efectivo'::payment_method),
  'completado'::payment_status,
  to_char(s.date, 'YYYY-MM'),
  'Pago de ajuste generado por migración para cerrar el saldo de un servicio completado.',
  s.id,
  false
from services s
left join paid on paid.service_id = s.id
left join lateral (
  select method
  from payments p
  where p.service_id = s.id
  order by p.created_at desc
  limit 1
) last_payment on true
where s.status = 'completado'
  and s.price > coalesce(paid.amount, 0);

commit;
