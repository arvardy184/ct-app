import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSession, ModuleType, SpriteState, ExecutionCommand } from '../types'

interface AppState {
    // ===== User Session =====
    userSession: UserSession | null
    setUserSession: (session: UserSession | null) => void

    // ===== Experiment Mode (Crossover Design) =====
    isGamified: boolean
    toggleGamificationMode: () => void
    setGamificationMode: (mode: boolean) => void

    // ===== Active Learning Module =====
    activeModule: ModuleType
    setActiveModule: (module: ModuleType) => void

    // ===== XP & Gamification Actions =====
    addXP: (amount: number) => void
    addBadge: (badge: string) => void

    // ===== Sprite State (Visual Stage) =====
    sprite: SpriteState
    setSpritePosition: (x: number, y: number) => void
    setSpriteRotation: (rotation: number) => void
    resetSprite: () => void
    setAnimating: (isAnimating: boolean) => void

    // ===== Execution Queue =====
    executionQueue: ExecutionCommand[]
    setExecutionQueue: (commands: ExecutionCommand[]) => void
    clearExecutionQueue: () => void

    // ===== Time Tracking =====
    activityStartTime: number | null
    startActivity: () => void
    getElapsedTime: () => number
    stopActivity: () => number
}

const DEFAULT_SPRITE: SpriteState = {
    x: 200,
    y: 200,
    rotation: 0,
    isAnimating: false,
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // ===== Initial State =====
            userSession: null,
            isGamified: true, // Default: Gamified mode
            activeModule: null,
            sprite: DEFAULT_SPRITE,
            executionQueue: [],
            activityStartTime: null,

            // ===== User Session Actions =====
            setUserSession: (session) => set({ userSession: session }),

            // ===== Gamification Mode Actions =====
            toggleGamificationMode: () =>
                set((state) => ({ isGamified: !state.isGamified })),

            setGamificationMode: (mode) => set({ isGamified: mode }),

            // ===== Module Actions =====
            setActiveModule: (module) => set({ activeModule: module }),

            // ===== XP & Badge Actions =====
            addXP: (amount) =>
                set((state) => {
                    if (!state.userSession) return state
                    const newXP = state.userSession.xp + amount
                    const newLevel = Math.floor(newXP / 100) + 1 // Level up every 100 XP
                    return {
                        userSession: {
                            ...state.userSession,
                            xp: newXP,
                            level: newLevel,
                        },
                    }
                }),

            addBadge: (badge) =>
                set((state) => {
                    if (!state.userSession) return state
                    if (state.userSession.badges.includes(badge)) return state
                    return {
                        userSession: {
                            ...state.userSession,
                            badges: [...state.userSession.badges, badge],
                        },
                    }
                }),

            // ===== Sprite Actions =====
            setSpritePosition: (x, y) =>
                set((state) => ({
                    sprite: { ...state.sprite, x, y }
                })),

            setSpriteRotation: (rotation) =>
                set((state) => ({
                    sprite: { ...state.sprite, rotation: rotation % 360 }
                })),

            resetSprite: () => set({ sprite: DEFAULT_SPRITE }),

            setAnimating: (isAnimating) =>
                set((state) => ({
                    sprite: { ...state.sprite, isAnimating }
                })),

            // ===== Execution Queue Actions =====
            setExecutionQueue: (commands) => set({ executionQueue: commands }),
            clearExecutionQueue: () => set({ executionQueue: [] }),

            // ===== Time Tracking Actions (for research) =====
            startActivity: () => set({ activityStartTime: Date.now() }),

            getElapsedTime: () => {
                const startTime = get().activityStartTime
                if (!startTime) return 0
                return Math.floor((Date.now() - startTime) / 1000)
            },

            stopActivity: () => {
                const startTime = get().activityStartTime
                if (!startTime) return 0
                const elapsed = Math.floor((Date.now() - startTime) / 1000)
                set({ activityStartTime: null })
                return elapsed
            },
        }),
        {
            name: 'computational-thinking-storage',
            partialize: (state) => ({
                userSession: state.userSession,
                isGamified: state.isGamified,
            }),
        }
    )
)
