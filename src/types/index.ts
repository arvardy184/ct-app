// User Session Type
export interface UserSession {
    id: string
    name: string
    email: string
    xp: number
    level: number
    badges: string[]
    groupType: 'A' | 'B' // For crossover experiment
}

// Activity Log for Research Tracking
export interface ActivityLog {
    id?: string
    userId: string
    activityName: string
    timeSpentSeconds: number
    attemptCount: number
    createdAt?: string
}

// Gamification Stats
export interface GamificationStats {
    userId: string
    totalXp: number
    level: number
    badgesEarned: string[]
}

// Module Types
export type ModuleType = 'chapter2' | 'chapter7' | null

// Bead Colors for Pattern Activity
export type BeadColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange'

// Bead Item
export interface BeadItem {
    id: string
    color: BeadColor
}

// Pattern Level
export interface PatternLevel {
    id: number
    pattern: BeadColor[]
    missingIndex: number
    difficulty: 'easy' | 'medium' | 'hard'
    xpReward: number
}

// Sprite State for Visual Stage
export interface SpriteState {
    x: number
    y: number
    rotation: number // in degrees
    isAnimating: boolean
}

// Execution Command
export interface ExecutionCommand {
    type: 'move' | 'turnRight' | 'turnLeft' | 'wait'
    value: number
}

// Blockly Workspace State
export interface WorkspaceState {
    generatedCode: string
    commands: ExecutionCommand[]
    isRunning: boolean
}
