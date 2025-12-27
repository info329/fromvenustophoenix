'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { formatDateTime } from '@/lib/utils/helpers';
import { Download, Home, AlertTriangle, CheckCircle2, TrendingUp, Target, Clock, BarChart3 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function ResultsPage({ params }: { params: Promise<{ runId: string }> }) {
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runId, setRunId] = useState<string>('');

  useEffect(() => {
    params.then(p => setRunId(p.runId));
  }, [params]);

  useEffect(() => {
    if (!runId) return;

    const fetchData = async () => {
      const supabase = createClient();
      const testUserId = '00000000-0000-0000-0000-000000000001';

      const { data, error } = await supabase
        .from('scoring_runs')
        .select('*, service:services(name, state, service_type)')
        .eq('id', runId)
        .eq('user_id', testUserId)
        .single();

      setRun(data);
      setLoading(false);
    };

    fetchData();
  }, [runId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-slate-600">Loading...</div></div>;
  }

  if (!run) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-xl text-red-600 mb-4">Results not found</p>
            <Link href="/dashboard">
              <Button className="gap-2">
                <Home className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const results = run.explanations_json;
  const confidenceScore = run.confidence_score || 0;

  // Prepare radar chart data
  const radarData = results?.slice(0, 8).map((area: any) => ({
    dimension: area.dimension.code,
    score: area.dimension.normalizedScore,
    risk: area.probability === 'High' ? 80 : area.probability === 'Medium' ? 50 : 20
  })) || [];

  // Prepare bar chart data
  const prepTimeData = results?.slice(0, 10).map((area: any) => ({
    name: area.dimension.code,
    time: area.prepTimeAllocation,
    probability: area.probability === 'High' ? 3 : area.probability === 'Medium' ? 2 : 1
  })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">A&R Focus Forecast Results</h1>
            <p className="text-blue-100 text-lg mb-4">
              {(run.service as any)?.name}
            </p>
            <div className="flex items-center gap-4 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Generated {formatDateTime(run.created_at)}
              </div>
              <div>•</div>
              <div>{(run.service as any)?.service_type} • {(run.service as any)?.state}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <a href={`/api/pdf?runId=${runId}`} target="_blank">
              <Button size="lg" className="gap-2 bg-white text-blue-600 hover:bg-blue-50">
                <Download className="w-5 h-5" />
                Download PDF
              </Button>
            </a>
            <Link href="/dashboard">
              <Button size="lg" variant="ghost" className="gap-2 bg-blue-700 hover:bg-blue-800 text-white">
                <Home className="w-5 h-5" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Confidence Score with Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Confidence Score
            </CardTitle>
            <CardDescription>Assessment reliability indicator</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-40 h-40 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#0066cc"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - confidenceScore / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-slate-900">{Math.round(confidenceScore)}%</div>
                  </div>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                confidenceScore >= 75 ? 'bg-green-100 text-green-800' :
                confidenceScore >= 50 ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">
                  {confidenceScore >= 75 ? 'High Confidence' :
                   confidenceScore >= 50 ? 'Moderate Confidence' :
                   'Lower Confidence'}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Based on questionnaire completeness and response patterns
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Risk Overview Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Risk Distribution
            </CardTitle>
            <CardDescription>Focus area scores vs probability</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                <Radar name="Score" dataKey="score" stroke="#0066cc" fill="#0066cc" fillOpacity={0.3} />
                <Radar name="Risk" dataKey="risk" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Preparation Time Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recommended Preparation Time Allocation
          </CardTitle>
          <CardDescription>Focus your preparation efforts on these areas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prepTimeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" label={{ value: 'Preparation Time %', position: 'insideBottom', offset: -5 }} />
              <YAxis dataKey="name" type="category" stroke="#64748b" width={80} />
              <Tooltip />
              <Bar dataKey="time" fill="#0066cc" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ranked Focus Areas */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-slate-900">Ranked Focus Areas</h2>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {results && results.map((area: any, index: number) => (
            <Card key={area.rank} className={`border-l-4 ${
              index < 3 ? 'border-l-red-500' :
              index < 6 ? 'border-l-amber-500' :
              'border-l-blue-500'
            } hover:shadow-lg transition-shadow`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  {/* Rank Badge */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${
                    index < 3 ? 'bg-red-100 text-red-700' :
                    index < 6 ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    #{area.rank}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">
                          {area.dimension.code} - {area.dimension.name}
                        </h3>
                        <p className="text-sm text-slate-600">{area.dimension.category}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={
                          area.probability === 'High' ? 'danger' :
                          area.probability === 'Medium' ? 'warning' : 'info'
                        } className="text-base px-4 py-1">
                          {area.probability} Risk
                        </Badge>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{area.prepTimeAllocation}%</div>
                          <div className="text-xs text-slate-500">prep time</div>
                        </div>
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Dimension Score</span>
                        <span className="text-sm font-bold text-slate-900">{Math.round(area.dimension.normalizedScore)}/100</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            area.dimension.normalizedScore >= 70 ? 'bg-green-500' :
                            area.dimension.normalizedScore >= 40 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${area.dimension.normalizedScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Grid Layout for Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Why Flagged */}
                      {area.dimension.contributions && area.dimension.contributions.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Why Flagged
                          </h4>
                          <ul className="space-y-2 text-sm text-slate-700">
                            {area.dimension.contributions.slice(0, 3).map((contrib: any, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold mt-0.5">•</span>
                                <span>{contrib.explanation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Likely Questions */}
                      {area.likelyQuestions && area.likelyQuestions.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            Likely Questions
                          </h4>
                          <ul className="space-y-2 text-sm text-slate-700">
                            {area.likelyQuestions.slice(0, 3).map((question: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold mt-0.5">•</span>
                                <span>{question}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Red Flags */}
                    {area.redFlags && area.redFlags.length > 0 && area.redFlags[0] !== 'No specific red flags identified' && (
                      <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          Critical Red Flags
                        </h4>
                        <ul className="space-y-2 text-sm text-red-800">
                          {area.redFlags.map((flag: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-600 font-bold mt-0.5">⚠</span>
                              <span className="font-medium">{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg mb-2">Important Disclaimer</h3>
              <p className="text-sm text-amber-900 leading-relaxed">
                This report provides a <strong>probability-based forecast only</strong>. It does not 
                guarantee what an Authorised Officer will focus on during an Assessment and Rating visit. 
                Results are based on the responses provided and should be used as a preparation guide only. 
                Always refer to the National Quality Framework and your regulatory authority for 
                authoritative guidance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
