import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/helpers';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get recent scoring runs
  const { data: scoringRuns } = await supabase
    .from('scoring_runs')
    .select('*, service:services(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const totalServices = services?.length || 0;
  const totalAssessments = scoringRuns?.length || 0;
  const avgConfidence = scoringRuns && scoringRuns.length > 0
    ? Math.round(scoringRuns.reduce((sum, run) => sum + (run.confidence_score || 0), 0) / scoringRuns.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your services and assessments from your dashboard.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900">{totalServices}</div>
            <div className="text-sm text-slate-600">Total Services</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900">{totalAssessments}</div>
            <div className="text-sm text-slate-600">Completed Assessments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900">{avgConfidence}%</div>
            <div className="text-sm text-slate-600">Average Confidence</div>
          </CardContent>
        </Card>
      </div>

      {/* Services Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-slate-900">Your Services</h2>
          <Link href="/services/new">
            <Button>Add Service</Button>
          </Link>
        </div>

        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>
                    {service.service_type} • {service.state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {service.last_rating && (
                    <div className="mb-3">
                      <Badge variant={
                        service.last_rating === 'Excellent' || service.last_rating === 'Exceeding' ? 'success' :
                        service.last_rating === 'Meeting' ? 'info' :
                        service.last_rating === 'Working Towards' ? 'warning' : 'danger'
                      }>
                        {service.last_rating}
                      </Badge>
                    </div>
                  )}
                  <div className="space-y-2 text-sm text-slate-600">
                    {service.approved_places && (
                      <div>Approved Places: {service.approved_places}</div>
                    )}
                    {service.last_rating_date && (
                      <div>Last Rating: {formatDate(service.last_rating_date)}</div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
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
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600 mb-4">You haven't added any services yet.</p>
              <Link href="/services/new">
                <Button>Add Your First Service</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Assessments */}
      {scoringRuns && scoringRuns.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Recent Assessments</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {scoringRuns.map((run: any) => (
                  <Link
                    key={run.id}
                    href={`/results/${run.id}`}
                    className="block p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-slate-900">
                          {run.service?.name || 'Unknown Service'}
                        </div>
                        <div className="text-sm text-slate-600">
                          {formatDate(run.created_at)}
                        </div>
                      </div>
                      {run.confidence_score && (
                        <Badge variant="info">
                          {Math.round(run.confidence_score)}% confidence
                        </Badge>
                      )}
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
