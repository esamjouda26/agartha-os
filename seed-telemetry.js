const fs = require('fs');
const env = fs.readFileSync('c:/Users/jouda/Desktop/AgarthaOS/agartha-os/.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const i = line.indexOf('=');
    if (i > -1) acc[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    return acc;
  }, {});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seed() {
  console.log("Fetching location...");
  let { data: locs } = await supabase.from('locations').select('id').limit(1);
  let locId;
  if (!locs || locs.length === 0) {
    console.log("No locations found, creating mock location.");
    const { data: newLoc, error: locErr } = await supabase.from('locations').insert({ name: 'Central Plaza', is_active: true }).select('id').single();
    if(locErr) { console.error("Loc err:", locErr); return; }
    locId = newLoc.id;
  } else {
    locId = locs[0].id;
  }

  console.log("Inserting zones...");
  const { data: zones, error: zErr } = await supabase.from('zones').insert([
    { location_id: locId, name: 'North Wing', capacity: 1000, is_active: true },
    { location_id: locId, name: 'South Wing', capacity: 800, is_active: true },
    { location_id: locId, name: 'East Corridor', capacity: 300, is_active: true }
  ]).select('id');
  
  if (zErr) { console.error("Zone err:", zErr); return; }

  console.log("Inserting zone_telemetry...");
  const telemetry = [
    { zone_id: zones[0].id, current_occupancy: 950, temperature: 22.5, humidity: 45, co2_level: 400 }, // 95%
    { zone_id: zones[1].id, current_occupancy: 600, temperature: 21.0, humidity: 50, co2_level: 350 }, // 75%
    { zone_id: zones[2].id, current_occupancy: 120, temperature: 19.5, humidity: 55, co2_level: 300 }  // 40%
  ];
  
  const { error: tErr } = await supabase.from('zone_telemetry').insert(telemetry);
  if (tErr) console.error("Telemetry err:", tErr);
  else console.log("Seeding complete!");
}
seed();
