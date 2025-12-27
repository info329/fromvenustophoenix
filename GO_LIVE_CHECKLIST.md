# 🚀 Going Live with ACECQA Data Integration - Action Plan

## ✅ What's Been Done

### Infrastructure Complete
- ✅ Database schema extended with 3 new tables
- ✅ Import script created (`npm run import-acecqa`)
- ✅ API endpoints built (search, external service, benchmarks)
- ✅ CSV parsing and normalization logic
- ✅ Benchmark calculation algorithm

## 🎯 What's Needed to Go Live

### 1. **Download & Import ACECQA Data** (30 mins)

```bash
# Step 1: Download CSV from ACECQA
# Visit: https://www.acecqa.gov.au/resources/national-registers
# Click "Download" for Service Register CSV

# Step 2: Update database schema in Supabase
# Go to Supabase SQL Editor and run scripts/schema.sql
# (Copy from line 178 onwards - the ACECQA section)

# Step 3: Import the data
npm run import-acecqa ~/Downloads/Service.csv
```

**Expected Result**: ~15,000 services imported, 448 benchmarks calculated

---

### 2. **Restore Authentication** (2-3 hours)

Currently the app uses a hardcoded test user ID. We need to:

#### A. Remove Test Mode (Find & Replace)

Search for: `const testUserId = '00000000-0000-0000-0000-000000000001';`

Replace with proper auth in these files:
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/services/page.tsx`
- `app/(dashboard)/services/new/page.tsx`
- `app/(dashboard)/services/[id]/page.tsx`
- `app/(dashboard)/questionnaire/[serviceId]/page.tsx`
- `app/(dashboard)/results/[runId]/page.tsx`
- `app/api/scoring/route.ts`
- `app/api/pdf/route.ts`

**Replace pattern:**
```typescript
// OLD (Test Mode):
const testUserId = '00000000-0000-0000-0000-000000000001';

// NEW (Real Auth):
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  redirect('/login');
}
const userId = user.id;
```

#### B. Re-enable RLS (Database)

Run in Supabase SQL Editor:
```sql
-- Re-enable RLS on user tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Verify policies exist
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('services', 'scoring_runs', 'reports');
```

#### C. Create Login Pages

Need to create:
- `app/(auth)/login/page.tsx` - Login form
- `app/(auth)/signup/page.tsx` - Signup form  
- `app/(auth)/layout.tsx` - Auth layout

Or use Supabase's built-in auth UI.

#### D. Update Middleware

Enable auth redirect in `middleware.ts`:
```typescript
// Remove the comment that disables auth
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

---

### 3. **Update Service Creation UI** (2-3 hours)

Modify `app/(dashboard)/services/new/page.tsx` to add service search:

#### Features needed:
- **Search box** to find service in ACECQA database
- **Autocomplete dropdown** showing matching services
- **Auto-populate** fields when service selected
- **Manual entry option** if service not found
- Link selected service via `acecqa_id`

#### Component sketch:
```typescript
'use client';
import { useState, useEffect } from 'react';

export default function NewServicePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  // Search ACECQA database
  const searchServices = async (query: string) => {
    const response = await fetch(`/api/services/search?q=${query}&limit=10`);
    const { services } = await response.json();
    setSearchResults(services);
  };

  // Auto-populate form when service selected
  const selectService = (service: any) => {
    setSelectedService(service);
    // Fill form fields from service data
  };

  return (
    <div>
      <h1>Add Service</h1>
      
      {/* Search Box */}
      <div>
        <label>Search for your service</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.length >= 2) {
              searchServices(e.target.value);
            }
          }}
          placeholder="Enter service name, suburb, or postcode"
        />
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <ul>
            {searchResults.map(service => (
              <li key={service.id} onClick={() => selectService(service)}>
                {service.service_name} - {service.suburb}, {service.state}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form (auto-populated if service selected) */}
      <form>
        <input type="text" name="name" defaultValue={selectedService?.service_name} />
        <input type="text" name="state" defaultValue={selectedService?.state} />
        {/* ... other fields ... */}
        <input type="hidden" name="acecqa_id" value={selectedService?.acecqa_id} />
        <button type="submit">Add Service</button>
      </form>
    </div>
  );
}
```

---

### 4. **Integrate Benchmarks into Scoring** (3-4 hours)

Update `lib/scoring/engine.ts` to use real benchmark data:

#### Changes needed:
- Fetch benchmarks for user's state/service type
- Adjust scoring weights based on historical patterns
- Show benchmark comparisons in results
- Add confidence calibration

