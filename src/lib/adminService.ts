import { supabase } from './supabase'

export const ADMIN_EMAIL = 'admin@gmail.com'

export interface AdminProfile {
  id: string
  name: string
  email: string | null
  group_type: 'A' | 'B'
  created_at: string
  updated_at: string
}

export interface AdminGamificationStats {
  user_id: string
  total_xp: number
  level: number
  badges_earned: string[]
  achievements: Record<string, unknown>
  streak_days: number
  last_activity_date: string | null
  updated_at: string
}

export interface AdminActivityLog {
  id: string
  user_id: string
  activity_name: string
  time_spent_seconds: number
  attempt_count: number
  score: number
  completed: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface StudentRow {
  id: string
  name: string
  email: string | null
  groupType: 'A' | 'B'
  totalXp: number
  level: number
  badgesEarned: string[]
  completedActivities: number
  lastActive: string | null
}

export interface GroupComparison {
  group: 'A' | 'B'
  studentCount: number
  avgXp: number
  avgTimePerActivity: number
  avgAttempts: number
  totalCompleted: number
}

export interface ActivityProgress {
  activityName: string
  totalStudents: number
  completedCount: number
  avgTime: number
  avgAttempts: number
  avgScore: number
}

export async function isAdmin(): Promise<boolean> {
  const { data } = await supabase.auth.getUser()
  return data.user?.email === ADMIN_EMAIL
}

export async function fetchAllProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }
  return data ?? []
}

export async function fetchAllGamificationStats(): Promise<AdminGamificationStats[]> {
  const { data, error } = await supabase
    .from('gamification_stats')
    .select('*')

  if (error) {
    console.error('Error fetching gamification stats:', error)
    return []
  }
  return data ?? []
}

export async function fetchAllActivityLogs(): Promise<AdminActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching activity logs:', error)
    return []
  }
  return data ?? []
}

export async function fetchAdminDashboardData() {
  const [profiles, stats, logs] = await Promise.all([
    fetchAllProfiles(),
    fetchAllGamificationStats(),
    fetchAllActivityLogs(),
  ])

  const statsMap = new Map(stats.map(s => [s.user_id, s]))
  const logsByUser = new Map<string, AdminActivityLog[]>()
  for (const log of logs) {
    const existing = logsByUser.get(log.user_id) ?? []
    existing.push(log)
    logsByUser.set(log.user_id, existing)
  }

  const students: StudentRow[] = profiles
    .filter(p => p.email !== ADMIN_EMAIL)
    .map(p => {
      const gamification = statsMap.get(p.id)
      const userLogs = logsByUser.get(p.id) ?? []
      const completedSet = new Set(
        userLogs.filter(l => l.completed).map(l => l.activity_name)
      )
      const lastLog = userLogs.length > 0 ? userLogs[0].created_at : null

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        groupType: p.group_type,
        totalXp: gamification?.total_xp ?? 0,
        level: gamification?.level ?? 1,
        badgesEarned: gamification?.badges_earned ?? [],
        completedActivities: completedSet.size,
        lastActive: lastLog ?? gamification?.last_activity_date ?? null,
      }
    })

  const activityProgress = buildActivityProgress(profiles, logs)
  const groupComparison = buildGroupComparison(profiles, stats, logs)

  return { profiles, stats, logs, students, activityProgress, groupComparison }
}

function buildActivityProgress(
  profiles: AdminProfile[],
  logs: AdminActivityLog[],
): ActivityProgress[] {
  const nonAdminIds = new Set(
    profiles.filter(p => p.email !== ADMIN_EMAIL).map(p => p.id)
  )
  const totalStudents = nonAdminIds.size
  const activityMap = new Map<string, AdminActivityLog[]>()

  for (const log of logs) {
    if (!nonAdminIds.has(log.user_id)) continue
    const existing = activityMap.get(log.activity_name) ?? []
    existing.push(log)
    activityMap.set(log.activity_name, existing)
  }

  return Array.from(activityMap.entries()).map(([name, actLogs]) => {
    const completedUsers = new Set(
      actLogs.filter(l => l.completed).map(l => l.user_id)
    )
    const totalTime = actLogs.reduce((s, l) => s + l.time_spent_seconds, 0)
    const totalAttempts = actLogs.reduce((s, l) => s + l.attempt_count, 0)
    const totalScore = actLogs.reduce((s, l) => s + (l.score ?? 0), 0)

    return {
      activityName: name,
      totalStudents,
      completedCount: completedUsers.size,
      avgTime: actLogs.length > 0 ? Math.round(totalTime / actLogs.length) : 0,
      avgAttempts: actLogs.length > 0 ? +(totalAttempts / actLogs.length).toFixed(1) : 0,
      avgScore: actLogs.length > 0 ? Math.round(totalScore / actLogs.length) : 0,
    }
  })
}

function buildGroupComparison(
  profiles: AdminProfile[],
  stats: AdminGamificationStats[],
  logs: AdminActivityLog[],
): GroupComparison[] {
  const groups: ('A' | 'B')[] = ['A', 'B']
  const statsMap = new Map(stats.map(s => [s.user_id, s]))

  return groups.map(group => {
    const groupProfiles = profiles.filter(
      p => p.group_type === group && p.email !== ADMIN_EMAIL
    )
    const groupIds = new Set(groupProfiles.map(p => p.id))
    const groupLogs = logs.filter(l => groupIds.has(l.user_id))
    const groupStats = groupProfiles
      .map(p => statsMap.get(p.id))
      .filter(Boolean) as AdminGamificationStats[]

    const totalXp = groupStats.reduce((s, g) => s + g.total_xp, 0)
    const totalTime = groupLogs.reduce((s, l) => s + l.time_spent_seconds, 0)
    const totalAttempts = groupLogs.reduce((s, l) => s + l.attempt_count, 0)
    const completedLogs = groupLogs.filter(l => l.completed)

    const count = groupProfiles.length

    return {
      group,
      studentCount: count,
      avgXp: count > 0 ? Math.round(totalXp / count) : 0,
      avgTimePerActivity: groupLogs.length > 0
        ? Math.round(totalTime / groupLogs.length)
        : 0,
      avgAttempts: groupLogs.length > 0
        ? +(totalAttempts / groupLogs.length).toFixed(1)
        : 0,
      totalCompleted: completedLogs.length,
    }
  })
}
