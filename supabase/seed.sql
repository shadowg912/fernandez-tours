-- Seed develop — datos mock de lib/data.ts (NO usar en producción)

insert into clients (name, phone, email, address, service_type, last_service, balance) values
  ('María Rodríguez', '809-555-1234', 'maria.r@example.com', 'Calle del Sol #12, Santiago', 'Transporte regular', '24 Sep 2026', 1500),
  ('José Fernández', '829-555-4455', null, 'Av. Estrella Sadhalá, Santiago', 'Excursiones', '20 Sep 2026', 0),
  ('Ana Peña', '849-555-7788', 'ana.pena@example.com', 'Calle Duarte #45, La Vega', 'Transporte regular', '18 Sep 2026', 3200),
  ('Carlos Martínez', '809-555-9012', null, 'Urb. Los Jardines, Santiago', 'Corporativo', '15 Sep 2026', 0),
  ('Laura Gómez', '829-555-3366', null, 'Moca, Espaillat', 'Transporte regular', '10 Sep 2026', 800),
  ('Pedro Vásquez', '849-555-2290', null, 'San Francisco de Macorís', 'Excursiones', '05 Sep 2026', 0);

insert into services (client_name, date, time, origin, destination, passengers, price, status) values
  ('María Rodríguez', '2026-09-24', '08:00 AM', 'Santiago', 'La Vega', 2, 2500, 'confirmado'),
  ('José Fernández', '2026-09-24', '10:30 AM', 'Santiago', 'Santo Domingo', 4, 6000, 'pendiente'),
  ('Ana Peña', '2026-09-24', '02:00 PM', 'La Vega', 'Jarabacoa', 3, 3200, 'confirmado'),
  ('Carlos Martínez', '2026-09-25', '07:00 AM', 'Santiago', 'Puerto Plata', 5, 7500, 'confirmado'),
  ('Laura Gómez', '2026-09-25', '11:00 AM', 'Moca', 'Santiago', 1, 1200, 'pendiente'),
  ('Pedro Vásquez', '2026-09-26', '06:30 AM', 'San Francisco de Macorís', 'Santo Domingo', 3, 5500, 'confirmado'),
  ('Rosa Díaz', '2026-09-26', '03:00 PM', 'Santiago', 'Constanza', 4, 6800, 'pendiente'),
  ('Miguel Soriano', '2026-09-23', '09:00 AM', 'Santiago', 'Samaná', 6, 12000, 'completado'),
  ('Carmen Reyes', '2026-09-23', '01:00 PM', 'La Vega', 'Santiago', 2, 1800, 'completado'),
  ('Héctor Núñez', '2026-09-22', '05:00 PM', 'Santiago', 'Moca', 2, 1500, 'cancelado');

insert into students (name, school, address, schedule, days, monthly_fee, frequency, paid, guardian, phone) values
  ('Carlos Martínez Jr.', 'Colegio San José', 'Av. Circunvalación, Santiago', '6:45 AM - 2:30 PM', '{Lun,Mar,Mié,Jue,Vie}', 4500, 'mensual', true, 'Carlos Martínez', '809-555-9012'),
  ('Sofía Herrera', 'Colegio Bilingüe Horizonte', 'Calle 16 de Agosto, Santiago', '6:30 AM - 2:00 PM', '{Lun,Mar,Mié,Jue,Vie}', 5000, 'quincenal', false, 'Luisa Herrera', '829-555-6677'),
  ('Diego Taveras', 'Escuela Nueva Esperanza', 'Villa Olímpica, Santiago', '7:00 AM - 3:00 PM', '{Lun,Mié,Vie}', 3200, 'semanal', true, 'Ramón Taveras', '849-555-1122'),
  ('Valentina Cruz', 'Colegio San José', 'Los Pepines, Santiago', '6:45 AM - 2:30 PM', '{Lun,Mar,Mié,Jue,Vie}', 4500, 'mensual', false, 'Marta Cruz', '809-555-8899'),
  ('Mateo López', 'Centro Educativo El Futuro', 'Ensanche Libertad, Santiago', '6:30 AM - 2:00 PM', '{Lun,Mar,Mié,Jue,Vie}', 4200, 'mensual', true, 'Julio López', '829-555-3344');

insert into payments (client_name, date, concept, amount, method, status) values
  ('Carlos Martínez', '2026-09-24', 'Transporte estudiantil — Sept', 4500, 'efectivo', 'completado'),
  ('María Rodríguez', '2026-09-23', 'Servicio Santiago → La Vega', 1000, 'transferencia', 'completado'),
  ('Diego Taveras', '2026-09-22', 'Transporte estudiantil — Sept', 3200, 'efectivo', 'completado'),
  ('Miguel Soriano', '2026-09-21', 'Excursión Samaná', 12000, 'tarjeta', 'completado'),
  ('Sofía Herrera', '2026-09-24', 'Transporte estudiantil — Sept', 5000, 'efectivo', 'pendiente'),
  ('Valentina Cruz', '2026-09-24', 'Transporte estudiantil — Sept', 4500, 'transferencia', 'pendiente');
