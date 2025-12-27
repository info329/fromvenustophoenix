import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ acecqaId: string }> }
) {
  const { acecqaId } = await params;
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('external_services')
      .select('*')
      .eq('acecqa_id', acecqaId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service: data });
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
  }
}
