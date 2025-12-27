const https = require('https');
const fs = require('fs');

const sql = fs.readFileSync('./scripts/schema.sql', 'utf8');
const projectRef = 'cqnjetagvxkbzobwdmjl';
const serviceKey = 'sb_secret_ZFaoMEMyLMoF8fZ8hIvi3A_0-LHaL1A';

const options = {
  hostname: projectRef + '.supabase.co',
  port: 443,
  path: '/rest/v1/rpc',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Prefer': 'params=single-object'
  }
};

console.log('Executing SQL via Supabase...\n');

const postData = JSON.stringify({
  query: sql
});

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✓ Database setup successful!');
    } else {
      console.log('\n✗ Setup failed. Trying alternative method...');
      tryDirectSQL();
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  console.log('\nTrying direct SQL execution...');
  tryDirectSQL();
});

req.write(postData);
req.end();

function tryDirectSQL() {
  // Try executing via pg_query
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  console.log(`\nExecuting ${statements.length} statements individually...`);
  
  let completed = 0;
  statements.forEach((stmt, index) => {
    const stmtOptions = {
      hostname: projectRef + '.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/pg_query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey
      }
    };
    
    const stmtData = JSON.stringify({ query: stmt.trim() + ';' });
    
    const stmtReq = https.request(stmtOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        completed++;
        if (res.statusCode === 200) {
          console.log(`✓ Statement ${index + 1}/${statements.length}`);
        } else {
          console.log(`✗ Statement ${index + 1} failed:`, data.substring(0, 100));
        }
        
        if (completed === statements.length) {
          console.log('\n✓ All statements processed');
          runSeed();
        }
      });
    });
    
    stmtReq.on('error', (e) => {
      console.error(`Error on statement ${index + 1}:`, e.message);
      completed++;
    });
    
    stmtReq.write(stmtData);
    stmtReq.end();
  });
}

function runSeed() {
  console.log('\nRunning seed data...');
  const { exec } = require('child_process');
  exec('npm run seed', { env: { 
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: 'https://' + projectRef + '.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: serviceKey
  }}, (error, stdout, stderr) => {
    if (error) {
      console.error('Seed error:', error);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
}
