import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state');
  const serviceType = searchParams.get('serviceType');
  const qualityArea = searchParams.get('qa');
  const benchmarkType = searchParams.get('type') || 'state_qa';

  const supabase = await createClient();

  try {
    let queryBuilder = supabase
      .from('benchmarks')
      .select('*')
      .eq('benchmark_type', benchmarkType);

    if (state) {
      queryBuilder = queryBuilder.eq('state', state);
    }

    if (serviceType) {
      queryBuilder = queryBuilder.eq('service_type', serviceType);
    }

    if (qualityArea) {
      queryBuilder = queryBuilder.eq('quality_area', qualityArea);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Benchmark fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch benchmarks' }, { status: 500 });
    }

    return NextResponse.json({ benchmarks: data || [] });
  } catch (err) {
    console.error('Benchmark fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch benchmarks' }, { status: 500 });
  }
}
