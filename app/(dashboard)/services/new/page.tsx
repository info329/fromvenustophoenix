'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { STATES, SERVICE_TYPES, RATINGS } from '@/lib/constants';

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: '',
    state: '',
    service_type: '',
    approved_places: '',
    current_occupancy: '',
    years_operating: '',
    last_rating: '',
    last_rating_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('services')
        .insert({
          user_id: user.id,
          name: formData.name,
          state: formData.state,
          service_type: formData.service_type,
          approved_places: formData.approved_places ? parseInt(formData.approved_places) : null,
          current_occupancy: formData.current_occupancy ? parseInt(formData.current_occupancy) : null,
          years_operating: formData.years_operating ? parseInt(formData.years_operating) : null,
          last_rating: formData.last_rating || null,
          last_rating_date: formData.last_rating_date || null,
        });

      if (insertError) throw insertError;

      router.push('/services');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Service</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Service Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Little Stars Childcare"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                options={STATES}
              />

              <Select
                label="Service Type"
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                options={SERVICE_TYPES}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Approved Places"
                name="approved_places"
                type="number"
                value={formData.approved_places}
                onChange={handleChange}
                placeholder="e.g., 50"
              />

              <Input
                label="Current Occupancy"
                name="current_occupancy"
                type="number"
                value={formData.current_occupancy}
                onChange={handleChange}
                placeholder="e.g., 45"
              />
            </div>

            <Input
              label="Years Operating"
              name="years_operating"
              type="number"
              value={formData.years_operating}
              onChange={handleChange}
              placeholder="e.g., 5"
            />

            <Select
              label="Last Rating"
              name="last_rating"
              value={formData.last_rating}
              onChange={handleChange}
              options={RATINGS}
            />

            <Input
              label="Last Rating Date"
              name="last_rating_date"
              type="date"
              value={formData.last_rating_date}
              onChange={handleChange}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Service'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/services')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
