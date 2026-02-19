-- ============================================
-- SUPABASE SQL SCHEMA
-- Computational Thinking App - Thesis Research
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Stores student information and experiment group
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  group_type TEXT CHECK (group_type IN ('A', 'B')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. ACTIVITY LOGS TABLE
-- For tracking learning efficiency (Y1, Y2, Y3)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_name TEXT NOT NULL,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_name ON activity_logs(activity_name);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- 3. GAMIFICATION STATS TABLE
-- Tracks XP, Level, and Badges
-- ============================================
CREATE TABLE IF NOT EXISTS gamification_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges_earned TEXT[] DEFAULT '{}',
  achievements JSONB DEFAULT '{}',
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE gamification_stats ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own gamification stats" ON gamification_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own gamification stats" ON gamification_stats
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. EXPERIMENT SESSIONS TABLE
-- Tracks crossover experiment sessions
-- ============================================
CREATE TABLE IF NOT EXISTS experiment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_number INTEGER NOT NULL, -- 1 or 2 for crossover design
  is_gamified BOOLEAN NOT NULL,
  chapter TEXT NOT NULL, -- 'chapter2' or 'chapter7'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  pre_test_score INTEGER,
  post_test_score INTEGER,
  notes TEXT
);

-- Add RLS
ALTER TABLE experiment_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own sessions" ON experiment_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON experiment_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON experiment_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- VIEWS FOR RESEARCH ANALYSIS
-- ============================================

-- View: Learning efficiency summary per user
CREATE OR REPLACE VIEW learning_efficiency_summary AS
SELECT 
  p.id as user_id,
  p.name,
  p.group_type,
  al.activity_name,
  COUNT(al.id) as total_attempts,
  SUM(al.time_spent_seconds) as total_time_seconds,
  AVG(al.time_spent_seconds) as avg_time_seconds,
  MAX(al.score) as best_score,
  SUM(CASE WHEN al.completed THEN 1 ELSE 0 END) as completed_count
FROM profiles p
LEFT JOIN activity_logs al ON p.id = al.user_id
GROUP BY p.id, p.name, p.group_type, al.activity_name;

-- View: Gamified vs Non-Gamified comparison
CREATE OR REPLACE VIEW gamification_comparison AS
SELECT 
  es.is_gamified,
  es.chapter,
  COUNT(DISTINCT es.user_id) as participant_count,
  AVG(es.post_test_score - es.pre_test_score) as avg_score_improvement,
  AVG(EXTRACT(EPOCH FROM (es.ended_at - es.started_at))) as avg_session_duration_seconds
FROM experiment_sessions es
WHERE es.ended_at IS NOT NULL
GROUP BY es.is_gamified, es.chapter;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER gamification_stats_updated_at
  BEFORE UPDATE ON gamification_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Note: Run this after creating a user via Supabase Auth
/*
INSERT INTO profiles (id, name, group_type) VALUES
  ('YOUR_USER_UUID_HERE', 'Siswa Test A', 'A');

INSERT INTO gamification_stats (user_id, total_xp, level, badges_earned) VALUES
  ('YOUR_USER_UUID_HERE', 0, 1, '{}');
*/
