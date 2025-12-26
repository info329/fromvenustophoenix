import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function AdminPage() {
  const supabase = await createClient();

  // Get counts
  const [
    { count: questionnairesCount },
    { count: questionsCount },
    { count: dimensionsCount },
    { count: weightsCount },
    { count: rulesCount },
    { count: usersCount },
    { count: servicesCount },
    { count: runsCount }
  ] = await Promise.all([
    supabase.from('questionnaires').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('dimensions').select('*', { count: 'exact', head: true }),
    supabase.from('weights').select('*', { count: 'exact', head: true }),
    supabase.from('rules').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('scoring_runs').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questionnaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{questionnairesCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{questionsCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dimensions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{dimensionsCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{weightsCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{rulesCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{usersCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{servicesCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scoring Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{runsCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Admin Notes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use the sidebar to navigate to different management sections</li>
            <li>• Make sure to run the seed script to populate initial data</li>
            <li>• Always backup data before making significant changes</li>
            <li>• Test scoring engine after modifying weights or rules</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
