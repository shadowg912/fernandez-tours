import pg from "pg";

/**
 * Datos de prueba para los recibos de estudiantes.
 * Solo escribe en la base de datos de DEVELOP (DATABASE_URL_DEVELOP).
 * Es idempotente: usa IDs fijos y reemplaza los pagos de esos estudiantes.
 *
 * Uso: node --env-file=.env.local scripts/seed-test-students.mjs
 */

const url = process.env.DATABASE_URL_DEVELOP;
if (!url) throw new Error("Falta DATABASE_URL_DEVELOP en .env.local");

const client = new pg.Client({ connectionString: url });
await client.connect();

const students = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "PRUEBA Ana",
    school: "Colegio de Prueba",
    address: "Calle de Prueba #1",
    entryTime: "07:00",
    exitTime: "14:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    monthlyFee: 4500,
    frequency: "mensual",
    routeName: "IPISA-IPIDBOSCO",
    payments: [
      { date: "2026-08-05", amount: 4500, method: "efectivo", period: "2026-08" },
      { date: "2026-09-05", amount: 4500, method: "transferencia", period: "2026-09" },
      { date: "2026-10-05", amount: 4500, method: "tarjeta", period: "2026-10" },
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "PRUEBA Luis",
    school: "Colegio de Prueba",
    address: "Calle de Prueba #2",
    entryTime: "06:45",
    exitTime: "13:30",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    monthlyFee: 5000,
    frequency: "quincenal",
    routeName: "Fernando",
    payments: [
      { date: "2026-08-03", amount: 2500, method: "efectivo", period: "2026-08" },
      { date: "2026-08-17", amount: 2500, method: "efectivo", period: "2026-08" },
      { date: "2026-09-01", amount: 2500, method: "transferencia", period: "2026-09" },
      { date: "2026-09-15", amount: 2500, method: "transferencia", period: "2026-09" },
      { date: "2026-10-01", amount: 2500, method: "tarjeta", period: "2026-10" },
      { date: "2026-10-15", amount: 2500, method: "tarjeta", period: "2026-10" },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "PRUEBA Carla",
    school: "Escuela de Prueba",
    address: "Calle de Prueba #3",
    entryTime: "07:15",
    exitTime: "13:45",
    days: ["Mon", "Wed", "Fri"],
    monthlyFee: 3500,
    frequency: "mensual",
    routeName: null,
    payments: [
      { date: "2026-08-10", amount: 3500, method: "efectivo", period: "2026-08" },
      { date: "2026-09-10", amount: 3500, method: "transferencia", period: "2026-09" },
      { date: "2026-10-10", amount: 3500, method: "efectivo", period: "2026-10" },
      { date: "2026-10-15", amount: 3500, method: "efectivo", period: "2026-10", status: "pendiente" },
    ],
  },
];

if (process.argv.includes("--clean")) {
  try {
    await client.query("begin");
    for (const student of students) {
      await client.query("delete from payments where student_id = $1", [student.id]);
      await client.query("delete from students where id = $1", [student.id]);
    }
    await client.query("commit");
    console.log("🧹 Datos de prueba eliminados de develop.");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
  process.exit(0);
}

try {
  await client.query("begin");

  for (const student of students) {
    let routeId = null;
    if (student.routeName) {
      const routes = await client.query("select id from routes where name = $1", [student.routeName]);
      if (routes.rows.length === 0) {
        throw new Error(`No existe la ruta "${student.routeName}" en develop`);
      }
      routeId = routes.rows[0].id;
    }

    await client.query(
      `insert into students
         (id, name, school, address, entry_time, exit_time, days, monthly_fee, frequency,
          guardian, phone, route_id, paid)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false)
       on conflict (id) do update set
         name = excluded.name,
         school = excluded.school,
         address = excluded.address,
         entry_time = excluded.entry_time,
         exit_time = excluded.exit_time,
         days = excluded.days,
         monthly_fee = excluded.monthly_fee,
         frequency = excluded.frequency,
         guardian = excluded.guardian,
         phone = excluded.phone,
         route_id = excluded.route_id`,
      [
        student.id,
        student.name,
        student.school,
        student.address,
        student.entryTime,
        student.exitTime,
        student.days,
        student.monthlyFee,
        student.frequency,
        "Representante de prueba",
        "809-000-0000",
        routeId,
      ]
    );

    // Reemplaza solo los pagos de estos estudiantes de prueba.
    await client.query("delete from payments where student_id = $1", [student.id]);

    for (const payment of student.payments) {
      const status = payment.status ?? "completado";
      await client.query(
        `insert into payments
           (client_name, date, concept, amount, method, status, period, observation, student_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          student.name,
          payment.date,
          `Transporte estudiantil — ${payment.period}`,
          payment.amount,
          payment.method,
          status,
          payment.period,
          "Dato de prueba",
          student.id,
        ]
      );
    }

    await client.query("select refresh_student_paid_until($1)", [student.id]);
  }

  await client.query("commit");

  console.log("✅ Datos de prueba creados en develop:");
  for (const student of students) {
    const completed = student.payments.filter((p) => (p.status ?? "completado") === "completado").length;
    const pending = student.payments.length - completed;
    console.log(
      `  ${student.name}: ${completed} pagos completados${pending ? `, ${pending} pendiente` : ""}` +
        ` (${student.routeName ?? "sin ruta"})`
    );
  }
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
