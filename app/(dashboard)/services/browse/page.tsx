'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, MapPin, Star, Phone, Mail, Globe, Search, Filter, X, Users, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ExternalService {
  id: string;
  acecqa_id: string;
  service_name: string;
  provider_name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  service_type: string;
  overall_rating: string | null;
  rating_date: string | null;
  qa1_rating: string | null;
  qa2_rating: string | null;
  qa3_rating: string | null;
  qa4_rating: string | null;
  qa5_rating: string | null;
  qa6_rating: string | null;
  qa7_rating: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  approved_places: number | null;
}

interface UserService {
  id: string;
  name: string;
  state: string;
  service_type: string;
  last_rating: string | null;
}

interface Stats {
  total: number;
  byState: { name: string; value: number }[];
  byType: { name: string; value: number }[];
  byRating: { name: string; value: number }[];
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#8E8E93', '#5856D6', '#AF52DE'];

const RATING_RANKS: Record<string, number> = {
  'Excellent': 5,
  'Exceeding NQS': 4,
  'Meeting NQS': 3,
  'Working Towards NQS': 2,
  'Significant Improvement Required': 1,
  'Not Yet Rated': 0
};

export default function BrowseServicesPage() {
  const [services, setServices] = useState<ExternalService[]>([]);
  const [userServices, setUserServices] = useState<UserService[]>([]);
  const [selectedUserServiceId, setSelectedUserServiceId] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<string>('');
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const supabase = createClient();

  useEffect(() => {
    loadStats();
    loadUserServices();
  }, []);

  useEffect(() => {
    loadServices();
  }, [searchQuery, selectedState, selectedType, selectedRating, page]);

  const loadUserServices = async () => {
    // Try to fetch user services. Assuming RLS allows reading own services.
    // If using the test user ID from previous context:
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const { data } = await supabase
      .from('services')
      .select('id, name, state, service_type, last_rating')
      .eq('user_id', testUserId); // Fallback to test user if needed, or remove .eq for real auth
    
    if (data) {
      setUserServices(data);
    }
  };

  const loadStats = async () => {
    const { data: allServices } = await supabase
      .from('external_services')
      .select('state, service_type, overall_rating');

    if (allServices) {
      const stateMap: Record<string, number> = {};
      const typeMap: Record<string, number> = {};
      const ratingMap: Record<string, number> = {};

      allServices.forEach((s) => {
        if (s.state) stateMap[s.state] = (stateMap[s.state] || 0) + 1;
        if (s.service_type) typeMap[s.service_type] = (typeMap[s.service_type] || 0) + 1;
        if (s.overall_rating) ratingMap[s.overall_rating] = (ratingMap[s.overall_rating] || 0) + 1;
      });

      setStats({
        total: allServices.length,
        byState: Object.entries(stateMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        byType: Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        byRating: Object.entries(ratingMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      });
    }
  };

  const loadServices = async () => {
    setLoading(true);
    let query = supabase.from('external_services').select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.or(`service_name.ilike.%${searchQuery}%,suburb.ilike.%${searchQuery}%,provider_name.ilike.%${searchQuery}%`);
    }

    if (selectedState) {
      query = query.eq('state', selectedState);
    }

    if (selectedType) {
      query = query.eq('service_type', selectedType);
    }

    if (selectedRating) {
      query = query.eq('overall_rating', selectedRating);
    }

    query = query
      .order('service_name')
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (!error && data) {
      setServices(data);
      setTotalCount(count || 0);
    }

    setLoading(false);
  };

  const getRatingColor = (rating: string | null) => {
    if (!rating) return 'default';
    switch (rating) {
      case 'Excellent': return 'primary';
      case 'Exceeding NQS': return 'success';
      case 'Meeting NQS': return 'info';
      case 'Working Towards NQS': return 'warning';
      case 'Significant Improvement Required': return 'danger';
      default: return 'default';
    }
  };

  const selectedUserDetail = useMemo(() => 
    userServices.find(s => s.id === selectedUserServiceId), 
  [selectedUserServiceId, userServices]);

  // Comparison Logic
  const comparisonData = useMemo(() => {
    if (!selectedUserDetail || !stats) return null;

    const myRank = RATING_RANKS[selectedUserDetail.last_rating || 'Not Yet Rated'] || 0;
    
    // Filter stats based on current filters (or all if no filters)
    // Note: The 'stats' object is global. For true dynamic comparison based on filters, 
    // we would need to re-aggregate stats based on the current query. 
    // For this demo, we'll use the global stats but maybe we can filter the 'services' array if it was all loaded?
    // Since we paginate, we can't compute exact filtered stats client-side easily without fetching all.
    // We will use the global stats for "National" comparison.
    
    // Let's do a simple "National" comparison for now using the pre-loaded stats
    const totalRated = stats.byRating.reduce((acc, curr) => acc + curr.value, 0);
    
    let betterThanCount = 0;
    let sameAsCount = 0;
    
    stats.byRating.forEach(r => {
      const rank = RATING_RANKS[r.name] || 0;
      if (rank < myRank) betterThanCount += r.value;
      if (rank === myRank) sameAsCount += r.value;
    });

    const betterThanPercent = Math.round((betterThanCount / totalRated) * 100);
    const topPercent = Math.round(((totalRated - betterThanCount - sameAsCount) / totalRated) * 100);

    return {
      myRank,
      betterThanPercent,
      topPercent,
      sameAsCount
    };
  }, [selectedUserDetail, stats]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header & Comparison Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">National Register</h1>
            <p className="text-gray-500 mt-1">
              Browse and benchmark against {stats?.total.toLocaleString()} Australian services
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-600 pl-2">Compare:</span>
            <div className="w-64">
              <Select 
                value={selectedUserServiceId} 
                onChange={(e) => {
                  setSelectedUserServiceId(e.target.value);
                  // Auto-filter to relevant state/type for better context?
                  // const s = userServices.find(us => us.id === e.target.value);
                  // if (s) { setSelectedState(s.state); setSelectedType(s.service_type); }
                }}
                className="border-0 bg-gray-50 focus:ring-0"
              >
                <option value="">Select your service...</option>
                {userServices.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Comparison Dashboard */}
        {selectedUserDetail && comparisonData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="bg-blue-600 text-white border-none shadow-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-blue-100 font-medium mb-1">Your Rating</p>
                    <h3 className="text-2xl font-bold">{selectedUserDetail.last_rating || 'Not Rated'}</h3>
                    <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
                      <MapPin className="w-4 h-4" /> {selectedUserDetail.state}
                      <span className="opacity-50">|</span>
                      <Building2 className="w-4 h-4" /> {selectedUserDetail.service_type}
                    </div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 font-medium mb-2">National Standing</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">Top {comparisonData.topPercent}%</span>
                  <span className="text-sm text-gray-500">of all services</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Better than</span>
                    <span className="font-medium text-green-600">{comparisonData.betterThanPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${comparisonData.betterThanPercent}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 font-medium mb-2">Quick Actions</p>
                <div className="space-y-2">
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      setSelectedState(selectedUserDetail.state);
                      setSelectedType('');
                      setSelectedRating('');
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2 text-blue-500" />
                    Compare in {selectedUserDetail.state}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      setSelectedState('');
                      setSelectedType(selectedUserDetail.service_type);
                      setSelectedRating('');
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2 text-purple-500" />
                    Compare with {selectedUserDetail.service_type}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Dashboard (Collapsible or Always Visible) */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ratings Chart */}
            <Card className="h-80">
              <CardHeader>
                <CardTitle>Ratings Distribution</CardTitle>
                <CardDescription>National overview</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.byRating}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.byRating.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.name === selectedUserDetail?.last_rating ? '#2563eb' : COLORS[index % COLORS.length]} 
                          opacity={selectedUserDetail && entry.name !== selectedUserDetail.last_rating ? 0.3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Types Chart */}
            <Card className="h-80">
              <CardHeader>
                <CardTitle>Service Types</CardTitle>
                <CardDescription>Provider breakdown</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byType.slice(0, 5)} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#007AFF" radius={[0, 4, 4, 0]} barSize={20}>
                      {stats.byType.slice(0, 5).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.name === selectedUserDetail?.service_type ? '#2563eb' : '#007AFF'}
                          opacity={selectedUserDetail && entry.name !== selectedUserDetail.service_type ? 0.3 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* States Chart */}
            <Card className="h-80">
              <CardHeader>
                <CardTitle>Services by State</CardTitle>
                <CardDescription>Geographic spread</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byState}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#34C759" radius={[4, 4, 0, 0]}>
                      {stats.byState.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.name === selectedUserDetail?.state ? '#2563eb' : '#34C759'}
                          opacity={selectedUserDetail && entry.name !== selectedUserDetail.state ? 0.3 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search & Filters */}
        <Card className="sticky top-4 z-30 shadow-lg shadow-gray-200/50 backdrop-blur-xl bg-white/90 border-white/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, suburb, or provider..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              
              <div className="md:col-span-2">
                <Select
                  value={selectedState}
                  onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
                >
                  <option value="">All States</option>
                  {stats?.byState.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </Select>
              </div>

              <div className="md:col-span-3">
                <Select
                  value={selectedType}
                  onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                >
                  <option value="">All Service Types</option>
                  {stats?.byType.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </Select>
              </div>

              <div className="md:col-span-2">
                <Select
                  value={selectedRating}
                  onChange={(e) => { setSelectedRating(e.target.value); setPage(1); }}
                >
                  <option value="">All Ratings</option>
                  {stats?.byRating.map((r) => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || selectedState || selectedType || selectedRating) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Filters:</span>
                {searchQuery && <Badge variant="default" className="pl-2">"{searchQuery}" <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSearchQuery('')} /></Badge>}
                {selectedState && <Badge variant="default" className="pl-2">{selectedState} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedState('')} /></Badge>}
                {selectedType && <Badge variant="default" className="pl-2">{selectedType} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedType('')} /></Badge>}
                {selectedRating && <Badge variant="default" className="pl-2">{selectedRating} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedRating('')} /></Badge>}
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedState(''); setSelectedType(''); setSelectedRating(''); }}
                  className="text-xs text-red-500 hover:text-red-600 font-medium ml-auto"
                >
                  Clear All
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500 px-1">
            <span>Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()} results</span>
            <span>Page {page} of {totalPages}</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32">
                    <div className="w-full h-full bg-gray-100 rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {service.service_name}
                          </h3>
                          {service.overall_rating && (
                            <Badge variant={getRatingColor(service.overall_rating) as any}>
                              {service.overall_rating}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-500 text-sm mb-3">{service.provider_name}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {service.suburb}, {service.state}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {service.service_type}
                          </div>
                          {service.approved_places && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-gray-400" />
                              {service.approved_places} places
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6, 7].map((qa) => {
                            const rating = service[`qa${qa}_rating` as keyof ExternalService] as string;
                            let colorClass = 'bg-gray-100 text-gray-400';
                            if (rating === 'Exceeding NQS') colorClass = 'bg-green-100 text-green-700';
                            if (rating === 'Meeting NQS') colorClass = 'bg-blue-100 text-blue-700';
                            if (rating === 'Working Towards NQS') colorClass = 'bg-amber-100 text-amber-700';
                            
                            return (
                              <div key={qa} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${colorClass}`} title={`QA${qa}: ${rating}`}>
                                {qa}
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-400">
                          Rated: {service.rating_date ? new Date(service.rating_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center gap-2 pt-8">
            <Button
              variant="secondary"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
