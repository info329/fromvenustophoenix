-- ============================================================================
-- ACECQA DATA INTEGRATION TABLES
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cqnjetagvxkbzobwdmjl/sql
-- ============================================================================

-- External service data from ACECQA National Registers
CREATE TABLE IF NOT EXISTS external_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acecqa_id TEXT UNIQUE,
  service_name TEXT NOT NULL,
  provider_name TEXT,
  address TEXT,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  service_type TEXT,
  overall_rating TEXT,
  rating_date DATE,
  qa1_rating TEXT,
  qa2_rating TEXT,
  qa3_rating TEXT,
  qa4_rating TEXT,
  qa5_rating TEXT,
  qa6_rating TEXT,
  qa7_rating TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  approved_places INTEGER,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NQS snapshot/trend data (quarterly aggregates)
CREATE TABLE IF NOT EXISTS nqs_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quarter TEXT NOT NULL,
  state TEXT,
  service_type TEXT,
  quality_area TEXT,
  rating_level TEXT,
  count INTEGER,
  percentage DECIMAL(5,2),
  data_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quarter, state, service_type, quality_area, rating_level)
);

-- Calculated benchmarks for quick lookup
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benchmark_type TEXT NOT NULL,
  state TEXT,
  service_type TEXT,
  quality_area TEXT,
  metric_name TEXT,
  metric_value JSONB,
  calculation_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link user services to ACECQA data (for auto-population)
ALTER TABLE services ADD COLUMN IF NOT EXISTS acecqa_id TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_services_search ON external_services(service_name, suburb, state);
CREATE INDEX IF NOT EXISTS idx_external_services_state_type ON external_services(state, service_type);
CREATE INDEX IF NOT EXISTS idx_external_services_postcode ON external_services(postcode);
CREATE INDEX IF NOT EXISTS idx_nqs_snapshots_lookup ON nqs_snapshots(quarter, state, service_type, quality_area);
CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON benchmarks(benchmark_type, state, service_type, quality_area);

-- RLS Policies for external data (public read-only)
ALTER TABLE external_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE nqs_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to external_services" ON external_services;
CREATE POLICY "Public read access to external_services" ON external_services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access to nqs_snapshots" ON nqs_snapshots;
CREATE POLICY "Public read access to nqs_snapshots" ON nqs_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access to benchmarks" ON benchmarks;
CREATE POLICY "Public read access to benchmarks" ON benchmarks FOR SELECT USING (true);

-- Admin write access (temporarily disable for import)
DROP POLICY IF EXISTS "Admins can insert external_services" ON external_services;
DROP POLICY IF EXISTS "Admins can update external_services" ON external_services;
DROP POLICY IF EXISTS "Admins can insert nqs_snapshots" ON nqs_snapshots;
DROP POLICY IF EXISTS "Admins can insert benchmarks" ON benchmarks;

-- Allow service role to insert (for import script)
DROP POLICY IF EXISTS "Service role can insert external_services" ON external_services;
CREATE POLICY "Service role can insert external_services" ON external_services
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role can insert nqs_snapshots" ON nqs_snapshots;
CREATE POLICY "Service role can insert nqs_snapshots" ON nqs_snapshots
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role can insert benchmarks" ON benchmarks;
CREATE POLICY "Service role can insert benchmarks" ON benchmarks
  FOR ALL USING (true);

-- Verify tables created
SELECT 'external_services' as table_name, COUNT(*) as row_count FROM external_services
UNION ALL
SELECT 'nqs_snapshots', COUNT(*) FROM nqs_snapshots
UNION ALL
SELECT 'benchmarks', COUNT(*) FROM benchmarks;
