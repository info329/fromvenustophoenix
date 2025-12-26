import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from '@/components/pdf/ReportDocument';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get runId from URL
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    }

    // Get scoring run with service info
    const { data: run, error: runError } = await supabase
      .from('scoring_runs')
      .select('*, service:services(name)')
      .eq('id', runId)
      .eq('user_id', user.id)
      .single();

    if (runError || !run) {
      return NextResponse.json({ error: 'Scoring run not found' }, { status: 404 });
    }

    // Reconstruct the scoring result
    const scoringResult = {
      rankedFocusAreas: run.explanations_json,
      confidenceScore: run.confidence_score || 0,
      confidenceFactors: [],
      allDimensionScores: run.scores_json,
      modelVersion: `v${run.questionnaire_version}`,
      timestamp: run.created_at,
    };

    // Generate PDF
    const doc = ReportDocument({
      data: scoringResult,
      serviceName: (run.service as any)?.name || 'Unknown Service',
    });

    const pdfBlob = await pdf(doc as any).toBlob();
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ar-forecast-${runId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
