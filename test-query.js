const fs = require('fs');
const env = fs.readFileSync('c:/Users/jouda/Desktop/AgarthaOS/agartha-os/.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const i = line.indexOf('=');
    if (i > -1) acc[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    return acc;
  }, {});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL, 
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('maintenance_work_orders')
    .select(`
      id, target_ci_id, vendor_id, vendor_mac_address,
      maintenance_start, maintenance_end, mad_limit_minutes,
      status, assigned_sponsor_id, created_at, updated_at, scope,
      vendor_data:suppliers(name)
    `);
  console.log("Error:", error);
  console.log("Data Length:", data ? data.length : 0);
  if (data && data.length > 0) console.log("Sample:", JSON.stringify(data[0], null, 2));
}

test();
