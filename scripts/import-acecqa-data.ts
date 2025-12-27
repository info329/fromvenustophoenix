import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import * as https from 'https';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ACECQA data sources
const DATA_SOURCES = {
  // Main national register - check ACECQA website for current CSV export URL
  nationalRegister: 'https://www.acecqa.gov.au/sites/default/files/acecqa/files/National%20Registers/Service.csv',
  // Alternative: You may need to manually download from https://www.acecqa.gov.au/resources/national-registers
};

interface ACECQAService {
  ServiceID: string;
  ServiceName: string;
  ProviderName: string;
  ServiceType: string;
  ServiceAddress: string;
  Suburb: string;
  State: string;
  Postcode: string;
  Phone: string;
  Email: string;
  Website: string;
  ApprovedPlaces: string;
  OverallRating: string;
  RatingDate: string;
  QA1: string;
  QA2: string;
  QA3: string;
  QA4: string;
  QA5: string;
  QA6: string;
  QA7: string;
}

async function downloadCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url}...`);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
        return https.get(res.headers.location!, (redirectRes) => {
          let data = '';
          redirectRes.on('data', chunk => data += chunk);
          redirectRes.on('end', () => resolve(data));
          redirectRes.on('error', reject);
        });
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function normalizeRating(rating: string): string {
  const normalized = rating?.trim().toLowerCase();
  if (!normalized) return 'Not Yet Rated';
  
  if (normalized.includes('excellent')) return 'Excellent';
  if (normalized.includes('exceed')) return 'Exceeding';
  if (normalized.includes('meet')) return 'Meeting';
  if (normalized.includes('working')) return 'Working Towards';
  if (normalized.includes('significant')) return 'Significant Improvement';
  
  return 'Not Yet Rated';
}

function normalizeServiceType(type: string): string {
  const normalized = type?.trim().toLowerCase();
  if (normalized.includes('long day')) return 'LDC';
  if (normalized.includes('family day')) return 'FDC';
  if (normalized.includes('outside school') || normalized.includes('oshc')) return 'OSHC';
  if (normalized.includes('preschool') || normalized.includes('kindergarten')) return 'Preschool';
  return 'LDC'; // default
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

async function importACECQAData(csvData: string) {
  console.log('Parsing CSV data...');
  
  const records: ACECQAService[] = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} services in CSV`);

  // Process in batches to avoid overwhelming the database
  const batchSize = 100;
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    for (const record of batch) {
      try {
        const serviceData = {
          acecqa_id: record.ServiceID,
          service_name: record.ServiceName,
          provider_name: record.ProviderName,
          address: record.ServiceAddress,
          suburb: record.Suburb,
          state: record.State,
          postcode: record.Postcode,
          service_type: normalizeServiceType(record.ServiceType),
          overall_rating: normalizeRating(record.OverallRating),
          rating_date: parseDate(record.RatingDate),
          qa1_rating: normalizeRating(record.QA1),
          qa2_rating: normalizeRating(record.QA2),
          qa3_rating: normalizeRating(record.QA3),
          qa4_rating: normalizeRating(record.QA4),
          qa5_rating: normalizeRating(record.QA5),
          qa6_rating: normalizeRating(record.QA6),
          qa7_rating: normalizeRating(record.QA7),
          phone: record.Phone,
          email: record.Email,
          website: record.Website,
          approved_places: parseInt(record.ApprovedPlaces) || null,
          last_synced: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('external_services')
          .upsert(serviceData, {
            onConflict: 'acecqa_id',
          });

        if (error) {
          console.error(`Error importing service ${record.ServiceID}:`, error.message);
          errors++;
        } else {
          if (i === 0) imported++;
          else updated++;
        }
      } catch (err) {
        console.error(`Error processing service ${record.ServiceID}:`, err);
        errors++;
      }
    }

    console.log(`Progress: ${Math.min(i + batchSize, records.length)}/${records.length} services processed`);
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported} services`);
  console.log(`   Updated: ${updated} services`);
  console.log(`   Errors: ${errors} services`);
}

async function calculateBenchmarks() {
  console.log('\n📊 Calculating benchmarks...');

  // Get all services for calculations
  const { data: services, error } = await supabase
    .from('external_services')
    .select('*');

  if (error) {
    console.error('Error fetching services:', error);
    return;
  }

  console.log(`Calculating benchmarks from ${services?.length} services`);

  // Calculate state-level QA benchmarks
  const qualityAreas = ['QA1', 'QA2', 'QA3', 'QA4', 'QA5', 'QA6', 'QA7'];
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];
  const serviceTypes = ['LDC', 'FDC', 'OSHC', 'Preschool'];

  const benchmarks = [];

  // By state and QA
  for (const state of states) {
    const stateServices = services?.filter(s => s.state === state) || [];
    
    for (const qa of qualityAreas) {
      const qaField = `${qa.toLowerCase()}_rating`;
      const ratings = stateServices.map(s => s[qaField]).filter(Boolean);
      
      const distribution = {
        excellent: ratings.filter(r => r === 'Excellent').length,
        exceeding: ratings.filter(r => r === 'Exceeding').length,
        meeting: ratings.filter(r => r === 'Meeting').length,
        workingTowards: ratings.filter(r => r === 'Working Towards').length,
      };

      benchmarks.push({
        benchmark_type: 'state_qa',
        state,
        quality_area: qa,
        metric_name: 'rating_distribution',
        metric_value: distribution,
        calculation_date: new Date().toISOString(),
      });
    }
  }

  // By service type and QA
  for (const serviceType of serviceTypes) {
    const typeServices = services?.filter(s => s.service_type === serviceType) || [];
    
    for (const qa of qualityAreas) {
      const qaField = `${qa.toLowerCase()}_rating`;
      const ratings = typeServices.map(s => s[qaField]).filter(Boolean);
      
      const distribution = {
        excellent: ratings.filter(r => r === 'Excellent').length,
        exceeding: ratings.filter(r => r === 'Exceeding').length,
        meeting: ratings.filter(r => r === 'Meeting').length,
        workingTowards: ratings.filter(r => r === 'Working Towards').length,
      };

      benchmarks.push({
        benchmark_type: 'service_type_qa',
        service_type: serviceType,
        quality_area: qa,
        metric_name: 'rating_distribution',
        metric_value: distribution,
        calculation_date: new Date().toISOString(),
      });
    }
  }

  // Insert benchmarks
  const { error: benchmarkError } = await supabase
    .from('benchmarks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Clear old benchmarks

  await supabase
    .from('benchmarks')
    .insert(benchmarks);

  console.log(`✅ Created ${benchmarks.length} benchmarks`);
}

async function main() {
  console.log('🚀 Starting ACECQA data import...\n');

  // Check if we should use a local file or download
  const localFile = process.argv[2];
  
  let csvData: string;
  
  if (localFile && fs.existsSync(localFile)) {
    console.log(`Using local file: ${localFile}`);
    csvData = fs.readFileSync(localFile, 'utf-8');
  } else {
    console.log('NOTE: You may need to manually download the CSV from:');
    console.log('https://www.acecqa.gov.au/resources/national-registers');
    console.log('\nThen run: npm run import-acecqa path/to/Service.csv\n');
    
    // Try to download (may not work due to website structure)
    try {
      csvData = await downloadCSV(DATA_SOURCES.nationalRegister);
    } catch (err) {
      console.error('❌ Could not download data automatically.');
      console.error('Please download the CSV manually and run:');
      console.error('  npm run import-acecqa path/to/Service.csv');
      process.exit(1);
    }
  }

  await importACECQAData(csvData);
  await calculateBenchmarks();

  console.log('\n✨ All done!');
}

main().catch(console.error);
