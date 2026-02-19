import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// TODO: Replace with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===== Database Functions =====

// Log activity for research tracking
export async function logActivity(
    userId: string,
    activityName: string,
    timeSpentSeconds: number,
    attemptCount: number
) {
    const { data, error } = await supabase
        .from('activity_logs')
        .insert({
            user_id: userId,
            activity_name: activityName,
            time_spent_seconds: timeSpentSeconds,
            attempt_count: attemptCount,
        })

    if (error) {
        console.error('Error logging activity:', error)
        return null
    }
    return data
}

// Update gamification stats
export async function updateGamificationStats(
    userId: string,
    totalXp: number,
    level: number,
    badgesEarned: string[]
) {
    const { data, error } = await supabase
        .from('gamification_stats')
        .upsert({
            user_id: userId,
            total_xp: totalXp,
            level: level,
            badges_earned: badgesEarned,
        })

    if (error) {
        console.error('Error updating gamification stats:', error)
        return null
    }
    return data
}

// Get user profile
export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }
    return data
}

// ===== SQL Schema (run this in Supabase SQL Editor) =====
/*
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  group_type TEXT CHECK (group_type IN ('A', 'B')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs for research tracking (Y1, Y2, Y3)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  time_spent_seconds INTEGER NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification stats
CREATE TABLE gamification_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges_earned TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_stats ENABLE ROW LEVEL SECURITY;

-- Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own gamification stats" ON gamification_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own gamification stats" ON gamification_stats
  FOR ALL USING (auth.uid() = user_id);
*/