#### Example integration:
```typescript
// In calculateForecast():

// Fetch benchmarks
const benchmarks = await fetch(`/api/benchmarks?state=${service.state}&serviceType=${service.service_type}`)
  .then(r => r.json());

// Adjust dimension scores based on benchmarks
dimensions.forEach(dim => {
  const benchmark = benchmarks.find(b => b.quality_area === dim.category);
  if (benchmark) {
    // Apply regional adjustment
    const regionalFactor = calculateRegionalFactor(benchmark.metric_value);
    dim.score *= regionalFactor;
  }
});
```

---

### 5. **Add Benchmark Display in Results** (2 hours)

Update `app/(dashboard)/results/[runId]/page.tsx` to show:

- "Your score vs. industry average"
- "Services in [STATE] average X% for [QA]"
- Comparison charts
- Trend insights

#### Example display:
```typescript
<Card>
  <CardHeader>
    <CardTitle>Industry Benchmark</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Services in NSW average 7.2/10 for QA1</p>
    <p>You scored 6.8/10 - 5% below average</p>
    <ProgressBar yourScore={6.8} average={7.2} />
  </CardContent>
</Card>
```

---

### 6. **Test Everything** (2-3 hours)

#### Testing checklist:
- [ ] User can sign up / log in
- [ ] Search finds real ACECQA services
- [ ] Service auto-populates correctly
- [ ] Manual entry still works
- [ ] Assessment runs successfully
- [ ] Results show benchmarks
- [ ] PDF download works
- [ ] RLS prevents users seeing others' data
- [ ] Performance is acceptable (<2s page loads)

---

### 7. **Setup Automated Data Sync** (1 hour)

Create Vercel cron job to update data weekly:

```typescript
// app/api/cron/sync-acecqa/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trigger import script
  // (You'll need to adapt the import script to run as API route)
  
  return NextResponse.json({ success: true });
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-acecqa",
    "schedule": "0 2 * * 0"
  }]
}
```

---

## 📊 Timeline Summary

| Task | Time | Priority |
|------|------|----------|
| Import ACECQA data | 30 mins | 🔴 Critical |
| Restore authentication | 2-3 hours | 🔴 Critical |
| Update service creation UI | 2-3 hours | 🟡 High |
| Integrate benchmarks into scoring | 3-4 hours | 🟡 High |
| Add benchmark displays | 2 hours | 🟢 Medium |
| Testing | 2-3 hours | 🔴 Critical |
| Setup automated sync | 1 hour | 🟢 Medium |

**Total Estimated Time**: 13-17 hours of development work

---

## 🎬 Quick Start (Minimum Viable)

To go live with basic functionality TODAY:

1. **Import ACECQA data** (30 mins) ← Do this first!
2. **Restore auth** (2-3 hours) ← Essential for production
3. **Test** (1 hour) ← Verify nothing broke

That's 3.5-4.5 hours for a working production app with real data.

The other features (service search, benchmarks) can be added incrementally after launch.

---

## 🚨 Current Limitations

**Without completing above steps:**
- ❌ Anyone can access anyone's data (no auth)
- ❌ No real service data (empty external_services table)
- ❌ No benchmarks or comparisons
- ❌ Manual service entry only

**After completing Step 1 & 2 (4 hours):**
- ✅ Proper authentication and data security
- ✅ Real ACECQA service data available
- ✅ Industry benchmarks calculated
- ⚠️ Still manual service entry (but data is there)

**After completing all steps (17 hours):**
- ✅ Full production-ready application
- ✅ Service search and auto-population
- ✅ Benchmark-adjusted scoring
- ✅ Industry comparisons
- ✅ Automated data updates

---

## 📞 Need Help?

**Getting stuck?** Common issues:

1. **"Can't download ACECQA CSV"** → Download manually from their website
2. **"Import script fails"** → Check CSV format and file encoding (should be UTF-8)
3. **"Auth redirect loop"** → Clear cookies, check middleware config
4. **"No benchmarks calculated"** → Ensure external_services has data first

---

## 🎯 Ready to Deploy?

Once Steps 1-6 are complete:

```bash
git add -A
git commit -m "Go live with ACECQA data integration and real auth"
git push origin main
```

Vercel will auto-deploy. Check https://fromvenustophoenix.vercel.app

---

**Last Updated**: December 27, 2025  
**Status**: Infrastructure ready, waiting for data import and auth restoration
