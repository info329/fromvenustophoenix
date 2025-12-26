import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

export default async function DimensionsPage() {
  const supabase = await createClient();

  const { data: dimensions } = await supabase
    .from('dimensions')
    .select('*')
    .order('code');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Dimensions (Quality Areas)</h2>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dimensions?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.code}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>
                    <Badge variant="info">{d.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{d.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
