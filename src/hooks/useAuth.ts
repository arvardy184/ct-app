import { useEffect, useState } from 'react'
import { supabase, getProfile } from '../lib/supabase'
import { useAppStore } from '../stores/useAppStore'
import type { Session } from '@supabase/supabase-js'

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [needsProfileSetup, setNeedsProfileSetup] = useState(false)
    const { setUserSession } = useAppStore()

    useEffect(() => {
        // Get current session on mount
        console.log('[Auth] 🚀 useAuth mounted — calling getSession()')
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.error('[Auth] ❌ getSession() error:', error)
                setIsLoading(false)
                return
            }
            console.log('[Auth] 📦 getSession() result:', data.session ? `user=${data.session.user.email}` : 'no session')
            setSession(data.session)
            if (data.session) loadUserProfile(data.session)
            else setIsLoading(false)
        })

        // Listen for auth changes (incl. OAuth redirect callback)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            // ⚠️  DO NOT make this listener async!
            // Supabase internally awaits all onAuthStateChange listeners while holding
            // the auth lock (inside setSession()). Making this async and calling supabase
            // API inside it will deadlock for 15-30s (getSession() waits for the same lock).
            console.log(`[Auth] 🔔 onAuthStateChange event="${event}" user=${newSession?.user?.email ?? 'none'}`)
            setSession(newSession)
            if (newSession) {
                setIsLoading(true)
                // ✅ FIX: setTimeout(0) defers loadUserProfile to the NEXT event loop tick,
                // AFTER setSession() releases its auth lock. getProfile() can then freely
                // call getSession() internally without deadlocking.
                setTimeout(() => loadUserProfile(newSession), 0)
            } else {
                console.log('[Auth] 🚪 Session cleared — resetting state')
                setUserSession(null)
                setNeedsProfileSetup(false)
                setIsLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function loadUserProfile(s: Session) {
        console.log(`[Auth] 🔄 loadUserProfile() start — userId=${s.user.id} email=${s.user.email}`)
        setIsLoading(true)
        try {
            const profile = await getProfile(s.user.id)
            console.log('[Auth] 👤 getProfile() result:', profile ? `name=${profile.name}` : 'null (no profile)')

            if (profile) {
                // Profile found — load gamification stats too
                console.log('[Auth] 🎮 Fetching gamification_stats...')
                const { data: stats, error: statsError } = await supabase
                    .from('gamification_stats')
                    .select('total_xp, level, badges_earned')
                    .eq('user_id', s.user.id)
                    .single()

                if (statsError) {
                    console.warn('[Auth] ⚠️ gamification_stats fetch error:', statsError.message)
                } else {
                    console.log('[Auth] 🎮 gamification_stats:', stats)
                }

                setUserSession({
                    id: s.user.id,
                    name: profile.name,
                    email: s.user.email ?? '',
                    className: profile.class_name ?? undefined,
                    xp: stats?.total_xp ?? 0,
                    level: stats?.level ?? 1,
                    badges: stats?.badges_earned ?? [],
                    groupType: profile.group_type as 'A' | 'B',
                })
                setNeedsProfileSetup(false)
                console.log('[Auth] ✅ loadUserProfile() done — user is authenticated')
            } else {
                // No profile yet — user logged in via Google for the first time
                console.log('[Auth] 🆕 No profile found — redirecting to profile-setup')
                setNeedsProfileSetup(true)
            }
        } catch (err) {
            console.error('[Auth] 💥 Unexpected error in loadUserProfile():', err)
        } finally {
            setIsLoading(false)
            console.log('[Auth] 🏁 setIsLoading(false) called')
        }
    }

    return { session, isLoading, needsProfileSetup }
}
