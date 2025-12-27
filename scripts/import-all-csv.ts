#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ACECQAService {
  ServiceApprovalNumber: string;
  'Provider Approval Number': string;
  ServiceName: string;
  ProviderLegalName: string;
  ServiceType: string;
  ServiceAddress: string;
  Suburb: string;
  State: string;
  Postcode: string;
  Phone: string;
  NumberOfApprovedPlaces: string;
  QualityArea1Rating: string;
  QualityArea2Rating: string;
  QualityArea3Rating: string;
  QualityArea4Rating: string;
  QualityArea5Rating: string;
  QualityArea6Rating: string;
  QualityArea7Rating: string;
  OverallRating: string;
  RatingsIssued: string;
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
  if (normalized.includes('centre') || normalized.includes('long day')) return 'LDC';
  if (normalized.includes('family')) return 'FDC';
  if (normalized.includes('outside') || normalized.includes('oshc')) return 'OSHC';
  if (normalized.includes('preschool') || normalized.includes('kindergarten')) return 'Preschool';
  return 'LDC'; // default
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  try {
    // Try formats like "Sep 2024", "September 2024", "09/2024"
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const match = dateStr.match(/(\w+)\s+(\d{4})/);
    if (match) {
      const [_, month, year] = match;
      const monthIndex = monthNames.findIndex(m => month.startsWith(m));
      if (monthIndex >= 0) {
        return `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      }
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return null;
  } catch {
    return null;
  }
}

async function importACECQAData(csvData: string, fileName: string) {
  console.log(`\n📄 Processing ${fileName}...`);
  
  try {
    const records: ACECQAService[] = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Handle inconsistent column counts
    });

    console.log(`   Found ${records.length} services`);

    let imported = 0;
    let updated = 0;
    let errors = 0;
    const batchSize = 100;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      for (const record of batch) {
        try {
          if (!record.ServiceApprovalNumber || !record.ServiceName) {
            continue; // Skip invalid records
          }

          const serviceData = {
            acecqa_id: record.ServiceApprovalNumber,
            service_name: record.ServiceName,
            provider_name: record.ProviderLegalName || null,
            address: record.ServiceAddress || null,
            suburb: record.Suburb || null,
            state: record.State || null,
            postcode: record.Postcode || null,
            service_type: normalizeServiceType(record.ServiceType),
            overall_rating: normalizeRating(record.OverallRating),
            rating_date: parseDate(record.RatingsIssued),
            qa1_rating: normalizeRating(record.QualityArea1Rating),
            qa2_rating: normalizeRating(record.QualityArea2Rating),
            qa3_rating: normalizeRating(record.QualityArea3Rating),
            qa4_rating: normalizeRating(record.QualityArea4Rating),
            qa5_rating: normalizeRating(record.QualityArea5Rating),
            qa6_rating: normalizeRating(record.QualityArea6Rating),
            qa7_rating: normalizeRating(record.QualityArea7Rating),
            phone: record.Phone || null,
            email: null,
            website: null,
            approved_places: parseInt(record.NumberOfApprovedPlaces) || null,
            last_synced: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('external_services')
            .upsert(serviceData, {
              onConflict: 'acecqa_id',
            });

          if (error) {
            errors++;
            if (errors <= 5) { // Only log first 5 errors
              console.error(`      Error: ${error.message.substring(0, 100)}`);
            }
          } else {
            imported++;
          }
        } catch (err: any) {
          errors++;
        }
      }

      process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, records.length)}/${records.length}`);
    }

    console.log(`\n   ✅ Complete: ${imported} services, ${errors} errors`);
    return { imported, errors };
  } catch (err: any) {
    console.error(`   ❌ Failed to process ${fileName}:`, err.message);
    return { imported: 0, errors: 0 };
  }
}

async function calculateBenchmarks() {
  console.log('\n\n📊 Calculating benchmarks...');

  const { data: services, error } = await supabase
    .from('external_services')
    .select('*');

  if (error) {
    console.error('Error fetching services:', error);
    return;
  }

  console.log(`   Analyzing ${services?.length} services`);

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
      
      if (ratings.length === 0) continue;

      const distribution = {
        total: ratings.length,
        excellent: ratings.filter(r => r === 'Excellent').length,
        exceeding: ratings.filter(r => r === 'Exceeding').length,
        meeting: ratings.filter(r => r === 'Meeting').length,
        workingTowards: ratings.filter(r => r === 'Working Towards').length,
        percentExceedingOrBetter: Math.round(
          ((ratings.filter(r => r === 'Excellent' || r === 'Exceeding').length / ratings.length) * 100) * 100
        ) / 100,
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
      
      if (ratings.length === 0) continue;

      const distribution = {
        total: ratings.length,
        excellent: ratings.filter(r => r === 'Excellent').length,
        exceeding: ratings.filter(r => r === 'Exceeding').length,
        meeting: ratings.filter(r => r === 'Meeting').length,
        workingTowards: ratings.filter(r => r === 'Working Towards').length,
        percentExceedingOrBetter: Math.round(
          ((ratings.filter(r => r === 'Excellent' || r === 'Exceeding').length / ratings.length) * 100) * 100
        ) / 100,
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

  // Clear old benchmarks
  await supabase
    .from('benchmarks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert new benchmarks
  const { error: benchmarkError } = await supabase
    .from('benchmarks')
    .insert(benchmarks);

  if (benchmarkError) {
    console.error('   Error inserting benchmarks:', benchmarkError.message);
  } else {
    console.log(`   ✅ Created ${benchmarks.length} benchmarks`);
  }
}

async function main() {
  console.log('🚀 ACECQA Data Import - All CSV Files\n');
  console.log('=' .repeat(60));

  const csvDir = path.join(process.cwd(), 'CSV data');
  
  if (!fs.existsSync(csvDir)) {
    console.error('❌ CSV data directory not found!');
    console.error('   Expected: CSV data/');
    process.exit(1);
  }

  // Get all CSV files
  const files = fs.readdirSync(csvDir)
    .filter(f => f.endsWith('.csv'))
    .filter(f => f.startsWith('Education-services-')); // Only service files, not provider files

  console.log(`Found ${files.length} CSV files to import\n`);

  let totalImported = 0;
  let totalErrors = 0;

  // Process each file
  for (const file of files) {
    const filePath = path.join(csvDir, file);
    const csvData = fs.readFileSync(filePath, 'utf-8');
    const { imported, errors } = await importACECQAData(csvData, file);
    totalImported += imported;
    totalErrors += errors;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Total Services Imported: ${totalImported}`);
  console.log(`   Total Errors: ${totalErrors}`);

  // Calculate benchmarks
  await calculateBenchmarks();

  console.log('\n✨ All done!\n');
}

main().catch(console.error);
