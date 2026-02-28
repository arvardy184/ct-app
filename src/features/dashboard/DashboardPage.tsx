import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { signOut } from '../../lib/supabase'

export default function DashboardPage() {
    const { userSession, isGamified } = useAppStore()
    const navigate = useNavigate()

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
            color: 'from-pink-500 to-rose-600',
            status: 'available',
            skills: ['Pattern Recognition', 'Logical Thinking'],
        },
        {
            id: 'chapter7',
            title: 'Bab 7: Visual Programming',
            description: 'Membuat program visual seperti Scratch untuk menggerakkan karakter.',
            icon: '🧩',
            path: '/chapter7',
            color: 'from-purple-500 to-indigo-600',
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
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <section className="text-center py-8 relative">
                <button
                    onClick={handleSignOut}
                    className="absolute right-0 top-0 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/60
                               border border-slate-600/40 text-white/60 hover:text-white text-sm
                               rounded-xl transition-all duration-200"
                >
                    Keluar →
                </button>
                <h1 className="text-4xl font-bold text-white mb-4">
                    {isGamified ? `🎮 Halo, ${userSession?.name ?? 'Petualang'}!` : `📚 Halo, ${userSession?.name ?? 'Siswa'}!`}
                </h1>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                    Mari belajar berpikir komputasional dan algoritma dengan cara yang menyenangkan!
                </p>
            </section>

            {/* Quick Stats (Gamified only) */}
            {isGamified && userSession && (
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm 
                          border border-purple-500/30 rounded-2xl p-6 text-center">
                        <p className="text-4xl font-bold text-white">{userSession.level}</p>
                        <p className="text-purple-300">Level</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm 
                          border border-green-500/30 rounded-2xl p-6 text-center">
                        <p className="text-4xl font-bold text-white">{userSession.xp}</p>
                        <p className="text-green-300">Total XP</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-sm 
                          border border-yellow-500/30 rounded-2xl p-6 text-center">
                        <p className="text-4xl font-bold text-white">{userSession.badges.length}</p>
                        <p className="text-yellow-300">Badges</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm 
                          border border-blue-500/30 rounded-2xl p-6 text-center">
                        <p className="text-4xl font-bold text-white">0</p>
                        <p className="text-blue-300">Completed</p>
                    </div>
                </section>
            )}

            {/* Learning Modules */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span>📖</span> Modul Pembelajaran
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((module) => (
                        <Link
                            key={module.id}
                            to={module.path}
                            className="group block"
                        >
                            <div className={`
                bg-gradient-to-br ${module.color} p-1 rounded-2xl
                transform hover:scale-[1.02] transition-all duration-300
                shadow-xl hover:shadow-2xl
              `}>
                                <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-6 h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-5xl">{module.icon}</span>
                                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                                            Tersedia
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                        {module.title}
                                    </h3>
                                    <p className="text-white/60 mb-4">{module.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {module.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-lg"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center text-white/60 group-hover:text-white transition-colors">
                                        <span>Mulai Belajar</span>
                                        <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Achievements (Gamified only) */}
            {isGamified && (
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span>🏆</span> Achievement
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {achievements.map((achievement, index) => {
                            const isUnlocked = userSession?.badges.includes(achievement.icon)
                            return (
                                <div
                                    key={index}
                                    className={`
                    p-4 rounded-xl text-center transition-all duration-300
                    ${isUnlocked
                                            ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                                            : 'bg-slate-800/50 border border-slate-700/50 opacity-50'
                                        }
                  `}
                                >
                                    <span className={`text-4xl ${isUnlocked ? '' : 'grayscale'}`}>
                                        {achievement.icon}
                                    </span>
                                    <p className="text-white font-medium mt-2">{achievement.name}</p>
                                    <p className="text-white/50 text-sm">{achievement.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Research Info */}
            <section className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span>📊</span> Informasi Penelitian
                </h2>
                <p className="text-white/70 mb-4">
                    Aplikasi ini adalah bagian dari penelitian skripsi tentang pembelajaran
                    algoritma dan berpikir komputasional. Aktivitas kamu akan direkam untuk
                    analisis data penelitian.
                </p>
                <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                        Mode: {isGamified ? 'Gamified' : 'Non-Gamified'}
                    </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                        Group: {userSession?.groupType || 'N/A'}
                    </span>
                </div>
            </section>
        </div>
    )
}
