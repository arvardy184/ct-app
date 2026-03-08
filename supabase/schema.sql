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
  class_name TEXT,
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
-- 5. QUESTIONS TABLE
-- Pretest & Post-test multiple choice questions
-- Managed by admin, read-only for students/mobile
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  -- options stored as JSONB array: [{label: 'A', text: '...'}, ...]
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL, -- 'A', 'B', 'C', or 'D'
  type TEXT CHECK (type IN ('pretest', 'posttest')) NOT NULL,
  chapter TEXT CHECK (chapter IN ('chapter2', 'chapter7')) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- All authenticated users (students + mobile) can READ
CREATE POLICY "Authenticated users can read questions" ON questions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admin can INSERT / UPDATE / DELETE
CREATE POLICY "Admin can insert questions" ON questions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');

CREATE POLICY "Admin can update questions" ON questions
  FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

CREATE POLICY "Admin can delete questions" ON questions
  FOR DELETE USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Trigger for updated_at
CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for efficient filtering
CREATE INDEX idx_questions_type_chapter ON questions(type, chapter);
CREATE INDEX idx_questions_order ON questions(chapter, type, order_index);

-- ============================================
-- 6. TEST RESULTS TABLE
-- Stores pretest & posttest scores per student
-- ============================================
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter TEXT CHECK (chapter IN ('chapter2', 'chapter7')) NOT NULL,
  type TEXT CHECK (type IN ('pretest', 'posttest')) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,    -- jumlah jawaban benar
  total INTEGER NOT NULL DEFAULT 0,    -- total soal
  answers JSONB DEFAULT '{}',          -- {question_id: 'A'|'B'|'C'|'D'}
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Students can insert and view their own results
CREATE POLICY "Users can insert own test results" ON test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own test results" ON test_results
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can read all
CREATE POLICY "Admin can read all test results" ON test_results
  FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Index for fast lookup
CREATE INDEX idx_test_results_user_chapter ON test_results(user_id, chapter, type);

-- ============================================
-- 7. ADMIN READ-ALL POLICIES
-- Allows admin@gmail.com to read all rows
-- Run this in Supabase SQL Editor
-- ============================================

CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'admin@gmail.com'
  );

CREATE POLICY "Admin can read all activity logs" ON activity_logs
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'admin@gmail.com'
  );

CREATE POLICY "Admin can read all gamification stats" ON gamification_stats
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'admin@gmail.com'
  );

CREATE POLICY "Admin can read all experiment sessions" ON experiment_sessions
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'admin@gmail.com'
  );

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
-- 8. QUESTIONNAIRES TABLE (RIMMS 12 Items)
-- Based on ARCS model: Attention, Relevance, Confidence, Satisfaction
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter TEXT CHECK (chapter IN ('chapter2', 'chapter7')) NOT NULL,
  item_1 INTEGER CHECK (item_1 >= 1 AND item_1 <= 5),
  item_2 INTEGER CHECK (item_2 >= 1 AND item_2 <= 5),
  item_3 INTEGER CHECK (item_3 >= 1 AND item_3 <= 5),
  item_4 INTEGER CHECK (item_4 >= 1 AND item_4 <= 5),
  item_5 INTEGER CHECK (item_5 >= 1 AND item_5 <= 5),
  item_6 INTEGER CHECK (item_6 >= 1 AND item_6 <= 5),
  item_7 INTEGER CHECK (item_7 >= 1 AND item_7 <= 5),
  item_8 INTEGER CHECK (item_8 >= 1 AND item_8 <= 5),
  item_9 INTEGER CHECK (item_9 >= 1 AND item_9 <= 5),
  item_10 INTEGER CHECK (item_10 >= 1 AND item_10 <= 5),
  item_11 INTEGER CHECK (item_11 >= 1 AND item_11 <= 5),
  item_12 INTEGER CHECK (item_12 >= 1 AND item_12 <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own questionnaire" ON questionnaires
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own questionnaire" ON questionnaires
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all questionnaires" ON questionnaires
  FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

CREATE INDEX idx_questionnaires_user ON questionnaires(user_id, chapter);

-- ============================================
-- 9. USER PROGRESS TABLE
-- Tracks level locking/unlocking per chapter
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('locked', 'unlocked', 'completed')) DEFAULT 'locked',
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all progress" ON user_progress
  FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@gmail.com');

CREATE INDEX idx_user_progress_user ON user_progress(user_id);

-- Trigger for updated_at
CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON user_progress
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
