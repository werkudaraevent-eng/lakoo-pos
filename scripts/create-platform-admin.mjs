import postgres from "postgres";
import crypto from "crypto";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

// Check existing
const existing = await sql`SELECT id, email, name FROM platform_admins`;
console.log("Existing platform admins:", existing.length ? existing.map(a => `${a.name} (${a.email})`).join(", ") : "NONE");

if (existing.length === 0) {
  // Create one
  const email = "admin@lakoo.id";
  const password = "admin123";
  const name = "Lakoo Admin";
  
  // Hash password with scrypt
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  const passwordHash = `scrypt:${salt}:${hash}`;
  
  await sql`
    INSERT INTO platform_admins (id, email, password_hash, name, is_active, created_at)
    VALUES (${`pa-${crypto.randomUUID()}`}, ${email}, ${passwordHash}, ${name}, ${true}, ${new Date().toISOString()})
  `;
  
  console.log(`\n✓ Platform admin created!`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
} else {
  console.log("\nPlatform admin already exists. No action needed.");
}

await sql.end();
