-- Cobertura de pago del estudiante (paid_until) derivada de sus pagos.
-- Un pago completado cubre (monto / tarifa) periodos; cada periodo dura
-- 30 días (mensual), 15 (quincenal) o 7 (semanal). Los pagos acumulan:
-- si ya estaba cubierto más adelante, un pago nuevo extiende desde ahí.

alter table students add column if not exists paid_until date;

create or replace function refresh_student_paid_until(p_student_id uuid)
returns void
language plpgsql
as $$
declare
  s       students%rowtype;
  pay     record;
  unit    interval;
  periods int;
  cur     date;
begin
  select * into s from students where id = p_student_id;
  if not found then
    return;
  end if;

  unit := case s.frequency
    when 'quincenal' then interval '15 days'
    when 'semanal'   then interval '7 days'
    else                  interval '30 days'
  end;

  cur := null;
  for pay in
    select date, amount
    from payments
    where student_id = p_student_id and status = 'completado'
    order by date asc, created_at asc
  loop
    if s.monthly_fee is null or s.monthly_fee <= 0 then
      periods := 1;
    else
      periods := greatest(1, (pay.amount / s.monthly_fee)::int);
    end if;
    cur := (greatest(coalesce(cur, pay.date), pay.date) + unit * periods)::date;
  end loop;

  update students
  set paid_until = cur,
      paid = (cur is not null and cur >= current_date)
  where id = p_student_id;
end $$;

-- Backfill ---------------------------------------------------------------
-- 1) Capturar estudiantes marcados "pagado" que no tienen pagos registrados.
create temp table _legacy_paid as
select s.id, s.frequency
from students s
where s.paid = true
  and not exists (
    select 1 from payments p
    where p.student_id = s.id and p.status = 'completado'
  );

-- 2) Recalcular la cobertura de todos a partir de sus pagos.
do $$
declare
  r record;
begin
  for r in select id from students loop
    perform refresh_student_paid_until(r.id);
  end loop;
end $$;

-- 3) A los legacy darles un periodo desde hoy para no cambiar su estado de golpe.
update students s
set paid_until = (current_date + case l.frequency
      when 'quincenal' then interval '15 days'
      when 'semanal'   then interval '7 days'
      else                  interval '30 days'
    end)::date,
    paid = true
from _legacy_paid l
where s.id = l.id;

drop table _legacy_paid;
