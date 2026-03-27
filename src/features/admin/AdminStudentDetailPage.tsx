import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  fetchStudentDetail,
  type StudentDetail,
  type StudentTestResult,
} from '../../lib/adminService'
import { formatSeconds } from '../../lib/exportUtils'

const ARCS_LABELS: Record<string, string[]> = {
  Perhatian: ['item_1', 'item_2', 'item_3'],
  Relevansi: ['item_4', 'item_5', 'item_6'],
  'Percaya Diri': ['item_7', 'item_8', 'item_9'],
  Kepuasan: ['item_10', 'item_11', 'item_12'],
}

const CHAPTER_LABELS: Record<string, string> = {
  chapter2: 'Bab 2: Pengenalan Pola',
  chapter7: 'Bab 7: Visual Programming',
}

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  locked:    { bg: 'bg-slate-700 border-slate-600',          text: 'text-slate-400',   icon: '🔒' },
  unlocked:  { bg: 'bg-blue-900/40 border-blue-700/50',      text: 'text-blue-400',    icon: '🔓' },
  completed: { bg: 'bg-emerald-900/40 border-emerald-700/50',text: 'text-emerald-400', icon: '✅' },
}

export default function AdminStudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchStudentDetail(id).then(d => {
      setDetail(d)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-slate-400">Data siswa tidak ditemukan.</p>
        <Link to="/admin/users" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
          ← Kembali ke Data Siswa
        </Link>
      </div>
    )
  }

  const { profile, gamification, testResults, questionnaires, progress } = detail

  function getProgress(chapterId: string) {
    return progress.find(p => p.chapter_id === chapterId)
  }

  function getTest(chapter: string, type: string) {
    return testResults.find(r => r.chapter === chapter && r.type === type)
  }

  function getQuestionnaire(chapter: string) {
    return questionnaires.find(q => q.chapter === chapter)
  }

  function getArcsAvg(q: Record<string, number>, keys: string[]): number {
    const vals = keys.map(k => q[k] ?? 0)
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl">
      <Link
        to="/admin/users"
        className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors w-fit"
      >
        ← Kembali ke Data Siswa
      </Link>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
              <p className="text-slate-400 text-sm mt-0.5">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.group_type === 'A'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  Grup {profile.group_type}
                </span>
                {profile.class_name && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                    {profile.class_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          {gamification && (
            <div className="flex gap-3">
              <StatBadge icon="✨" label="Total XP" value={gamification.total_xp} color="indigo" />
              <StatBadge icon="⭐" label="Level"    value={gamification.level}     color="amber"  />
              <StatBadge icon="🏅" label="Badge"    value={gamification.badges_earned.length} color="purple" />
            </div>
          )}
        </div>
      </div>

      {(['chapter2', 'chapter7'] as const).map(ch => {
        const pre  = getTest(ch, 'pretest')
        const post = getTest(ch, 'posttest')
        const q    = getQuestionnaire(ch) as (Record<string, number> & { created_at: string }) | undefined

        const steps = [
          { id: `pretest_${ch}`,       label: 'Pre-test'  },
          { id: ch,                    label: 'Materi'    },
          { id: `posttest_${ch}`,      label: 'Post-test' },
          { id: `questionnaire_${ch}`, label: 'Kuesioner' },
        ]

        return (
          <section key={ch} className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-6">
            <h2 className="text-lg font-bold text-white">{CHAPTER_LABELS[ch]}</h2>

            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Progres Pengerjaan</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {steps.map(step => {
                  const prog   = getProgress(step.id)
                  const status = prog?.status ?? 'locked'
                  const s      = STATUS_STYLE[status]
                  const time   = prog?.time_spent_seconds ?? 0
                  return (
                    <div key={step.id} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                      <p className="text-xl mb-1">{s.icon}</p>
                      <p className={`text-xs font-bold ${s.text}`}>{step.label}</p>
                      <p className="text-slate-500 text-[10px] capitalize mt-0.5">{status}</p>
                      {time > 0 && (
                        <p className="text-slate-500 text-[10px] mt-1 font-mono">{formatSeconds(time)}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Skor Test</p>
              <div className="grid grid-cols-2 gap-4">
                <TestScoreCard label="Pre-test"  result={pre}  color="sky"    />
                <TestScoreCard label="Post-test" result={post} color="violet" />
              </div>
            </div>

            {pre && post && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                <p className="text-slate-400 text-sm">Peningkatan Skor (N-Gain)</p>
                <NGainBadge pre={pre} post={post} />
              </div>
            )}

            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Hasil Kuesioner RIMMS</p>
              {q ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(ARCS_LABELS).map(([dim, keys]) => {
                      const avg = getArcsAvg(q, keys)
                      const color = avg >= 4 ? 'text-emerald-400' : avg >= 3 ? 'text-amber-400' : 'text-red-400'
                      return (
                        <div key={dim} className="bg-slate-900/50 rounded-xl p-4 text-center border border-slate-700">
                          <p className={`text-3xl font-bold ${color}`}>{avg.toFixed(1)}</p>
                          <p className="text-slate-400 text-xs mt-1">{dim}</p>
                          <p className="text-slate-600 text-[10px]">/ 5.0</p>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-slate-600 text-xs mt-2">
                    Diisi pada {new Date(q.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </>
              ) : (
                <p className="text-slate-600 text-sm">Belum diisi.</p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function StatBadge({ icon, label, value, color }: {
  icon: string; label: string; value: number
  color: 'indigo' | 'amber' | 'purple'
}) {
  const colors = {
    indigo: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
    amber:  'bg-amber-500/20  border-amber-500/30  text-amber-400',
    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${colors[color]}`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  )
}

function TestScoreCard({ label, result, color }: {
  label: string
  result: StudentTestResult | undefined
  color: 'sky' | 'violet'
}) {
  const colors = {
    sky:    { bg: 'bg-sky-900/30 border-sky-700/40',       text: 'text-sky-400',    score: 'text-sky-300'    },
    violet: { bg: 'bg-violet-900/30 border-violet-700/40', text: 'text-violet-400', score: 'text-violet-300' },
  }
  const c = colors[color]
  return (
    <div className={`rounded-xl border p-4 ${c.bg}`}>
      <p className={`text-xs font-bold mb-3 ${c.text}`}>{label}</p>
      {result ? (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className={`text-4xl font-bold ${c.score}`}>
                {Math.round((result.score / result.total) * 100)}%
              </p>
              <p className="text-slate-400 text-xs mt-1">{result.score}/{result.total} benar</p>
            </div>
            <p className="text-slate-500 text-[10px] shrink-0 text-right">
              {new Date(result.completed_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
          {result.time_spent_seconds != null && result.time_spent_seconds > 0 && (
            <p className="text-slate-400 text-xs font-mono">
              ⏱ Durasi: {formatSeconds(result.time_spent_seconds)}
            </p>
          )}
        </div>
      ) : (
        <p className="text-slate-500 text-sm">Belum dikerjakan</p>
      )}
    </div>
  )
}

function NGainBadge({ pre, post }: { pre: StudentTestResult; post: StudentTestResult }) {
  const prePct  = pre.score  / pre.total
  const postPct = post.score / post.total
  const maxGain = 1 - prePct
  const ngain   = maxGain > 0 ? (postPct - prePct) / maxGain : 0
  const rounded = +ngain.toFixed(2)
  const { color, label } =
    rounded >= 0.7 ? { color: 'text-emerald-400', label: 'Tinggi' } :
    rounded >= 0.3 ? { color: 'text-amber-400',   label: 'Sedang' } :
                     { color: 'text-red-400',      label: 'Rendah' }
  return (
    <div className="flex items-center gap-3">
      <span className={`text-2xl font-bold ${color}`}>{rounded}</span>
      <span className={`text-sm font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-600 ${color}`}>
        {label}
      </span>
    </div>
  )
}
