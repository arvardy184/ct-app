import { useEffect, useState } from 'react'
import { supabase, getProfile } from '../lib/supabase'
import { useAppStore } from '../stores/useAppStore'
import type { Session } from '@supabase/supabase-js'

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const { setUserSession } = useAppStore()

    useEffect(() => {
        // Get current session on mount
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
            if (data.session) loadUserProfile(data.session)
            else setIsLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession)
            if (newSession) loadUserProfile(newSession)
            else {
                setUserSession(null)
                setIsLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function loadUserProfile(s: Session) {
        setIsLoading(true)
        const profile = await getProfile(s.user.id)
        if (profile) {
            setUserSession({
                id: s.user.id,
                name: profile.name,
                email: s.user.email ?? '',
                xp: 0,
                level: 1,
                badges: [],
                groupType: profile.group_type as 'A' | 'B',
            })
        }
        setIsLoading(false)
    }

    return { session, isLoading }
}
