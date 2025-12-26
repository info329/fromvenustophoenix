import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/helpers';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Services</h1>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Badge variant="default">{service.service_type}</Badge>
                    <Badge variant="info">{service.state}</Badge>
                  </div>
                  
                  {service.last_rating && (
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Current Rating:</div>
                      <Badge variant={
                        service.last_rating === 'Excellent' || service.last_rating === 'Exceeding' ? 'success' :
                        service.last_rating === 'Meeting' ? 'info' :
                        service.last_rating === 'Working Towards' ? 'warning' : 'danger'
                      }>
                        {service.last_rating}
                      </Badge>
                    </div>
                  )}

                  <div className="text-sm text-slate-600 space-y-1">
                    {service.approved_places && (
                      <div>Approved Places: {service.approved_places}</div>
                    )}
                    {service.years_operating && (
                      <div>Years Operating: {service.years_operating}</div>
                    )}
                    {service.last_rating_date && (
                      <div>Last Rated: {formatDate(service.last_rating_date)}</div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/questionnaire/${service.id}`} className="flex-1">
                      <Button className="w-full" size="sm">New Assessment</Button>
                    </Link>
                    <Link href={`/services/${service.id}`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </div>
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
  );
}
