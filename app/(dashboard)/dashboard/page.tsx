'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/helpers';
import { Building2, FileText, TrendingUp, Activity, Clock, BarChart3, ArrowRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0066cc', '#00a3e0', '#00b8d4', '#00c9a7', '#84d963'];

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [scoringRuns, setScoringRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const testUserId = '00000000-0000-0000-0000-000000000001';

      const [profileRes, servicesRes, runsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', testUserId).single(),
        supabase.from('services').select('*').eq('user_id', testUserId).order('created_at', { ascending: false }),
        supabase.from('scoring_runs').select('*, service:services(name)').eq('user_id', testUserId).order('created_at', { ascending: false }).limit(10)
      ]);

      setProfile(profileRes.data);
      setServices(servicesRes.data || []);
      setScoringRuns(runsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-slate-600">Loading...</div></div>;
  }

  const totalServices = services.length;
  const totalAssessments = scoringRuns.length;
  const avgConfidence = scoringRuns.length > 0
    ? Math.round(scoringRuns.reduce((sum, run) => sum + (run.confidence_score || 0), 0) / scoringRuns.length)
    : 0;

  // Chart data
  const confidenceTrend = scoringRuns.slice(0, 6).reverse().map((run, i) => ({
    name: `Run ${i + 1}`,
    confidence: Math.round(run.confidence_score || 0)
  }));

  const serviceTypeData = services.reduce((acc: any[], service) => {
    const existing = acc.find(item => item.name === service.service_type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: service.service_type || 'Unknown', value: 1 });
    }
    return acc;
  }, []);

  const ratingDistribution = services.reduce((acc: any[], service) => {
    if (service.last_rating) {
      const existing = acc.find(item => item.name === service.last_rating);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: service.last_rating, value: 1 });
      }
    }
    return acc;
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Here's your A&R Focus Forecast overview
          </p>
        </div>
        <Link href="/services/new">
          <Button size="lg" className="gap-2">
            <Building2 className="w-5 h-5" />
            Add Service
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{totalServices}</div>
                <div className="text-sm text-blue-100 mt-1">Total Services</div>
              </div>
              <Building2 className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{totalAssessments}</div>
                <div className="text-sm text-emerald-100 mt-1">Assessments</div>
              </div>
              <FileText className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{avgConfidence}%</div>
                <div className="text-sm text-purple-100 mt-1">Avg Confidence</div>
              </div>
              <TrendingUp className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{scoringRuns.length > 0 ? formatDate(scoringRuns[0].created_at).split(',')[0] : 'N/A'}</div>
                <div className="text-sm text-amber-100 mt-1">Last Assessment</div>
              </div>
              <Clock className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Trend */}
        {confidenceTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Confidence Score Trend
              </CardTitle>
              <CardDescription>Your last {confidenceTrend.length} assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={confidenceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="confidence" stroke="#0066cc" strokeWidth={3} dot={{ fill: '#0066cc', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Service Types */}
        {serviceTypeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Services by Type
              </CardTitle>
              <CardDescription>Distribution of your services</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={serviceTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Rating Distribution */}
        {ratingDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Current Ratings
              </CardTitle>
              <CardDescription>Your services' current rating levels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0066cc" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Services Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Your Services
          </h2>
          <Link href="/services">
            <Button variant="ghost" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.slice(0, 6).map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    {service.name}
                  </CardTitle>
                  <CardDescription>
                    {service.service_type} • {service.state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {service.last_rating && (
                    <div className="mb-4">
                      <div className="text-xs text-slate-500 mb-1">Current Rating</div>
                      <Badge variant={
                        service.last_rating === 'Excellent' || service.last_rating === 'Exceeding' ? 'success' :
                        service.last_rating === 'Meeting' ? 'info' :
                        service.last_rating === 'Working Towards' ? 'warning' : 'danger'
                      }>
                        {service.last_rating}
                      </Badge>
                    </div>
                  )}
                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    {service.approved_places && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Approved Places:</span>
                        <span className="font-medium">{service.approved_places}</span>
                      </div>
                    )}
                    {service.last_rating_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Rated:</span>
                        <span className="font-medium">{formatDate(service.last_rating_date)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/questionnaire/${service.id}`} className="flex-1">
                      <Button className="w-full" size="sm">New Assessment</Button>
                    </Link>
                    <Link href={`/services/${service.id}`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="py-16 text-center">
              <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No services yet</h3>
              <p className="text-slate-600 mb-6">Add your first childcare service to get started</p>
              <Link href="/services/new">
                <Button size="lg" className="gap-2">
                  <Building2 className="w-5 h-5" />
                  Add Your First Service
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Assessments */}
      {scoringRuns && scoringRuns.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Recent Assessments
            </h2>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {scoringRuns.slice(0, 5).map((run: any) => (
                  <Link
                    key={run.id}
                    href={`/results/${run.id}`}
                    className="flex items-center justify-between p-5 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {run.service?.name || 'Unknown Service'}
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatDate(run.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {run.confidence_score && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(run.confidence_score)}%
                          </div>
                          <div className="text-xs text-slate-500">Confidence</div>
                        </div>
                      )}
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
