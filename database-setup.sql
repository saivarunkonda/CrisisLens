-- CrisisLens Database Setup - Run this in Supabase SQL Editor

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  population INTEGER NOT NULL DEFAULT 0,
  area_km2 FLOAT NOT NULL DEFAULT 0,
  center_lat FLOAT NOT NULL,
  center_lng FLOAT NOT NULL,
  infrastructure_score FLOAT NOT NULL DEFAULT 0.5 CHECK (infrastructure_score BETWEEN 0 AND 1),
  emergency_resources JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create incident_reports table
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('flood', 'heat', 'health', 'supply', 'infrastructure', 'security')),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  location_address TEXT,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'investigating', 'false_alarm')),
  affected_people INTEGER DEFAULT 0,
  estimated_damage DECIMAL(10,2),
  images TEXT[],
  sources JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  flood_risk FLOAT NOT NULL CHECK (flood_risk BETWEEN 0 AND 100),
  heat_risk FLOAT NOT NULL CHECK (heat_risk BETWEEN 0 AND 100),
  health_risk FLOAT NOT NULL CHECK (health_risk BETWEEN 0 AND 100),
  supply_risk FLOAT NOT NULL CHECK (supply_risk BETWEEN 0 AND 100),
  infrastructure_risk FLOAT NOT NULL CHECK (infrastructure_risk BETWEEN 0 AND 100),
  security_risk FLOAT NOT NULL CHECK (security_risk BETWEEN 0 AND 100),
  overall_risk FLOAT NOT NULL CHECK (overall_risk BETWEEN 0 AND 100),
  confidence_score FLOAT NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  features JSONB NOT NULL DEFAULT '{}',
  feature_importance JSONB DEFAULT '{}',
  prediction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('risk_alert', 'incident_report', 'system_update', 'emergency')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Regions are viewable by everyone" ON regions FOR SELECT USING (true);
CREATE POLICY "Regions are insertable by authenticated users" ON regions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Regions are updatable by authenticated users" ON regions FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Incident reports are viewable by everyone" ON incident_reports FOR SELECT USING (true);
CREATE POLICY "Incident reports are insertable by authenticated users" ON incident_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Incident reports are updatable by authenticated users" ON incident_reports FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Risk assessments are viewable by everyone" ON risk_assessments FOR SELECT USING (true);
CREATE POLICY "Risk assessments are manageable by authenticated users" ON risk_assessments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity logs" ON user_activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity logs" ON user_activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert initial regions data
INSERT INTO regions (name, code, description, population, area_km2, center_lat, center_lng, infrastructure_score, emergency_resources) VALUES
('North District', 'ND', 'Northern metropolitan area with mixed residential and commercial zones', 250000, 120.5, 40.7128, -74.0060, 0.75, '{"hospitals": 3, "fire_stations": 5, "police_stations": 4, "shelters": 2}'),
('South District', 'SD', 'Southern industrial and logistics hub', 180000, 95.3, 40.7580, -73.9855, 0.65, '{"hospitals": 2, "fire_stations": 4, "police_stations": 3, "shelters": 3}'),
('East District', 'ED', 'Eastern residential area with educational institutions', 320000, 150.8, 40.7489, -73.9680, 0.80, '{"hospitals": 4, "fire_stations": 6, "police_stations": 5, "shelters": 4}'),
('West District', 'WD', 'Western suburban area with parks and recreation', 150000, 85.2, 40.7831, -73.9712, 0.70, '{"hospitals": 2, "fire_stations": 3, "police_stations": 3, "shelters": 2}'),
('Central District', 'CD', 'Central business district and government center', 200000, 45.7, 40.7614, -73.9776, 0.90, '{"hospitals": 5, "fire_stations": 8, "police_stations": 6, "shelters": 5}')
ON CONFLICT (name) DO NOTHING;
