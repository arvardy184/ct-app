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
                const { error } = await supabase.auth.setSession({
                    access_token: token,
                    refresh_token: '', // Native handles refresh
                })
                
                if (error) {
                    console.error('Error setting auth token:', error)
                    return false
                }
                return true
            } catch (error) {
                console.error('Failed to set auth token:', error)
                return false
            }
        } else {
            return false
        }
    }
    return false
}

// ===== Web Auth Functions (for standalone browser access) =====

export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { user: null, error: error.message }
    return { user: data.user, error: null }
}

export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/`,
        },
    })
    if (error) return { url: null, error: error.message }
    return { url: data.url, error: null }
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
    groupType: 'A' | 'B',
    className?: string
) {
    const { data: upsertData, error } = await supabase.from('profiles').upsert({
        id: userId,
        name,
        email,
        class_name: className ?? null,
        group_type: groupType,
    }, { onConflict: 'id' }).select('id').single()
    if (error || !upsertData) {
        console.error('Error creating profile:', error ?? 'no row returned (RLS block?)')
        return false
    }
    await supabase.from('gamification_stats').upsert(
        { user_id: userId },
        { onConflict: 'user_id' }
    )
    return true
}

export async function updateProfile(
    userId: string,
    updates: { name?: string; class_name?: string; group_type?: 'A' | 'B' }
) {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
    if (error) {
        console.error('Error updating profile:', error)
        return false
    }
    return true
}

// ===== Database Functions =====

// Log activity for research tracking
export async function logActivity(
    userId: string,
    activityName: string,
    timeSpentSeconds: number,
    attemptCount: number,
    score?: number,
    completed?: boolean,
) {
    const { data, error } = await supabase
        .from('activity_logs')
        .insert({
            user_id: userId,
            activity_name: activityName,
            time_spent_seconds: timeSpentSeconds,
            attempt_count: attemptCount,
            ...(score !== undefined && { score }),
            completed: completed ?? false,
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

export async function getCompletedActivities(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase
        .from('activity_logs')
        .select('activity_name')
        .eq('user_id', userId)
        .eq('completed', true)
    if (error || !data) return new Set()
    return new Set(data.map(r => r.activity_name as string))
}

// ===== User Progress Functions =====

export async function getUserProgress(userId: string) {
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)

    if (error) {
        console.error('Error fetching user progress:', error)
        return []
    }
    return data ?? []
}

export async function upsertUserProgress(
    userId: string,
    chapterId: string,
    status: 'locked' | 'unlocked' | 'completed',
    timeSpentSeconds?: number
) {
    const payload: Record<string, unknown> = {
        user_id: userId,
        chapter_id: chapterId,
        status,
    }
    if (timeSpentSeconds !== undefined) {
        payload.time_spent_seconds = timeSpentSeconds
    }

    const { data, error } = await supabase
        .from('user_progress')
        .upsert(payload, { onConflict: 'user_id,chapter_id' })
        .select()
        .single()

    if (error) {
        console.error('Error upserting user progress:', error)
        return null
    }
    return data
}

export async function initializeUserProgress(userId: string) {
    const chapters = [
        { chapter_id: 'pretest_chapter2', status: 'unlocked' },
        { chapter_id: 'chapter2', status: 'locked' },
        { chapter_id: 'posttest_chapter2', status: 'locked' },
        { chapter_id: 'questionnaire_chapter2', status: 'locked' },
        { chapter_id: 'pretest_chapter7', status: 'locked' },
        { chapter_id: 'chapter7', status: 'locked' },
        { chapter_id: 'posttest_chapter7', status: 'locked' },
        { chapter_id: 'questionnaire_chapter7', status: 'locked' },
    ]

    const rows = chapters.map(c => ({
        user_id: userId,
        chapter_id: c.chapter_id,
        status: c.status,
        time_spent_seconds: 0,
    }))

    const { error } = await supabase
        .from('user_progress')
        .upsert(rows, { onConflict: 'user_id,chapter_id' })

    if (error) {
        console.error('Error initializing user progress:', error)
        return false
    }
    return true
}

// ===== Questionnaire Functions =====

export async function saveQuestionnaire(
    userId: string,
    chapter: 'chapter2' | 'chapter7',
    items: Record<string, number>
) {
    const { data, error } = await supabase
        .from('questionnaires')
        .insert({
            user_id: userId,
            chapter,
            ...items,
        })
        .select()
        .single()

    if (error) {
        console.error('Error saving questionnaire:', error)
        return null
    }
    return data
}

export async function getQuestionnaires(userId: string) {
    const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching questionnaires:', error)
        return []
    }
    return data ?? []
}

