import pg from "pg";

const url = process.env.DATABASE_URL_DEVELOP;
const client = new pg.Client({ connectionString: url });
await client.connect();

// Check routes
const routes = await client.query("select id, name, days_of_week, generation_window_days from daily_routes limit 5");
console.log("Routes:", JSON.stringify(routes.rows, null, 2));

// Check executions count per route
const execCount = await client.query("select route_id, count(*) from route_executions group by route_id");
console.log("\nExecutions per route:", JSON.stringify(execCount.rows, null, 2));

// Check today's date
const today = await client.query("select current_date, extract(dow from current_date) as dow");
console.log("\nToday:", JSON.stringify(today.rows[0], null, 2));

await client.end();
