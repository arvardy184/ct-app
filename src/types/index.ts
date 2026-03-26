export interface UserSession {
    id: string
    name: string
    email: string
    className?: string
    groupType: 'A' | 'B'
    xp: number
    level: number
    badges: string[]
}

export interface Profile {
    id: string
    name: string
    email: string
    class_name: string | null
    group_type: 'A' | 'B'
    created_at?: string
    updated_at?: string
}

export interface UserProgress {
    id?: string
    user_id: string
    chapter_id: string
    status: 'locked' | 'unlocked' | 'completed'
    time_spent_seconds: number
    created_at?: string
    updated_at?: string
}

export interface QuestionnaireResponse {
    id?: string
    user_id: string
    chapter: 'chapter2' | 'chapter7'
    item_1: number
    item_2: number
    item_3: number
    item_4: number
    item_5: number
    item_6: number
    item_7: number
    item_8: number
    item_9: number
    item_10: number
    item_11: number
    item_12: number
    created_at?: string
}

export interface ActivityLog {
    id?: string
    userId: string
    activityName: string
    timeSpentSeconds: number
    attemptCount: number
    createdAt?: string
}

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
    | { type: 'move'; value: number }
    | { type: 'turnRight'; value: number }
    | { type: 'turnLeft'; value: number }
    | { type: 'wait'; value: number }
    | { type: 'changeX'; value: number }
    | { type: 'changeY'; value: number }
    | { type: 'goTo'; x: number; y: number }
    | { type: 'nextCostume' }
    | { type: 'playSound' }
    | { type: 'repeat'; times: number; body: ExecutionCommand[] }
    | { type: 'forever'; body: ExecutionCommand[] }

// Blockly Workspace State
export interface WorkspaceState {
    generatedCode: string
    commands: ExecutionCommand[]
    isRunning: boolean
}
