const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Setting up database...');
  
  const sql = fs.readFileSync('./scripts/schema.sql', 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Executing ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.error(`Error on statement ${i + 1}:`, error.message);
      } else {
        console.log(`✓ Statement ${i + 1} completed`);
      }
    } catch (err) {
      console.error(`Exception on statement ${i + 1}:`, err.message);
    }
  }
  
  console.log('\n✓ Database setup complete!');
}

setupDatabase().catch(console.error);
