#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL(sql: string) {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
  return true;
}

async function main() {
  console.log('🔧 Updating Supabase schema with ACECQA tables...\n');

  // Read schema file
  const fullSql = fs.readFileSync('scripts/schema.sql', 'utf8');
  const lines = fullSql.split('\n');
  const acecqaSQL = lines.slice(179, 268).join('\n');

  // Split into individual statements
  const statements = acecqaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const preview = statement.substring(0, 50).replace(/\n/g, ' ');
    
    process.stdout.write(`${i + 1}. ${preview}...`);
    
    const result = await runSQL(statement);
    if (result) {
      console.log(' ✅');
      success++;
    } else {
      console.log(' ❌');
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Success: ${success} statements`);
  console.log(`❌ Failed: ${failed} statements`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed === 0) {
    console.log('🎉 Schema update complete! Ready to import data.\n');
  }
}

main().catch(console.error);
