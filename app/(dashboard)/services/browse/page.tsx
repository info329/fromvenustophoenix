'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, MapPin, Star, Phone, Mail, Globe, Users, Filter, Search, TrendingUp } from 'lucide-react';
import Link from 'next/link';

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

interface Stats {
  total: number;
  byState: Record<string, number>;
  byType: Record<string, number>;
  byRating: Record<string, number>;
}

export default function BrowseServicesPage() {
  const [services, setServices] = useState<ExternalService[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadServices();
  }, [searchQuery, selectedState, selectedType, selectedRating, page]);

  const loadStats = async () => {
    const { data: allServices } = await supabase
      .from('external_services')
      .select('state, service_type, overall_rating');

    if (allServices) {
      const byState: Record<string, number> = {};
      const byType: Record<string, number> = {};
      const byRating: Record<string, number> = {};

      allServices.forEach((s) => {
        if (s.state) byState[s.state] = (byState[s.state] || 0) + 1;
        if (s.service_type) byType[s.service_type] = (byType[s.service_type] || 0) + 1;
        if (s.overall_rating) byRating[s.overall_rating] = (byRating[s.overall_rating] || 0) + 1;
      });

      setStats({
        total: allServices.length,
        byState,
        byType,
        byRating,
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
    if (!rating) return 'bg-gray-100 text-gray-600';
    switch (rating) {
      case 'Exceeding NQS':
        return 'bg-green-100 text-green-700';
      case 'Meeting NQS':
        return 'bg-blue-100 text-blue-700';
      case 'Working Towards NQS':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ACECQA National Registers
          </h1>
          <p className="text-gray-600">
            Browse and search {stats?.total.toLocaleString()} approved childcare services across Australia
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.total.toLocaleString()}</div>
              <div className="text-cyan-100 text-sm">Total Services</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-8 h-8 text-cyan-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{Object.keys(stats.byState).length}</div>
              <div className="text-gray-600 text-sm">States & Territories</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8 text-cyan-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.byRating['Exceeding NQS'] || 0}</div>
              <div className="text-gray-600 text-sm">Exceeding NQS</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-cyan-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{Object.keys(stats.byType).length}</div>
              <div className="text-gray-600 text-sm">Service Types</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">All States</option>
              {stats && Object.keys(stats.byState).sort().map((state) => (
                <option key={state} value={state}>
                  {state} ({stats.byState[state]})
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {stats && Object.keys(stats.byType).sort().map((type) => (
                <option key={type} value={type}>
                  {type} ({stats.byType[type]})
                </option>
              ))}
            </select>

            {/* Rating Filter */}
            <select
              value={selectedRating}
              onChange={(e) => {
                setSelectedRating(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">All Ratings</option>
              {stats && Object.keys(stats.byRating).sort().reverse().map((rating) => (
                <option key={rating} value={rating}>
                  {rating} ({stats.byRating[rating]})
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedState || selectedType || selectedRating) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">
                  "{searchQuery}"
                </span>
              )}
              {selectedState && (
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">
                  {selectedState}
                </span>
              )}
              {selectedType && (
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">
                  {selectedType}
                </span>
              )}
              {selectedRating && (
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">
                  {selectedRating}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedState('');
                  setSelectedType('');
                  setSelectedRating('');
                  setPage(1);
                }}
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()} services
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow border border-gray-100">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No services found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 mb-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow border border-gray-100 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {service.service_name}
                    </h3>
                    <p className="text-gray-600 mb-2">{service.provider_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {service.address}, {service.suburb} {service.state} {service.postcode}
                      </span>
                    </div>
                  </div>
                  {service.overall_rating && (
                    <span className={`px-4 py-2 rounded-lg font-medium text-sm ${getRatingColor(service.overall_rating)}`}>
                      {service.overall_rating}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Service Type</p>
                    <p className="font-medium text-gray-900">{service.service_type}</p>
                  </div>
                  {service.approved_places && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Approved Places</p>
                      <p className="font-medium text-gray-900">{service.approved_places}</p>
                    </div>
                  )}
                  {service.rating_date && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Rating Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(service.rating_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ACECQA ID</p>
                    <p className="font-mono text-sm text-gray-900">{service.acecqa_id}</p>
                  </div>
                </div>

                {/* Quality Areas */}
                {service.overall_rating && (
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Quality Area Ratings</p>
                    <div className="grid grid-cols-7 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((qa) => {
                        const rating = service[`qa${qa}_rating` as keyof ExternalService] as string | null;
                        return (
                          <div key={qa} className="text-center">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(rating)}`}>
                              QA{qa}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {service.phone && (
                    <a href={`tel:${service.phone}`} className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700">
                      <Phone className="w-4 h-4" />
                      {service.phone}
                    </a>
                  )}
                  {service.email && (
                    <a href={`mailto:${service.email}`} className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700">
                      <Mail className="w-4 h-4" />
                      {service.email}
                    </a>
                  )}
                  {service.website && (
                    <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700">
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
