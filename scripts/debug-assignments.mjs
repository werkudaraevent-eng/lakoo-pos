import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

const assignments = await sql`
  SELECT wa.workspace_id, wa.user_id, w.name as ws_name, w.type as ws_type, u.name as user_name, u.username
  FROM workspace_assignments wa
  JOIN workspaces w ON w.id = wa.workspace_id
  JOIN users u ON u.id = wa.user_id
  ORDER BY u.name, w.name
`;

console.log("=== WORKSPACE ASSIGNMENTS ===");
for (const a of assignments) {
  console.log(`  ${a.user_name} (@${a.username}) → ${a.ws_name} [${a.ws_type}]`);
}
console.log(`Total: ${assignments.length} assignments\n`);

const users = await sql`SELECT id, name, username, role, is_active FROM users ORDER BY name`;
console.log("=== USERS ===");
for (const u of users) {
  console.log(`  ${u.name} (@${u.username}) [${u.role}] active=${u.is_active} id=${u.id}`);
}

const workspaces = await sql`SELECT id, name, type, status, is_visible FROM workspaces ORDER BY type, name`;
console.log("\n=== WORKSPACES ===");
for (const w of workspaces) {
  console.log(`  ${w.name} [${w.type}] status=${w.status} visible=${w.is_visible} id=${w.id}`);
}

await sql.end();
