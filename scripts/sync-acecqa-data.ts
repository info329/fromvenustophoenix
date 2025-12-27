/**
 * ACECQA Data Sync Script
 * Downloads latest CSV data from ACECQA National Registers and syncs to database
 * Run daily at 1am to keep data fresh
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import https from 'https';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const ACECQA_URLS = [
  'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-act-export.csv',
  'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-nsw-export.csv',
  'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-nt-export.csv',
  'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-qld-export.csv',
  'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-sa-export.csv',
  'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-tas-export.csv',
  'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-vic-export.csv',
  'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-wa-export.csv',
  'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-au-export.csv',
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ServiceRecord {
  ServiceApprovalNumber: string;
  ServiceName: string;
  ProviderApprovalNumber: string;
  ProviderName: string;
  PhysicalAddressLine1: string;
  PhysicalSuburb: string;
  PhysicalState: string;
  PhysicalPostcode: string;
  ServiceType: string;
  OverallRating: string;
  RatingDate: string;
  QualityArea1Rating: string;
  QualityArea2Rating: string;
  QualityArea3Rating: string;
  QualityArea4Rating: string;
  QualityArea5Rating: string;
  QualityArea6Rating: string;
  QualityArea7Rating: string;
  Phone: string;
  Email: string;
  Website: string;
  ApprovedPlaces: string;
}

// Fetch CSV from URL
async function fetchCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Normalize rating values
function normalizeRating(rating: string): string | null {
  if (!rating || rating.trim() === '') return null;
  const lower = rating.toLowerCase().trim();
  if (lower.includes('excellent')) return 'Excellent';
  if (lower.includes('exceeding')) return 'Exceeding';
  if (lower.includes('meeting')) return 'Meeting';
  if (lower.includes('working')) return 'Working Towards';
  if (lower.includes('significant')) return 'Significant Improvement Required';
  return rating;
}

// Normalize service type
function normalizeServiceType(type: string): string | null {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (lower.includes('long day care') || lower.includes('ldc')) return 'LDC';
  if (lower.includes('family day care') || lower.includes('fdc')) return 'FDC';
  if (lower.includes('outside school') || lower.includes('oshc')) return 'OSHC';
  if (lower.includes('preschool') || lower.includes('kindergarten')) return 'Preschool';
  return type;
}

// Parse and import services from CSV content
async function importServicesFromCSV(csvContent: string, source: string): Promise<number> {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ServiceRecord[];

  console.log(`  Found ${records.length} services in ${source}`);

  let imported = 0;
  const batchSize = 100;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const services = batch.map(record => ({
      acecqa_id: record.ServiceApprovalNumber,
      service_name: record.ServiceName,
      provider_name: record.ProviderName,
      address: record.PhysicalAddressLine1,
      suburb: record.PhysicalSuburb,
      state: record.PhysicalState,
      postcode: record.PhysicalPostcode,
      service_type: normalizeServiceType(record.ServiceType),
      overall_rating: normalizeRating(record.OverallRating),
      rating_date: record.RatingDate || null,
      qa1_rating: normalizeRating(record.QualityArea1Rating),
      qa2_rating: normalizeRating(record.QualityArea2Rating),
      qa3_rating: normalizeRating(record.QualityArea3Rating),
      qa4_rating: normalizeRating(record.QualityArea4Rating),
      qa5_rating: normalizeRating(record.QualityArea5Rating),
      qa6_rating: normalizeRating(record.QualityArea6Rating),
      qa7_rating: normalizeRating(record.QualityArea7Rating),
      phone: record.Phone || null,
      email: record.Email || null,
      website: record.Website || null,
      approved_places: record.ApprovedPlaces ? parseInt(record.ApprovedPlaces) : null,
      last_synced: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('external_services')
      .upsert(services, { onConflict: 'acecqa_id' });

    if (error) {
      console.error(`  ❌ Error importing batch ${i}-${i + batch.length}:`, error.message);
    } else {
      imported += batch.length;
    }
  }

  return imported;
}

// Calculate benchmarks from imported data
async function calculateBenchmarks() {
  console.log('\n📊 Calculating benchmarks...');

  // Get rating distributions by state and service type
  const { data: services } = await supabase
    .from('external_services')
    .select('state, service_type, overall_rating, qa1_rating, qa2_rating, qa3_rating, qa4_rating, qa5_rating, qa6_rating, qa7_rating');

  if (!services) return;

  const benchmarks: any[] = [];
  const now = new Date().toISOString();

  // Calculate overall rating distributions
  const stateTypes = new Set(services.map(s => `${s.state}|${s.service_type}`));
  
  for (const combo of stateTypes) {
    const [state, serviceType] = combo.split('|');
    const subset = services.filter(s => s.state === state && s.service_type === serviceType);
    
    const ratingCounts: Record<string, number> = {};
    subset.forEach(s => {
      if (s.overall_rating) {
        ratingCounts[s.overall_rating] = (ratingCounts[s.overall_rating] || 0) + 1;
      }
    });

    benchmarks.push({
      benchmark_type: 'overall_rating_distribution',
      state,
      service_type: serviceType,
      quality_area: null,
      metric_name: 'rating_distribution',
      metric_value: ratingCounts,
      calculation_date: now,
    });

    // Calculate QA-specific benchmarks
    for (let qa = 1; qa <= 7; qa++) {
      const qaField = `qa${qa}_rating` as keyof typeof services[0];
      const qaCounts: Record<string, number> = {};
      
      subset.forEach(s => {
        const rating = s[qaField] as string;
        if (rating) {
          qaCounts[rating] = (qaCounts[rating] || 0) + 1;
        }
      });

      benchmarks.push({
        benchmark_type: 'qa_rating_distribution',
        state,
        service_type: serviceType,
        quality_area: `QA${qa}`,
        metric_name: 'rating_distribution',
        metric_value: qaCounts,
        calculation_date: now,
      });
    }
  }

  // Clear old benchmarks and insert new ones
  await supabase.from('benchmarks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { error } = await supabase.from('benchmarks').insert(benchmarks);
  if (error) {
    console.error('❌ Error calculating benchmarks:', error.message);
  } else {
    console.log(`✅ Calculated ${benchmarks.length} benchmarks`);
  }
}

// Main sync function
async function syncACEQAData() {
  console.log('🔄 Starting ACECQA data sync...');
  console.log(`⏰ ${new Date().toISOString()}\n`);

  let totalImported = 0;

  for (const url of ACECQA_URLS) {
    const filename = url.split('/').pop()?.replace('?nocache=', '').split('?')[0] || 'unknown';
    console.log(`📥 Downloading ${filename}...`);

    try {
      const csvContent = await fetchCSV(url);
      const imported = await importServicesFromCSV(csvContent, filename);
      totalImported += imported;
      console.log(`  ✅ Imported ${imported} services\n`);
    } catch (error) {
      console.error(`  ❌ Error processing ${filename}:`, error);
    }
  }

  console.log(`\n✅ Sync complete! Imported ${totalImported} services total`);

  // Calculate benchmarks after import
  await calculateBenchmarks();

  // Log final counts
  const { count } = await supabase
    .from('external_services')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Total services in database: ${count}`);
}

// Run sync
syncACEQAData()
  .then(() => {
    console.log('\n✨ Sync job completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Sync job failed:', error);
    process.exit(1);
  });
