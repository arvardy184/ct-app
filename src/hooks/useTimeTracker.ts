import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { logActivity } from '../lib/supabase'

interface UseTimeTrackerOptions {
    activityName: string
    autoStart?: boolean
}

export function useTimeTracker({ activityName, autoStart = true }: UseTimeTrackerOptions) {
    const {
        userSession,
        startActivity,
        stopActivity,
        getElapsedTime,
        activityStartTime
    } = useAppStore()

    const attemptCountRef = useRef(1)
    const hasStartedRef = useRef(false)

    useEffect(() => {
        if (autoStart && !hasStartedRef.current) {
            startActivity()
            hasStartedRef.current = true
        }


        return () => {
            if (hasStartedRef.current && activityStartTime) {
                const elapsed = stopActivity()
                if (userSession && elapsed > 0) {
                    logActivity(
                        userSession.id,
                        activityName,
                        elapsed,
                        attemptCountRef.current
                    )
                }
                hasStartedRef.current = false
            }
        }
    }, [activityName, autoStart, startActivity, stopActivity, userSession, activityStartTime])

    const finishActivity = useCallback(async (score?: number, completed?: boolean) => {
        const elapsed = stopActivity()

        if (userSession && elapsed > 0) {
            await logActivity(
                userSession.id,
                activityName,
                elapsed,
                attemptCountRef.current,
                score,
                completed,
            )
        }

        hasStartedRef.current = false
        return elapsed
    }, [activityName, stopActivity, userSession])

    const incrementAttempt = useCallback(() => {
        attemptCountRef.current += 1
    }, [])

    const resetAndRestart = useCallback(() => {
        stopActivity()
        attemptCountRef.current = 1
        startActivity()
        hasStartedRef.current = true
    }, [startActivity, stopActivity])

    return {
        finishActivity,
        incrementAttempt,
        resetAndRestart,
        getElapsedTime,
        attemptCount: attemptCountRef.current,
        isTracking: hasStartedRef.current,
    }
}
