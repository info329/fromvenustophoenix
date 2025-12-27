'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/helpers';
import { Building2, Plus, Calendar, Users, MapPin, TrendingUp, FileText } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const supabase = createClient();
      const testUserId = '00000000-0000-0000-0000-000000000001';

      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false });

      setServices(data || []);
      setLoading(false);
    };

    fetchServices();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-slate-600">Loading...</div></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="w-10 h-10 text-blue-600" />
            Your Services
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Manage your childcare services and assessments
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/services/browse">
            <Button variant="secondary" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Browse ACECQA Services
            </Button>
          </Link>
          <Link href="/services/new">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Add Service
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-900">{services.length}</div>
                  <div className="text-sm text-blue-700">Total Services</div>
                </div>
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-900">
                    {services.filter(s => s.last_rating === 'Exceeding' || s.last_rating === 'Excellent').length}
                  </div>
                  <div className="text-sm text-green-700">Exceeding</div>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-900">
                    {services.filter(s => s.last_rating === 'Meeting').length}
                  </div>
                  <div className="text-sm text-purple-700">Meeting NQS</div>
                </div>
                <FileText className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-amber-900">
                    {services.reduce((sum, s) => sum + (s.approved_places || 0), 0)}
                  </div>
                  <div className="text-sm text-amber-700">Total Places</div>
                </div>
                <Users className="w-10 h-10 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {services && services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300">
              <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  {service.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Service Type & State */}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="default" className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {service.service_type}
                    </Badge>
                    <Badge variant="info" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {service.state}
                    </Badge>
                  </div>
                  
                  {/* Rating */}
                  {service.last_rating && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-slate-500 mb-2">CURRENT RATING</div>
                      <Badge variant={
                        service.last_rating === 'Excellent' || service.last_rating === 'Exceeding' ? 'success' :
                        service.last_rating === 'Meeting' ? 'info' :
                        service.last_rating === 'Working Towards' ? 'warning' : 'danger'
                      } className="text-base px-3 py-1">
                        {service.last_rating}
                      </Badge>
                    </div>
                  )}

                  {/* Service Details */}
                  <div className="space-y-2 text-sm">
                    {service.approved_places && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600 flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          Approved Places
                        </span>
                        <span className="font-semibold text-slate-900">{service.approved_places}</span>
                      </div>
                    )}
                    {service.years_operating && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          Years Operating
                        </span>
                        <span className="font-semibold text-slate-900">{service.years_operating}</span>
                      </div>
                    )}
                    {service.last_rating_date && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          Last Rated
                        </span>
                        <span className="font-semibold text-slate-900">{formatDate(service.last_rating_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/questionnaire/${service.id}`} className="flex-1">
                      <Button className="w-full gap-2" size="sm">
                        <FileText className="w-4 h-4" />
                        New Assessment
                      </Button>
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
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="py-20 text-center">
            <Building2 className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No services yet</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Get started by adding your first childcare service to begin running assessments
            </p>
            <Link href="/services/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Add Your First Service
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
