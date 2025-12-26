import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

export default async function WeightsPage() {
  const supabase = await createClient();

  const { data: weights } = await supabase
    .from('weights')
    .select('*, dimension:dimensions(code, name)')
    .order('weight', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Weights (Top 100)</h2>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question ID</TableHead>
                <TableHead>Answer Value</TableHead>
                <TableHead>Dimension</TableHead>
                <TableHead>Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weights?.map((w: any) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs">{w.question_id.slice(0, 8)}...</TableCell>
                  <TableCell className="font-medium">{w.answer_value}</TableCell>
                  <TableCell>
                    <Badge variant="info">{w.dimension?.code}</Badge>
                    <span className="ml-2 text-sm text-slate-600">{w.dimension?.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={w.weight > 0 ? 'danger' : 'success'}>
                      {w.weight > 0 ? '+' : ''}{w.weight}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
