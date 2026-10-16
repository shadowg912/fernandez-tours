-- Vincular pagos a estudiantes/clientes y marcar pagos por adelantado.
-- ON DELETE SET NULL: al borrar un estudiante o cliente, el pago se conserva
-- (el nombre se mantiene como snapshot en payments.client_name).

alter table payments add column if not exists student_id uuid references students(id) on delete set null;
alter table payments add column if not exists client_id  uuid references clients(id)  on delete set null;
alter table payments add column if not exists advance    boolean not null default false;

create index if not exists payments_student_id_idx on payments (student_id);
create index if not exists payments_client_id_idx  on payments (client_id);
