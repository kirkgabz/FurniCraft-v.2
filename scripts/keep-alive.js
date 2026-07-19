// scripts/keep-alive.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function ping() {
  // Replace 'your_table_name' with any table in your database
  const { data, error } = await supabase
    .from('your_table_name') 
    .select('*', { count: 'exact', head: true })
    .limit(1);

  if (error) {
    console.error('Ping failed:', error);
    process.exit(1);
  }
  console.log('Ping successful!');
}

ping();
