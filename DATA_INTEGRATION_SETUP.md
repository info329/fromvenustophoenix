# ACECQA Data Integration - Setup Guide

## 🎯 Overview

This guide will help you integrate real ACECQA (Australian Children's Education & Care Quality Authority) data into your A&R Focus Forecast application.

## 📋 Prerequisites

1. Supabase project with SERVICE_ROLE_KEY
2. Database schema updated with external data tables
3. ACECQA CSV data file

## 🚀 Setup Steps

### Step 1: Update Database Schema

Run the updated schema to add the new tables:

```bash
# Method 1: Via Supabase SQL Editor
# Copy the contents of scripts/schema.sql and paste into Supabase SQL Editor

# Method 2: Via script (if you have the schema.sql file)
npm run setup-schema
```

This creates these new tables:
- `external_services` - ACECQA service data
- `nqs_snapshots` - Quarterly trend data  
- `benchmarks` - Calculated benchmarks
- Adds `acecqa_id` column to `services` table

### Step 2: Download ACECQA Data

1. Go to https://www.acecqa.gov.au/resources/national-registers
2. Click "Download CSV" for the National Service Register
3. Save the file (usually named `Service.csv`)

Alternatively, try the automated downloader in the import script.

### Step 3: Import ACECQA Data

```bash
# Import from downloaded CSV file
npm run import-acecqa path/to/Service.csv

# Or try automated download (may not work)
npm run import-acecqa
```

This will:
- Import all services from the CSV (~15,000+ services)
- Normalize ratings and service types
- Calculate benchmarks by state and service type
- Create indexes for fast searching

Expected output:
```
✅ Import complete!
   Imported: 15234 services
   Updated: 0 services
   Errors: 0 services

📊 Calculating benchmarks...
✅ Created 448 benchmarks
```

### Step 4: Verify Data Import

Check in Supabase:
```sql
SELECT COUNT(*) FROM external_services;
-- Should show ~15,000+ services

SELECT COUNT(*) FROM benchmarks;
-- Should show ~448 benchmarks

SELECT * FROM external_services LIMIT 5;
-- Should show real service data
```

### Step 5: Enable Authentication

The app currently uses test mode. To enable real authentication:

1. **Remove test user hardcoding** from:
   - `app/(dashboard)/dashboard/page.tsx`
   - `app/(dashboard)/services/page.tsx`
   - `app/(dashboard)/services/new/page.tsx`
   - `app/(dashboard)/services/[id]/page.tsx`
   - `app/(dashboard)/questionnaire/[serviceId]/page.tsx`
   - `app/(dashboard)/results/[runId]/page.tsx`
   - `app/api/scoring/route.ts`
   - `app/api/pdf/route.ts`

2. **Restore authentication checks**:
   ```typescript
   // Replace this:
   const testUserId = '00000000-0000-0000-0000-000000000001';
   
   // With this:
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) redirect('/login');
   const userId = user.id;
   ```

3. **Re-enable RLS policies** on tables:
   ```sql
   ALTER TABLE services ENABLE ROW LEVEL SECURITY;
   ALTER TABLE scoring_runs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
   ```

4. **Create login/signup pages** (removed earlier for testing)

### Step 6: Update Service Creation UI

Modify `app/(dashboard)/services/new/page.tsx` to:

1. Add service search component
2. Let users search ACECQA database
3. Auto-populate fields when they select their service
4. Option to manually enter if not found

See implementation in the updated UI files.

## 📊 Using the Data

### Service Search API

```typescript
// Search for services
const response = await fetch('/api/services/search?q=Sunshine&state=VIC');
const { services } = await response.json();
```

### Get Specific Service

```typescript
// Get service by ACECQA ID
const response = await fetch('/api/services/external/12345');
const { service } = await response.json();
```

### Get Benchmarks

```typescript
// Get benchmarks for NSW LDC services, QA1
const response = await fetch('/api/benchmarks?state=NSW&serviceType=LDC&qa=QA1');
const { benchmarks } = await response.json();
```

## 🔄 Automated Updates

To keep data fresh, set up a cron job or Vercel cron to run:

```bash
npm run import-acecqa path/to/latest/Service.csv
```

Recommended schedule: **Weekly** (ACECQA updates daily, but weekly is sufficient)

### Vercel Cron Setup

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/sync-acecqa",
    "schedule": "0 2 * * 0"
  }]
}
```

Create `/app/api/cron/sync-acecqa/route.ts` to trigger the import.

## 🎨 Next Features

Once data is imported, you can:

1. ✅ Show industry benchmarks on results page
2. ✅ "Services in your area average 7.2/10 for QA1"
3. ✅ Trend analysis: "QA2 focus has increased 15% in last year"
4. ✅ Confidence calibration based on peer data
5. ✅ Analytics dashboard with charts and insights

## 🐛 Troubleshooting

**Import fails with "CSV parse error"**
- Check CSV format matches expected columns
- Ensure file is UTF-8 encoded
- Try opening in Excel and re-saving

**"Permission denied" errors**
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check RLS policies allow admin access
- Ensure your user has 'admin' role in profiles table

**No services found in search**
- Verify data was imported: `SELECT COUNT(*) FROM external_services`
- Check indexes were created
- Try broader search terms

**Benchmarks not calculating**
- Ensure external_services has data
- Check for errors in import log
- Re-run: `npm run import-acecqa path/to/Service.csv`

## 📞 Support

For issues with:
- **ACECQA Data**: Contact ACECQA at https://www.acecqa.gov.au/contact-us
- **This Application**: Check GitHub issues or documentation

## 🔐 Security Notes

- External service data is **public** (already published by ACECQA)
- RLS policies ensure users can only see their own private data
- Benchmark data is read-only for all users
- Admin role required to import/update external data

---

**Last Updated**: December 27, 2025
