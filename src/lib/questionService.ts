import { supabase } from './supabase'

export type QuestionType = 'pretest' | 'posttest'
export type QuestionChapter = 'chapter2' | 'chapter7'

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface Question {
  id: string
  question_text: string
  options: QuestionOption[]
  correct_answer: 'A' | 'B' | 'C' | 'D'
  type: QuestionType
  chapter: QuestionChapter
  order_index: number
  created_at: string
  updated_at: string
}

export type QuestionInput = Omit<Question, 'id' | 'created_at' | 'updated_at'>

// ─── Read ────────────────────────────────────────────────────────────────────

export async function fetchQuestions(filters?: {
  type?: QuestionType
  chapter?: QuestionChapter
}): Promise<Question[]> {
  let query = supabase
    .from('questions')
    .select('*')
    .order('chapter', { ascending: true })
    .order('type', { ascending: true })
    .order('order_index', { ascending: true })

  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.chapter) query = query.eq('chapter', filters.chapter)

  const { data, error } = await query
  if (error) {
    console.error('Error fetching questions:', error)
    return []
  }
  return data ?? []
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createQuestion(input: QuestionInput): Promise<Question | null> {
  const { data, error } = await supabase
    .from('questions')
    .insert(input)
    .select()
    .single()

  if (error) {
    console.error('Error creating question:', error)
    return null
  }
  return data
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateQuestion(
  id: string,
  input: Partial<QuestionInput>,
): Promise<Question | null> {
  const { data, error } = await supabase
    .from('questions')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating question:', error)
    return null
  }
  return data
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteQuestion(id: string): Promise<boolean> {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) {
    console.error('Error deleting question:', error)
    return false
  }
  return true
}

// ─── Reorder ─────────────────────────────────────────────────────────────────

export async function reorderQuestions(
  updates: { id: string; order_index: number }[],
): Promise<boolean> {
  const promises = updates.map(({ id, order_index }) =>
    supabase.from('questions').update({ order_index }).eq('id', id),
  )
  const results = await Promise.all(promises)
  return results.every(r => !r.error)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function emptyQuestionInput(
  type: QuestionType = 'pretest',
  chapter: QuestionChapter = 'chapter2',
  orderIndex = 0,
): QuestionInput {
  return {
    question_text: '',
    options: [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' },
    ],
    correct_answer: 'A',
    type,
    chapter,
    order_index: orderIndex,
  }
}

export const CHAPTER_LABELS: Record<QuestionChapter, string> = {
  chapter2: 'Bab 2: Pola & Pattern',
  chapter7: 'Bab 7: Scratch Visual',
}

export const TYPE_LABELS: Record<QuestionType, string> = {
  pretest: 'Pre-test',
  posttest: 'Post-test',
}
