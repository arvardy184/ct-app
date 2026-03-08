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
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
            if (data.session) loadUserProfile(data.session)
            else setIsLoading(false)
        })

        // Listen for auth changes (incl. OAuth redirect callback)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession)
            if (newSession) loadUserProfile(newSession)
            else {
                setUserSession(null)
                setNeedsProfileSetup(false)
                setIsLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function loadUserProfile(s: Session) {
        setIsLoading(true)
        const profile = await getProfile(s.user.id)

        if (profile) {
            // Profile found — load gamification stats too
            const { data: stats } = await supabase
                .from('gamification_stats')
                .select('total_xp, level, badges_earned')
                .eq('user_id', s.user.id)
                .single()

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
        } else {
            // No profile yet — user logged in via Google for the first time
            setNeedsProfileSetup(true)
        }

        setIsLoading(false)
    }

    return { session, isLoading, needsProfileSetup }
}
