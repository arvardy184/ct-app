import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { supabase, getUserProgress, getQuestionnaires } from '../../lib/supabase'
import { fetchMyTestResults, type TestResult } from '../../lib/testService'
import type { UserProgress, QuestionnaireResponse } from '../../types'

const ARCS_LABELS: Record<string, string[]> = {
  attention: ['item_1', 'item_2', 'item_3'],
  relevance: ['item_4', 'item_5', 'item_6'],
  confidence: ['item_7', 'item_8', 'item_9'],
  satisfaction: ['item_10', 'item_11', 'item_12'],
}

function getArcsAverage(q: QuestionnaireResponse, dimension: string): number {
  const keys = ARCS_LABELS[dimension] ?? []
  const values = keys.map(k => (q as unknown as Record<string, number>)[k] ?? 0)
  return values.reduce((a, b) => a + b, 0) / values.length
}

export default function ProfileDashboardPage() {
  const { userSession } = useAppStore()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user?.id
    if (!uid) { setLoading(false); return }

    const [tr, prog, qs] = await Promise.all([
      fetchMyTestResults(uid),
      getUserProgress(uid),
      getQuestionnaires(uid),
    ])
    setTestResults(tr)
    setProgress(prog)
    setQuestionnaires(qs)
    setLoading(false)
  }

  function getTestResult(chapter: string, type: string) {
    return testResults.find(r => r.chapter === chapter && r.type === type) ?? null
  }

  function getProgressStatus(chapterId: string) {
    return progress.find(p => p.chapter_id === chapterId)?.status ?? 'locked'
  }

  function getProgressTime(chapterId: string) {
    return progress.find(p => p.chapter_id === chapterId)?.time_spent_seconds ?? 0
  }

  function formatTime(seconds: number) {
    if (seconds === 0) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const statusIcon: Record<string, string> = {
    locked: '🔒',
    unlocked: '🔓',
    completed: '✅',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const chapters = ['chapter2', 'chapter7'] as const
  const chapterLabels: Record<string, string> = {
    chapter2: 'Bab 2: Pengenalan Pola',
    chapter7: 'Bab 7: Visual Programming',
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors mb-2 inline-block">
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <span>👤</span> Profil Saya
          </h1>
        </div>
      </div>

      {/* Profile Info */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Nama</p>
            <p className="text-slate-800 font-bold">{userSession?.name ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Kelas</p>
            <p className="text-slate-800 font-bold">{userSession?.className ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Grup</p>
            <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold">
              Grup {userSession?.groupType ?? '-'}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Email</p>
            <p className="text-slate-600 text-sm">{userSession?.email ?? '-'}</p>
          </div>
        </div>
      </section>

      {/* Progress per Chapter */}
      {chapters.map(ch => {
        const pre = getTestResult(ch, 'pretest')
        const post = getTestResult(ch, 'posttest')
        const q = questionnaires.find(q => q.chapter === ch)

        return (
          <section key={ch} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-xl font-bold text-slate-800">{chapterLabels[ch]}</h2>

            {/* Progress Flow */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: `pretest_${ch}`, label: 'Pre-test' },
                { id: ch, label: 'Materi' },
                { id: `posttest_${ch}`, label: 'Post-test' },
                { id: `questionnaire_${ch}`, label: 'Kuesioner' },
              ].map(step => {
                const status = getProgressStatus(step.id)
                const time = getProgressTime(step.id)
                return (
                  <div
                    key={step.id}
                    className={`rounded-xl border p-3 text-center ${
                      status === 'completed'
                        ? 'bg-emerald-50 border-emerald-200'
                        : status === 'unlocked'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <p className="text-lg mb-1">{statusIcon[status]}</p>
                    <p className="text-xs font-bold text-slate-700">{step.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{status}</p>
                    {time > 0 && <p className="text-[10px] text-slate-400">{formatTime(time)}</p>}
                  </div>
                )
              })}
            </div>

            {/* Test Scores */}
            <div className="grid grid-cols-2 gap-4">
              <ScoreCard label="Pre-test" result={pre} color="sky" />
              <ScoreCard label="Post-test" result={post} color="violet" />
            </div>

            {/* Questionnaire Results */}
            {q && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Hasil Kuesioner RIMMS</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(ARCS_LABELS).map(([dim]) => {
                    const avg = getArcsAverage(q, dim)
                    const dimLabels: Record<string, string> = {
                      attention: 'Perhatian',
                      relevance: 'Relevansi',
                      confidence: 'Percaya Diri',
                      satisfaction: 'Kepuasan',
                    }
                    return (
                      <div key={dim} className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-indigo-600">{avg.toFixed(1)}</p>
                        <p className="text-[11px] font-semibold text-slate-600 mt-1">{dimLabels[dim]}</p>
                        <p className="text-[10px] text-slate-400">/ 5.0</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function ScoreCard({
  label,
  result,
  color,
}: {
  label: string
  result: TestResult | null
  color: 'sky' | 'violet'
}) {
  const colors = {
    sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', score: 'text-sky-600' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', score: 'text-violet-600' },
  }
  const c = colors[color]

  return (
    <div className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
      <p className={`text-xs font-bold ${c.text} mb-2`}>{label}</p>
      {result ? (
        <>
          <p className={`text-3xl font-bold ${c.score}`}>
            {Math.round((result.score / result.total) * 100)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {result.score}/{result.total} benar
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-400">Belum dikerjakan</p>
      )}
    </div>
  )
}


