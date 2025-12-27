# Data Integration Plan - Australian Childcare A&R Data

## Overview
Integration of real Australian childcare Assessment & Rating data from official government sources to enhance the A&R Focus Forecast tool with actual historical data and benchmarks.

## Primary Data Sources

### 1. ACECQA National Registers (Daily Updates)
**URL:** https://www.acecqa.gov.au/resources/national-registers

**Available Data:**
- Service name, address, contact details
- Provider information
- Quality ratings for all 7 QAs (QA1-QA7)
- Overall NQS rating (Excellent, Exceeding, Meeting, Working Towards, etc.)
- Service type (LDC, FDC, OSHC, Preschool)
- State/territory
- Rating date
- **Format:** CSV export (updated daily)

**Use Cases:**
- Pre-populate service details when users add their service
- Show benchmark data (e.g., "75% of similar services in NSW received Meeting or above for QA1")
- Display rating distribution charts
- Validate service information

### 2. NQS Snapshot Data (Aggregate Statistics)
**URL:** https://www.acecqa.gov.au/resources/snapshot-and-reports/nqf-snapshots

**Available Data:**
- Historical trend data (Q3 2013 – Q3 2025)
- Breakdown by QA ratings
- State/territory comparisons
- Service type comparisons
- **Format:** Excel/CSV quarterly reports

**Use Cases:**
- Show trend analysis: "QA1 focus has increased 15% over last 2 years"
- Provide context: "In Victoria, 42% of services were rated Exceeding in QA3"
- Historical patterns to inform probability calculations
- Industry benchmarks for confidence scoring

### 3. Government Data Catalogue
**URL:** https://catalogue.data.infrastructure.gov.au

**Available Data:**
- Machine-readable datasets (CSV format)
- Complete national registers
- Bulk download capability

**Use Cases:**
- Initial bulk data import
- Periodic full refresh
- Data validation and deduplication

## Implementation Phases

### Phase 1: Data Import & Storage (Immediate)
**Goal:** Set up infrastructure to fetch and store external data

**Tasks:**
1. Create database schema for external service data
   - `external_services` table (ACECQA data)
   - `nqs_snapshots` table (trend data)
   - `benchmarks` table (calculated statistics)

2. Build CSV import scripts
   - Download latest ACECQA registers
   - Parse and normalize data
   - Import to database with deduplication

3. Schedule automated updates
   - Daily sync for service registers
   - Quarterly sync for NQS snapshots
   - Cron job or Vercel scheduled function

### Phase 2: Service Lookup & Pre-fill (Week 1-2)
**Goal:** Let users search and select their service from official data

**Features:**
1. **Service Search**
   - Search by name, suburb, postcode
   - Autocomplete dropdown
   - Display current rating and details

2. **Auto-populate Service Details**
   - When user selects their service
   - Pre-fill: name, state, type, current rating, rating date
   - Reduce data entry burden

3. **Rating History**
   - Show previous A&R outcomes for their service
   - "Your service was last rated [Meeting] on [15/06/2024]"

### Phase 3: Benchmarking & Context (Week 2-3)
**Goal:** Provide comparative context using aggregate data

**Features:**
1. **Industry Benchmarks**
   - "In NSW, 68% of LDC services are rated Meeting or above for QA1"
   - "Your state has 12% higher focus on QA2 compared to national average"
   - Filter by state, service type, rating level

2. **Peer Comparison**
   - "Similar services in your area scored average of 7.2/10 for QA3"
   - Anonymous aggregated data
   - Confidence calibration based on peer performance

3. **Trend Insights**
   - "QA4 focus has increased 23% in the last 12 months"
   - "Services rated Working Towards see 2x more focus on QA5"
   - Historical pattern analysis

### Phase 4: Enhanced Scoring Algorithm (Week 3-4)
**Goal:** Use real data to improve prediction accuracy

**Enhancements:**
1. **Historical Pattern Weights**
   - Adjust scoring based on actual A&R outcomes
   - "Services with your profile historically see 35% focus on QA1"
   - Machine learning on historical patterns

2. **Regional Adjustments**
   - Different states have different focus patterns
   - Incorporate state-specific trends
   - Regulatory authority differences

3. **Temporal Factors**
   - Recent policy changes affect focus areas
   - Seasonal variations (if any)
   - Compliance campaign impacts

### Phase 5: Analytics Dashboard (Week 4-5)
**Goal:** Visualize data insights for users

**Features:**
1. **Industry Dashboard**
   - Interactive charts (Chart.js or Recharts)
   - Rating distribution by QA
   - State comparisons
   - Trend graphs over time

2. **Service Profile**
   - Compare user's service to benchmarks
   - Show where they stand vs peers
   - Gap analysis visualization

