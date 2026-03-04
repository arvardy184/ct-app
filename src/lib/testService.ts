import { supabase } from './supabase'
import type { QuestionType, QuestionChapter } from './questionService'

export interface TestResult {
  id: string
  user_id: string
  chapter: QuestionChapter
  type: QuestionType
  score: number
  total: number
  answers: Record<string, string>
  completed_at: string
}

export interface SaveTestInput {
  userId: string
  chapter: QuestionChapter
  type: QuestionType
  score: number
  total: number
  answers: Record<string, string>
}

export async function saveTestResult(input: SaveTestInput): Promise<TestResult | null> {
  const { data, error } = await supabase
    .from('test_results')
    .insert({
      user_id: input.userId,
      chapter: input.chapter,
      type: input.type,
      score: input.score,
      total: input.total,
      answers: input.answers,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving test result:', error)
    return null
  }
  return data
}

/** Ambil semua hasil test milik satu user */
export async function fetchMyTestResults(userId: string): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (error) {
    console.error('Error fetching test results:', error)
    return []
  }
  return data ?? []
}

/** Ambil hasil test terakhir untuk chapter + type tertentu */
export async function fetchLastTestResult(
  userId: string,
  chapter: QuestionChapter,
  type: QuestionType,
): Promise<TestResult | null> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .eq('chapter', chapter)
    .eq('type', type)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching last test result:', error)
    return null
  }
  return data
}

/** Untuk admin: ambil semua hasil test semua siswa */
export async function fetchAllTestResults(): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .order('completed_at', { ascending: false })

  if (error) {
    console.error('Error fetching all test results:', error)
    return []
  }
  return data ?? []
}
