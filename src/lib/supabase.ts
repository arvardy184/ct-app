import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Detect if running inside React Native WebView
const isEmbedded = typeof window !== 'undefined' && !!(window as any).__IS_EMBEDDED__

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: !isEmbedded,   // Browser: persist to localStorage; WebView: memory only
        autoRefreshToken: !isEmbedded, // Browser: auto-refresh; WebView: native handles refresh
    }
})

// ===== Auth Token Management =====

/**
 * Set auth token from React Native WebView injection
 * Call this on app init to authorize Supabase client
 */
export async function setAuthTokenFromNative() {
    if (typeof window !== 'undefined') {
        const token = (window as any).__NATIVE_AUTH_TOKEN__
        
        if (token) {
            try {
                // Set the auth token in Supabase client
                const { data, error } = await supabase.auth.setSession({
                    access_token: token,
                    refresh_token: '', // Native handles refresh
                })
                
                if (error) {
                    console.error('❌ Error setting auth token:', error)
                    return false
                }
                
                console.log('✅ Auth token set from native injection')
                console.log('👤 User:', data.user?.email)
                return true
            } catch (error) {
                console.error('❌ Failed to set auth token:', error)
                return false
            }
        } else {
            console.warn('⚠️ No native auth token found')
            return false
        }
    }
    return false
}

/**
 * Check current auth status (for debugging)
 */
export async function checkAuthStatus() {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
        console.error('❌ Auth check error:', error)
        return null
    }
    
    console.log('🔐 Auth Status:', data.session ? 'Authenticated ✅' : 'Not authenticated ❌')
    console.log('👤 User:', data.session?.user?.email || 'None')
    
    return data.session
}

// ===== Web Auth Functions (for standalone browser access) =====

export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { user: null, error: error.message }
    return { user: data.user, error: null }
}

export async function signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { user: null, error: error.message }
    return { user: data.user, error: null }
}

export async function signOut() {
    await supabase.auth.signOut()
}

export async function createProfile(
    userId: string,
    name: string,
    email: string,
    groupType: 'A' | 'B'
) {
    const { error } = await supabase.from('profiles').insert({
        id: userId,
        name,
        email,
        group_type: groupType,
    })
    if (error) {
        console.error('Error creating profile:', error)
        return false
    }
    // Also create gamification_stats row
    await supabase.from('gamification_stats').insert({ user_id: userId })
    return true
}

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
