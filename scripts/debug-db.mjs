import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.SUPABASE_DB_URL, {prepare:false});

// Test login flow
const user = await sql`
  SELECT id, name, username, role, is_active, tenant_id, password_hash
  FROM users WHERE username = 'admin' LIMIT 1
`;
console.log('User found:', user[0]?.id, 'tenant_id:', user[0]?.tenant_id, 'is_active:', user[0]?.is_active);
console.log('Password hash starts with:', user[0]?.password_hash?.substring(0, 20));

// Test tenant
if (user[0]?.tenant_id) {
  const tenant = await sql`SELECT id, name, status FROM tenants WHERE id = ${user[0].tenant_id} LIMIT 1`;
  console.log('Tenant:', JSON.stringify(tenant[0]));
} else {
  console.log('WARNING: tenant_id is NULL!');
}

// Test getBootstrap query (settings)
try {
  const settings = await sql`SELECT key, value FROM settings WHERE tenant_id = ${user[0]?.tenant_id} LIMIT 5`;
  console.log('Settings count:', settings.length);
} catch(e) {
  console.log('Settings query error:', e.message);
}

await sql.end();
