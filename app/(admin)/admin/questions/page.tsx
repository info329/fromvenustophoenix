import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default async function QuestionsPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from('questions')
    .select('*, questionnaire:questionnaires(name)')
    .order('display_order');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Questions</h2>

      <div className="space-y-4">
        {questions?.map((q: any) => (
          <Card key={q.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">#{q.display_order}</Badge>
                  <Badge variant={q.question_type === 'single' ? 'info' : 
                                 q.question_type === 'multi' ? 'success' : 'warning'}>
                    {q.question_type}
                  </Badge>
                </div>
                {q.is_required && <Badge variant="danger">Required</Badge>}
              </div>
              <p className="font-medium text-slate-900">{q.text}</p>
              {q.help_text && (
                <p className="text-sm text-slate-600 mt-1">{q.help_text}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Questionnaire: {q.questionnaire?.name || 'Unknown'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
