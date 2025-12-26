import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function QuestionnairesPage() {
  const supabase = await createClient();

  const { data: questionnaires } = await supabase
    .from('questionnaires')
    .select('*')
    .order('version', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-slate-900">Questionnaires</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionnaires?.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.name}</TableCell>
                  <TableCell>v{q.version}</TableCell>
                  <TableCell>
                    <Badge variant={q.is_active ? 'success' : 'default'}>
                      {q.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
