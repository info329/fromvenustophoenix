import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default async function RulesPage() {
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from('rules')
    .select('*')
    .order('priority', { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Rules</h2>

      <div className="space-y-4">
        {rules?.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{rule.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="info">Priority: {rule.priority}</Badge>
                  <Badge variant={rule.is_active ? 'success' : 'default'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {rule.description && (
                <p className="text-sm text-slate-600 mb-4">{rule.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Conditions:</h4>
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(rule.condition_json, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Effects:</h4>
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(rule.effects_json, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