3. **Forecast Confidence**
   - Show data sources used
   - "This forecast is based on analysis of 4,523 similar services"
   - Confidence intervals with data backing

## Technical Implementation

### Database Schema Additions

```sql
-- External service data from ACECQA
CREATE TABLE external_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acecqa_id TEXT UNIQUE,
  service_name TEXT NOT NULL,
  address TEXT,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  service_type TEXT,
  provider_name TEXT,
  overall_rating TEXT,
  rating_date DATE,
  qa1_rating TEXT,
  qa2_rating TEXT,
  qa3_rating TEXT,
  qa4_rating TEXT,
  qa5_rating TEXT,
  qa6_rating TEXT,
  qa7_rating TEXT,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NQS snapshot/trend data
CREATE TABLE nqs_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quarter TEXT NOT NULL, -- e.g., "Q3 2025"
  state TEXT,
  service_type TEXT,
  quality_area TEXT, -- QA1-QA7
  rating_level TEXT, -- Excellent, Exceeding, Meeting, etc.
  count INTEGER,
  percentage DECIMAL(5,2),
  data_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quarter, state, service_type, quality_area, rating_level)
);

-- Calculated benchmarks for quick lookup
CREATE TABLE benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benchmark_type TEXT NOT NULL, -- 'state_qa', 'service_type_qa', 'overall'
  state TEXT,
  service_type TEXT,
  quality_area TEXT,
  metric_name TEXT, -- 'avg_score', 'focus_probability', 'rating_distribution'
  metric_value JSONB,
  calculation_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_external_services_search ON external_services(service_name, suburb, state);
CREATE INDEX idx_external_services_state_type ON external_services(state, service_type);
CREATE INDEX idx_nqs_snapshots_lookup ON nqs_snapshots(quarter, state, service_type, quality_area);
CREATE INDEX idx_benchmarks_lookup ON benchmarks(benchmark_type, state, service_type, quality_area);
```

### API Endpoints

```typescript
// GET /api/services/search?q=sunshine&state=VIC
// Search ACECQA services by name, suburb, or postcode

// GET /api/services/external/:acecqaId
// Get full details of an external service

// GET /api/benchmarks?state=NSW&serviceType=LDC&qa=QA1
// Get benchmark data for comparison

// GET /api/trends?period=2y&qa=QA1
// Get trend data for a quality area

// POST /api/admin/sync-data
// Trigger manual data sync (admin only)
```

### Data Sync Scripts

```typescript
// scripts/sync-acecqa-data.ts
// Download and import ACECQA CSV files

// scripts/sync-nqs-snapshots.ts
// Import quarterly NQS snapshot data

// scripts/calculate-benchmarks.ts
// Calculate aggregated benchmarks from raw data
```

## Data Privacy & Compliance

### What We Store
✅ **Public data only** (already published by ACECQA)
✅ **Service-level aggregates** (not individual assessor notes)
✅ **Anonymous benchmarks** (no personally identifiable information)

### What We DON'T Store
❌ Individual assessor observations
❌ Non-public compliance issues
❌ Personal information about staff or families
❌ Proprietary service information

### User Data Separation
- External benchmark data is separate from user's private responses
- User's questionnaire answers are never shared or aggregated
- Clear disclosure about data sources

## Benefits to Users

1. **Reduced Data Entry**
   - Select service from list vs manual typing
   - Auto-fill reduces errors

2. **Better Context**
   - "You're in the top 25% for QA3 in your state"
   - Understand how they compare

3. **More Accurate Forecasts**
   - Based on real historical patterns
   - Region and service-type specific

4. **Industry Insights**
   - See what's trending in A&R focus
   - Stay ahead of changes

5. **Confidence Building**
   - Data-backed predictions
   - Transparency about sources

## Implementation Timeline

- **Week 1:** Database schema + initial import scripts
- **Week 2:** Service search & lookup feature
- **Week 3:** Benchmarking integration into scoring
- **Week 4:** Analytics dashboard
- **Week 5:** Automated sync + monitoring

## Next Steps

1. ✅ Document data sources (this file)
2. ⏳ Create database schema for external data
3. ⏳ Build CSV import script for ACECQA data
4. ⏳ Add service search API endpoint
5. ⏳ Update UI to allow service selection from ACECQA data
6. ⏳ Integrate benchmarks into scoring algorithm
7. ⏳ Build analytics dashboard
8. ⏳ Set up automated data sync

## Resources

- [ACECQA Data Access](https://www.acecqa.gov.au/resources/national-registers)
- [NQS Snapshots](https://www.acecqa.gov.au/resources/snapshot-and-reports/nqf-snapshots)
- [Government Data Catalogue](https://catalogue.data.infrastructure.gov.au)
