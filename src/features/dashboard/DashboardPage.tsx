import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { signOut, supabase, getCompletedActivities } from '../../lib/supabase'
import { fetchMyTestResults, type TestResult } from '../../lib/testService'
import type { QuestionChapter } from '../../lib/questionService'

export default function DashboardPage() {
    const { userSession, isGamified } = useAppStore()
    const navigate = useNavigate()
    const [completedCount, setCompletedCount] = useState(0)
    const [testResults, setTestResults] = useState<TestResult[]>([])

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            const uid = data.session?.user?.id
            if (uid) {
                getCompletedActivities(uid).then((s) => setCompletedCount(s.size))
                fetchMyTestResults(uid).then(setTestResults)
            }
        })
    }, [])

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
            status: 'available',
            skills: ['Pattern Recognition', 'Logical Thinking'],
        },
        {
            id: 'chapter7',
            title: 'Bab 7: Visual Programming',
            description: 'Membuat program visual seperti Scratch untuk menggerakkan karakter.',
            icon: '🧩',
            path: '/chapter7',
            status: 'available',
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
                    <div className="bg-purple-50
                          border border-purple-100 rounded-2xl p-6 text-center shadow-sm">
                        <p className="text-4xl font-bold text-purple-700">{userSession.level}</p>
                        <p className="text-purple-600 font-medium mt-1">Level</p>
                    </div>
                    <div className="bg-green-50
                          border border-green-100 rounded-2xl p-6 text-center shadow-sm">
                        <p className="text-4xl font-bold text-green-700">{userSession.xp}</p>
                        <p className="text-green-600 font-medium mt-1">Total XP</p>
                    </div>
                    <div className="bg-yellow-50
                          border border-yellow-100 rounded-2xl p-6 text-center shadow-sm">
                        <p className="text-4xl font-bold text-yellow-700">{userSession.badges.length}</p>
                        <p className="text-yellow-600 font-medium mt-1">Badges</p>
                    </div>
                    <div className="bg-blue-50
                          border border-blue-100 rounded-2xl p-6 text-center shadow-sm">
                        <p className="text-4xl font-bold text-blue-700">{completedCount}</p>
                        <p className="text-blue-600 font-medium mt-1">Completed</p>
                    </div>
                </section>
            )}

            {/* Learning Modules */}
            <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <span>📖</span> Modul Pembelajaran
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((module) => (
                        <Link
                            key={module.id}
                            to={module.path}
                            className="group block"
                        >
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transform hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-2xl border border-slate-100 text-4xl shadow-sm group-hover:scale-110 transition-transform">
                                            {module.icon}
                                        </div>
                                        <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-200">
                                            Tersedia
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {module.title}
                                    </h3>
                                    <p className="text-slate-500 mb-6 flex-grow leading-relaxed">{module.description}</p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {module.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold rounded-lg"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-auto flex items-center text-indigo-600 font-bold group-hover:text-indigo-700 transition-colors">
                                        <span>Mulai Belajar</span>
                                        <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Pretest & Posttest */}
            <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <span>📋</span> Pre-test & Post-test
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((module) => {
                        const ch = module.id as QuestionChapter
                        const preResult = getTestResult(ch, 'pretest')
                        const postResult = getTestResult(ch, 'posttest')
                        return (
                            <div
                                key={module.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{module.icon}</span>
                                    <h3 className="font-bold text-slate-800">{module.title}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <TestButton
                                        label="Pre-test"
                                        path={`/test/pretest/${module.id}`}
                                        result={preResult}
                                        color="sky"
                                    />
                                    <TestButton
                                        label="Post-test"
                                        path={`/test/posttest/${module.id}`}
                                        result={postResult}
                                        color="violet"
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

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
                                    className={`
                    p-5 rounded-2xl text-center transition-all duration-300 shadow-sm
                    ${isUnlocked
                                            ? 'bg-yellow-50 border border-yellow-200'
                                            : 'bg-white border border-slate-200 opacity-60'
                                        }
                  `}
                                >
                                    <div className={`text-4xl mb-3 ${isUnlocked ? 'animate-bounce-slow' : 'grayscale opacity-50'}`}>
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

// ─── Helper Component ──────────────────────────────────────────────────────

function TestButton({
    label,
    path,
    result,
    color,
}: {
    label: string
    path: string
    result: TestResult | null
    color: 'sky' | 'violet'
}) {
    const colorMap = {
        sky: {
            badge: 'bg-sky-50 border-sky-200 text-sky-700',
            btn: 'bg-sky-600 hover:bg-sky-700 text-white',
            score: 'text-sky-600',
        },
        violet: {
            badge: 'bg-violet-50 border-violet-200 text-violet-700',
            btn: 'bg-violet-600 hover:bg-violet-700 text-white',
            score: 'text-violet-600',
        },
    }
    const c = colorMap[color]

    return (
        <div className={`rounded-xl border p-3 space-y-2 ${c.badge}`}>
            <p className="text-xs font-semibold">{label}</p>
            {result ? (
                <>
                    <p className={`text-2xl font-bold ${c.score}`}>
                        {Math.round((result.score / result.total) * 100)}%
                    </p>
                    <p className="text-xs opacity-70">
                        {result.score}/{result.total} benar
                    </p>
                    <Link
                        to={path}
                        className="block text-center text-xs font-medium underline opacity-70 hover:opacity-100"
                    >
                        Ulangi
                    </Link>
                </>
            ) : (
                <>
                    <p className="text-xs opacity-60">Belum dikerjakan</p>
                    <Link
                        to={path}
                        className={`block text-center py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${c.btn}`}
                    >
                        Mulai →
                    </Link>
                </>
            )}
        </div>
    )
}
