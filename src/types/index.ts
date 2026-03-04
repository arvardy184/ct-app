// User Session Type
export interface UserSession {
    id: string
    name: string
    email: string
    xp: number
    level: number
    badges: string[]
    groupType: 'A' | 'B' 
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

// Execution Command (discriminated union)
export type ExecutionCommand =
    | { type: 'move';        value: number }
    | { type: 'turnRight';   value: number }
    | { type: 'turnLeft';    value: number }
    | { type: 'wait';        value: number }
    | { type: 'changeX';     value: number }
    | { type: 'changeY';     value: number }
    | { type: 'goTo';        x: number; y: number }
    | { type: 'nextCostume' }
    | { type: 'playSound'   }

// Blockly Workspace State
export interface WorkspaceState {
    generatedCode: string
    commands: ExecutionCommand[]
    isRunning: boolean
}
