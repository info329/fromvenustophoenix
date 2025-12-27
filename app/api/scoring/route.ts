import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateScores } from '@/lib/scoring/engine';
import type { Response } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Use test user ID for testing without authentication
    const testUserId = '00000000-0000-0000-0000-000000000001';

    const body = await request.json();
    const { serviceId, responses } = body as { serviceId: string; responses: Response[] };

    if (!serviceId || !responses || responses.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify service exists
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get active questionnaire
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('is_active', true)
      .single();

    if (qError || !questionnaire) {
      return NextResponse.json({ error: 'No active questionnaire found' }, { status: 404 });
    }

    // Get all required data for scoring
    const [
      { data: questions },
      { data: weights },
      { data: rules },
      { data: dimensions }
    ] = await Promise.all([
      supabase.from('questions').select('*').eq('questionnaire_id', questionnaire.id).order('display_order'),
      supabase.from('weights').select('*').eq('questionnaire_id', questionnaire.id),
      supabase.from('rules').select('*').eq('questionnaire_id', questionnaire.id).eq('is_active', true),
      supabase.from('dimensions').select('*').order('code')
    ]);

    if (!questions || !weights || !rules || !dimensions) {
      return NextResponse.json({ error: 'Failed to load scoring data' }, { status: 500 });
    }

    // Calculate scores
    const scoringResult = calculateScores(
      responses,
      weights,
      rules,
      dimensions,
      questions,
      questionnaire
    );

    // Save scoring run
    const { data: scoringRun, error: runError } = await supabase
      .from('scoring_runs')
      .insert({
        user_id: testUserId,
        service_id: serviceId,
        questionnaire_id: questionnaire.id,
        questionnaire_version: questionnaire.version,
        responses_json: responses,
        scores_json: scoringResult.allDimensionScores,
        explanations_json: scoringResult.rankedFocusAreas,
        confidence_score: scoringResult.confidenceScore,
      })
      .select()
      .single();

    if (runError || !scoringRun) {
      return NextResponse.json({ error: 'Failed to save scoring run' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      runId: scoringRun.id,
      results: scoringResult,
    });

  } catch (error: any) {
    console.error('Scoring error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
