import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const state = searchParams.get('state');
  const serviceType = searchParams.get('serviceType');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    let queryBuilder = supabase
      .from('external_services')
      .select('*')
      .or(`service_name.ilike.%${query}%,suburb.ilike.%${query}%,postcode.ilike.%${query}%`)
      .order('service_name', { ascending: true })
      .limit(limit);

    if (state) {
      queryBuilder = queryBuilder.eq('state', state);
    }

    if (serviceType) {
      queryBuilder = queryBuilder.eq('service_type', serviceType);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    return NextResponse.json({ services: data || [] });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
