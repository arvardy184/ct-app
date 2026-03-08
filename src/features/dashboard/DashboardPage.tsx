import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { signOut, supabase, getCompletedActivities, getUserProgress } from '../../lib/supabase'
import { fetchMyTestResults, type TestResult } from '../../lib/testService'
import type { QuestionChapter } from '../../lib/questionService'
import type { UserProgress } from '../../types'

export default function DashboardPage() {
    const { userSession, isGamified, setGamificationMode } = useAppStore()
    const navigate = useNavigate()
    const [completedCount, setCompletedCount] = useState(0)
    const [testResults, setTestResults] = useState<TestResult[]>([])
    const [progress, setProgress] = useState<UserProgress[]>([])

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            const uid = data.session?.user?.id
            if (uid) {
                getCompletedActivities(uid).then((s) => setCompletedCount(s.size))
                fetchMyTestResults(uid).then(setTestResults)
                getUserProgress(uid).then(setProgress)
            }
        })
    }, [])

    // Group A/B gamification: on dashboard, always show gamified stats
    // The actual per-chapter gamification toggle happens on Chapter pages
    useEffect(() => {
        if (!userSession) return
        setGamificationMode(true)
    }, [userSession?.groupType])

    function getProgressStatus(chapterId: string): string {
        return progress.find(p => p.chapter_id === chapterId)?.status ?? 'locked'
    }

    function isLocked(chapterId: string): boolean {
        return getProgressStatus(chapterId) === 'locked'
    }

    function getTestResult(chapter: QuestionChapter, type: 'pretest' | 'posttest') {
        return testResults.find(r => r.chapter === chapter && r.type === type) ?? null
    }

    async function handleSignOut() {
        await signOut()
        navigate('/login')
    }

    const modules = [
        {
            id: 'chapter2',
            title: 'Bab 2: Pengenalan Pola',
            description: 'Belajar mengenali dan melanjutkan pola dengan aktivitas gelang manik-manik.',
            icon: '🎨',
            path: '/chapter2',
            skills: ['Pattern Recognition', 'Logical Thinking'],
        },
        {
            id: 'chapter7',
            title: 'Bab 7: Visual Programming',
            description: 'Membuat program visual seperti Scratch untuk menggerakkan karakter.',
            icon: '🧩',
            path: '/chapter7',
            skills: ['Sequencing', 'Loops', 'Debugging'],
        },
    ]

    const achievements = [
        { icon: '🎯', name: 'First Pattern', description: 'Selesaikan pola pertama' },
        { icon: '🏆', name: 'Pattern Master', description: 'Selesaikan semua level pola' },
        { icon: '🚀', name: 'First Program', description: 'Jalankan program pertama' },
        { icon: '⭐', name: 'Loop Expert', description: 'Gunakan loop dalam program' },
    ]

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            {/* Welcome Section */}
            <section className="text-center py-8 relative">
                <button
                    onClick={handleSignOut}
                    className="absolute right-0 top-0 px-4 py-2 bg-white hover:bg-slate-50
                               border border-slate-200 text-slate-500 hover:text-slate-800 text-sm font-medium
                               rounded-xl transition-all duration-200 shadow-sm"
                >
                    Keluar →
                </button>
                <h1 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">
                    {isGamified ? `🎮 Halo, ${userSession?.name ?? 'Petualang'}!` : `📚 Halo, ${userSession?.name ?? 'Siswa'}!`}
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                    Mari belajar berpikir komputasional dan algoritma dengan cara yang menyenangkan!
                </p>
            </section>

            {/* Quick Stats (Gamified only) */}
            {isGamified && userSession && (
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center shadow-sm">
                        <p className="text-4xl font-bold text-purple-700">{userSession.level}</p>
                        <p className="text-purple-600 font-medium mt-1">Level</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center shadow-sm">
                        <p className="text-4xl font-bold text-green-700">{userSession.xp}</p>
                        <p className="text-green-600 font-medium mt-1">Total XP</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6 text-center shadow-sm">
                        <p className="text-4xl font-bold text-yellow-700">{userSession.badges.length}</p>
                        <p className="text-yellow-600 font-medium mt-1">Badges</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center shadow-sm">
                        <p className="text-4xl font-bold text-blue-700">{completedCount}</p>
                        <p className="text-blue-600 font-medium mt-1">Completed</p>
                    </div>
                </section>
            )}

            {/* Learning Flow per Chapter */}
            {modules.map((module) => {
                const ch = module.id as QuestionChapter
                const preResult = getTestResult(ch, 'pretest')
                const postResult = getTestResult(ch, 'posttest')
                const chapterLocked = isLocked(module.id)
                const postLocked = isLocked(`posttest_${module.id}`)
                const questLocked = isLocked(`questionnaire_${module.id}`)
                const questCompleted = getProgressStatus(`questionnaire_${module.id}`) === 'completed'

                return (
                    <section key={module.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl border border-slate-100 text-2xl">
                                {module.icon}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{module.title}</h2>
                                <p className="text-slate-500 text-sm">{module.description}</p>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2">
                            {module.skills.map((skill) => (
                                <span key={skill} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold rounded-lg">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        {/* Step Flow */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Pre-test */}
                            <StepCard
                                label="Pre-test"
                                result={preResult}
                                locked={isLocked(`pretest_${module.id}`)}
                                linkTo={`/test/pretest/${module.id}`}
                                color="sky"
                            />

                            {/* Chapter / Materi */}
                            <div className={`rounded-xl border p-3 text-center ${
                                chapterLocked
                                    ? 'bg-slate-50 border-slate-200 opacity-50'
                                    : 'bg-indigo-50 border-indigo-200'
                            }`}>
                                <p className="text-lg mb-1">{chapterLocked ? '🔒' : '📖'}</p>
                                <p className="text-xs font-bold text-slate-700">Materi</p>
                                {chapterLocked ? (
                                    <p className="text-[10px] text-slate-400 mt-1">Selesaikan Pre-test</p>
                                ) : (
                                    <Link to={module.path} className="text-[10px] font-semibold text-indigo-600 underline mt-1 block">
                                        Mulai Belajar →
                                    </Link>
                                )}
                            </div>

                            {/* Post-test */}
                            <StepCard
                                label="Post-test"
                                result={postResult}
                                locked={postLocked}
                                linkTo={`/test/posttest/${module.id}`}
                                color="violet"
                            />

                            {/* Questionnaire */}
                            <div className={`rounded-xl border p-3 text-center ${
                                questCompleted
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : questLocked
                                        ? 'bg-slate-50 border-slate-200 opacity-50'
                                        : 'bg-amber-50 border-amber-200'
                            }`}>
                                <p className="text-lg mb-1">{questCompleted ? '✅' : questLocked ? '🔒' : '📝'}</p>
                                <p className="text-xs font-bold text-slate-700">Kuesioner</p>
                                {questCompleted ? (
                                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">Selesai</p>
                                ) : questLocked ? (
                                    <p className="text-[10px] text-slate-400 mt-1">Selesaikan Post-test</p>
                                ) : (
                                    <Link to={`/questionnaire/${module.id}`} className="text-[10px] font-semibold text-amber-700 underline mt-1 block">
                                        Isi Kuesioner →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </section>
                )
            })}

            {/* Achievements (Gamified only) */}
            {isGamified && (
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <span>🏆</span> Achievement
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {achievements.map((achievement, index) => {
                            const isUnlocked = userSession?.badges.includes(achievement.icon)
                            return (
                                <div
                                    key={index}
                                    className={`p-5 rounded-2xl text-center transition-all duration-300 shadow-sm ${
                                        isUnlocked
                                            ? 'bg-yellow-50 border border-yellow-200'
                                            : 'bg-white border border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className={`text-4xl mb-3 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                                        {achievement.icon}
                                    </div>
                                    <p className="text-slate-800 font-bold text-sm leading-tight">{achievement.name}</p>
                                    <p className="text-slate-500 text-xs mt-1.5 leading-snug">{achievement.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Research Info */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span>📊</span> Informasi Penelitian
                </h2>
                <p className="text-slate-600 mb-5 text-sm leading-relaxed">
                    Aplikasi ini adalah bagian dari penelitian skripsi tentang pembelajaran
                    algoritma dan berpikir komputasional. Aktivitas kamu akan direkam untuk
                    analisis data penelitian.
                </p>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                        Mode: {isGamified ? 'Gamified' : 'Non-Gamified'}
                    </span>
                    <span className="px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        Group: {userSession?.groupType || 'N/A'}
                    </span>
                </div>
            </section>
        </div>
    )
}

// ─── Helper Components ────────────────────────────────────────────────────

function StepCard({
    label,
    result,
    locked,
    linkTo,
    color,
}: {
    label: string
    result: TestResult | null
    locked: boolean
    linkTo: string
    color: 'sky' | 'violet'
}) {
    const colorMap = {
        sky: {
            bg: 'bg-sky-50 border-sky-200',
            score: 'text-sky-600',
            btn: 'text-sky-700',
        },
        violet: {
            bg: 'bg-violet-50 border-violet-200',
            score: 'text-violet-600',
            btn: 'text-violet-700',
        },
    }
    const c = colorMap[color]

    if (locked) {
        return (
            <div className="rounded-xl border p-3 text-center bg-slate-50 border-slate-200 opacity-50">
                <p className="text-lg mb-1">🔒</p>
                <p className="text-xs font-bold text-slate-700">{label}</p>
                <p className="text-[10px] text-slate-400 mt-1">Terkunci</p>
            </div>
        )
    }

    if (result) {
        const pct = Math.round((result.score / result.total) * 100)
        return (
            <div className={`rounded-xl border p-3 text-center ${c.bg}`}>
                <p className="text-lg mb-1">✅</p>
                <p className="text-xs font-bold text-slate-700">{label}</p>
                <p className={`text-xl font-bold ${c.score}`}>{pct}%</p>
                <p className="text-[10px] text-slate-500">{result.score}/{result.total}</p>
                <Link to={linkTo} className={`text-[10px] font-semibold ${c.btn} underline mt-1 block`}>
                    Ulangi
                </Link>
            </div>
        )
    }

    return (
        <div className={`rounded-xl border p-3 text-center ${c.bg}`}>
            <p className="text-lg mb-1">📝</p>
            <p className="text-xs font-bold text-slate-700">{label}</p>
            <p className="text-[10px] text-slate-500 mt-1">Belum dikerjakan</p>
            <Link to={linkTo} className={`text-[10px] font-semibold ${c.btn} underline mt-1 block`}>
                Mulai →
            </Link>
        </div>
    )
}
