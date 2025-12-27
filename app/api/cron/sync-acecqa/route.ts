/**
 * Cron endpoint for ACECQA data synchronization
 * Called by Vercel Cron Jobs daily at 1am AEST
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

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

function normalizeServiceType(type: string): string | null {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (lower.includes('long day care') || lower.includes('ldc')) return 'LDC';
  if (lower.includes('family day care') || lower.includes('fdc')) return 'FDC';
  if (lower.includes('outside school') || lower.includes('oshc')) return 'OSHC';
  if (lower.includes('preschool') || lower.includes('kindergarten')) return 'Preschool';
  return type;
}

export async function GET(request: NextRequest) {
  // Verify this is a cron request from Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results = {
    started: new Date().toISOString(),
    completed: '',
    totalImported: 0,
    files: [] as any[],
    benchmarks: 0,
    errors: [] as string[],
  };

  try {
    // Process each CSV file
    for (const url of ACECQA_URLS) {
      const filename = url.split('/').pop()?.split('?')[0] || 'unknown';
      
      try {
        const response = await fetch(url);
        const csvContent = await response.text();
        
        const records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }) as ServiceRecord[];

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

          if (!error) {
            imported += batch.length;
          }
        }

        results.files.push({ filename, records: records.length, imported });
        results.totalImported += imported;
      } catch (error) {
        results.errors.push(`${filename}: ${error}`);
      }
    }

    // Calculate benchmarks
    const { data: services } = await supabase
      .from('external_services')
      .select('state, service_type, overall_rating, qa1_rating, qa2_rating, qa3_rating, qa4_rating, qa5_rating, qa6_rating, qa7_rating');

    if (services) {
      const benchmarks: any[] = [];
      const now = new Date().toISOString();
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

      await supabase.from('benchmarks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('benchmarks').insert(benchmarks);
      results.benchmarks = benchmarks.length;
    }

    results.completed = new Date().toISOString();
    
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...results,
    }, { status: 500 });
  }
}
