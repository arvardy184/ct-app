import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { logActivity } from '../lib/supabase'

interface UseTimeTrackerOptions {
    activityName: string
    autoStart?: boolean
}

/**
 * Custom hook for tracking time spent on activities
 * Used for research data collection (Y1, Y2, Y3 metrics)
 */
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

    // Start tracking when component mounts
    useEffect(() => {
        if (autoStart && !hasStartedRef.current) {
            startActivity()
            hasStartedRef.current = true
        }

        // Cleanup: stop and log when component unmounts
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

    // Manually finish and log activity
    const finishActivity = useCallback(async () => {
        const elapsed = stopActivity()

        if (userSession && elapsed > 0) {
            await logActivity(
                userSession.id,
                activityName,
                elapsed,
                attemptCountRef.current
            )
        }

        hasStartedRef.current = false
        return elapsed
    }, [activityName, stopActivity, userSession])

    // Increment attempt count (for retry logic)
    const incrementAttempt = useCallback(() => {
        attemptCountRef.current += 1
    }, [])

    // Reset and restart
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
