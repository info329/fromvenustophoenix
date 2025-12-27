-- ============================================================================
-- Fix RLS policies for ACECQA data import
-- Service role should be able to insert/update without restrictions
-- ============================================================================

-- Temporarily disable RLS for import (we'll re-enable with proper policies after)
ALTER TABLE external_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE nqs_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE benchmarks DISABLE ROW LEVEL SECURITY;

-- Verify current state
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('external_services', 'nqs_snapshots', 'benchmarks');
