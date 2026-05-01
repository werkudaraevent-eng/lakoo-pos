import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

const rows = await sql`SELECT id, name, image_url FROM products`;
console.log("=== ALL PRODUCTS ===");
for (const r of rows) {
  console.log(`  ${r.name} → image_url: ${r.image_url || "NULL"}`);
}

await sql.end();
