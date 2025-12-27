-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users are managed by Supabase Auth (auth.users)
-- We create a profiles table for additional user data

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services (childcare centres)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT')),
  service_type TEXT NOT NULL CHECK (service_type IN ('LDC', 'FDC', 'OSHC', 'Preschool')),
  approved_places INTEGER,
  current_occupancy INTEGER,
  years_operating INTEGER,
  last_rating TEXT CHECK (last_rating IN ('Excellent', 'Exceeding', 'Meeting', 'Working Towards', 'Significant Improvement', 'Not Yet Rated')),
  last_rating_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questionnaire versions
CREATE TABLE questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, version)
);

-- Dimensions (NQS Quality Areas and Elements)
CREATE TABLE dimensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('QA1', 'QA2', 'QA3', 'QA4', 'QA5', 'QA6', 'QA7')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  help_text TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN ('single', 'multi', 'scale', 'text', 'number')),
  display_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  conditional_logic JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answer options for single/multi questions
CREATE TABLE answer_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weights linking answers to dimensions
CREATE TABLE weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer_value TEXT NOT NULL,
  dimension_id UUID REFERENCES dimensions(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rules for conditional score adjustments
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0,
  condition_json JSONB NOT NULL,
  effects_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scoring runs (completed assessments)
CREATE TABLE scoring_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  questionnaire_id UUID REFERENCES questionnaires(id) NOT NULL,
  questionnaire_version INTEGER NOT NULL,
  responses_json JSONB NOT NULL,
  scores_json JSONB NOT NULL,
  explanations_json JSONB NOT NULL,
  confidence_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scoring_run_id UUID REFERENCES scoring_runs(id) ON DELETE CASCADE NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Users can CRUD their own services
CREATE POLICY "Users can view own services" ON services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own services" ON services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own services" ON services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own services" ON services FOR DELETE USING (auth.uid() = user_id);

-- Users can view their own scoring runs
CREATE POLICY "Users can view own runs" ON scoring_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own runs" ON scoring_runs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON reports FOR SELECT 
  USING (EXISTS (SELECT 1 FROM scoring_runs WHERE scoring_runs.id = reports.scoring_run_id AND scoring_runs.user_id = auth.uid()));

-- Public read access for questionnaire data (needed for the form)
CREATE POLICY "Public can read questionnaires" ON questionnaires FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Public can read answer_options" ON answer_options FOR SELECT USING (true);
CREATE POLICY "Public can read dimensions" ON dimensions FOR SELECT USING (true);

-- Admin policies (check role in profiles)
CREATE POLICY "Admins can do anything on questionnaires" ON questionnaires FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can do anything on questions" ON questions FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can do anything on weights" ON weights FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can do anything on rules" ON rules FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ACECQA DATA INTEGRATION TABLES
-- ============================================================================

-- External service data from ACECQA National Registers
CREATE TABLE external_services (
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

-- Link user services to ACECQA data (for auto-population)
ALTER TABLE services ADD COLUMN acecqa_id TEXT REFERENCES external_services(acecqa_id);

-- Indexes for performance
CREATE INDEX idx_external_services_search ON external_services(service_name, suburb, state);
CREATE INDEX idx_external_services_state_type ON external_services(state, service_type);
CREATE INDEX idx_external_services_postcode ON external_services(postcode);
CREATE INDEX idx_nqs_snapshots_lookup ON nqs_snapshots(quarter, state, service_type, quality_area);
CREATE INDEX idx_benchmarks_lookup ON benchmarks(benchmark_type, state, service_type, quality_area);

-- RLS Policies for external data (public read-only)
ALTER TABLE external_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE nqs_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to external_services" ON external_services FOR SELECT USING (true);
CREATE POLICY "Public read access to nqs_snapshots" ON nqs_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read access to benchmarks" ON benchmarks FOR SELECT USING (true);

-- Admin only write access
CREATE POLICY "Admins can insert external_services" ON external_services FOR INSERT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can update external_services" ON external_services FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can insert nqs_snapshots" ON nqs_snapshots FOR INSERT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can insert benchmarks" ON benchmarks FOR INSERT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
