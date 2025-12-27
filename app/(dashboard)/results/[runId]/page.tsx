import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { formatDateTime } from '@/lib/utils/helpers';

export const dynamic = 'force-dynamic';

export default async function ResultsPage({ params }: { params: { runId: string } }) {
  const supabase = await createClient();
  
  // Use test user ID for testing without authentication
  const testUserId = '00000000-0000-0000-0000-000000000001';

  // Get scoring run with all details
  const { data: run, error } = await supabase
    .from('scoring_runs')
    .select('*, service:services(name, state, service_type)')
    .eq('id', params.runId)
    .eq('user_id', testUserId)
    .single();

  if (error || !run) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Results not found</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const results = run.explanations_json;
  const confidenceScore = run.confidence_score || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">A&R Focus Forecast Results</h1>
          <p className="text-slate-600 mt-2">
            {(run.service as any)?.name} • Generated {formatDateTime(run.created_at)}
          </p>
        </div>
        <div className="flex gap-3">
          <a href={`/api/pdf?runId=${params.runId}`} target="_blank">
            <Button>Download PDF</Button>
          </a>
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Confidence Score */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Score</CardTitle>
          <CardDescription>
            Based on questionnaire completeness and response patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Progress value={confidenceScore} showLabel={false} />
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {Math.round(confidenceScore)}%
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {confidenceScore >= 75 ? 'High confidence' : 
             confidenceScore >= 50 ? 'Moderate confidence' : 
             'Lower confidence'} - This forecast is based on your responses and statistical patterns.
          </p>
        </CardContent>
      </Card>

      {/* Ranked Focus Areas */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Ranked Focus Areas</h2>
        <div className="space-y-4">
          {results && results.map((area: any) => (
            <Card key={area.rank}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">
                      {area.rank}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {area.dimension.code} - {area.dimension.name}
                      </h3>
                      <p className="text-sm text-slate-600">{area.dimension.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={
                      area.probability === 'High' ? 'danger' :
                      area.probability === 'Medium' ? 'warning' : 'info'
                    }>
                      {area.probability} Probability
                    </Badge>
                    <span className="text-sm text-slate-600">
                      {area.prepTimeAllocation}% prep time
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <Progress value={area.dimension.normalizedScore} showLabel={false} />
                  <p className="text-sm text-slate-600 mt-1">
                    Score: {Math.round(area.dimension.normalizedScore)}/100
                  </p>
                </div>

                {/* Why Flagged */}
                {area.dimension.contributions && area.dimension.contributions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Why Flagged:</h4>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {area.dimension.contributions.slice(0, 3).map((contrib: any, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{contrib.explanation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Likely Questions */}
                {area.likelyQuestions && area.likelyQuestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Likely Questions:</h4>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {area.likelyQuestions.slice(0, 3).map((question: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red Flags */}
                {area.redFlags && area.redFlags.length > 0 && area.redFlags[0] !== 'No specific red flags identified' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-red-900 mb-2">Red Flags:</h4>
                    <ul className="space-y-1 text-sm text-red-800">
                      {area.redFlags.map((flag: string, i: number) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-amber-900 mb-2">Important Disclaimer</h3>
          <p className="text-sm text-amber-800">
            This report provides a <strong>probability-based forecast only</strong>. It does not 
            guarantee what an Authorised Officer will focus on during an Assessment and Rating visit. 
            Results are based on the responses provided and should be used as a preparation guide only. 
            Always refer to the National Quality Framework and your regulatory authority for 
            authoritative guidance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
