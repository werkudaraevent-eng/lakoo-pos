import postgres from "postgres";
import crypto from "crypto";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

// Check actual columns
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'workspace_assignments' ORDER BY ordinal_position`;
console.log("Columns:", cols.map(c => c.column_name).join(", "));

const userId = "u-a93e5e0f-e4b1-4b56-9cc9-63bd4733530b";

const stores = await sql`
  SELECT w.id, w.name FROM workspaces w
  JOIN users u ON u.tenant_id = (SELECT tenant_id FROM users WHERE id = ${userId})
  WHERE w.type = 'store' AND w.status = 'active' AND w.is_visible = true
  LIMIT 10
`;

console.log(`Assigning Hanung to ${stores.length} store(s)...`);

for (const ws of stores) {
  const waId = `wa-${crypto.randomUUID()}`;
  try {
    // Try with tenant_id
    await sql`
      INSERT INTO workspace_assignments (id, workspace_id, user_id, assigned_at)
      VALUES (${waId}, ${ws.id}, ${userId}, ${new Date().toISOString()})
      ON CONFLICT (workspace_id, user_id) DO NOTHING
    `;
    console.log(`  ✓ Assigned to ${ws.name}`);
  } catch (e) {
    console.log(`  ✗ Failed: ${e.message}`);
  }
}

// Verify
const check = await sql`SELECT wa.workspace_id, w.name FROM workspace_assignments wa JOIN workspaces w ON w.id = wa.workspace_id WHERE wa.user_id = ${userId}`;
console.log("Hanung's assignments:", check.map(r => r.name).join(", ") || "NONE");

await sql.end();
