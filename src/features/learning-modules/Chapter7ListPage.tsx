import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'

const activities = [
    {
        id: 'ap-k7-02',
        code: 'AP-K7-02',
        title: 'Objek Pertama Kalian',
        description: 'Gerakkan kucing ke titik tujuan menggunakan blok Gerak Maju dan Putar.',
        emoji: '🐱',
        color: '#3b82f6',
        embedPath: '/embed/ap-k7-02',
    },
    {
        id: 'ap-k7-03',
        code: 'AP-K7-03',
        title: 'Jalan Tanpa Henti',
        description: 'Buat kucing berjalan membentuk persegi menggunakan blok Ulangi (Loop).',
        emoji: '🔄',
        color: '#10b981',
        embedPath: '/embed/ap-k7-03',
    },
    {
        id: 'ap-k7-04',
        code: 'AP-K7-04',
        title: 'Bermain dengan Suara & Lebih Natural',
        description: 'Buat gerakan lebih natural dengan blok Tunggu dan pola kompleks.',
        emoji: '🎵',
        color: '#8b5cf6',
        embedPath: '/embed/ap-k7-04',
    },
    {
        id: 'ap-k7-08',
        code: 'AP-K7-08-U',
        title: 'Bermain Robot Manual',
        description: 'Navigasikan 4 robot melewati jalur di atas grid 10×10 menuju titik Finish.',
        emoji: '🤖',
        color: '#f97316',
        embedPath: '/embed/ap-k7-08',
    },
]

export default function Chapter7ListPage() {
    const { isGamified, userSession } = useAppStore()
    const navigate = useNavigate()

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <Link to="/" className="text-white/60 hover:text-white transition-colors mb-2 inline-block text-sm">
                    ← Kembali ke Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span>🧩</span> Bab 7: Algoritma Pemrograman Visual
                </h1>
                <p className="text-white/60 mt-1">
                    Pilih aktivitas untuk belajar membuat program visual seperti Scratch!
                </p>
            </div>

            {/* XP badge (gamified users) */}
            {isGamified && userSession && (
                <div className="flex gap-3">
                    <span className="text-sm px-3 py-1.5 bg-yellow-500/15 text-yellow-400 rounded-full font-semibold border border-yellow-500/20">
                        ⭐ {userSession.xp} XP
                    </span>
                    <span className="text-sm px-3 py-1.5 bg-slate-700/60 text-slate-300 rounded-full font-semibold border border-slate-600/40">
                        🏅 Level {userSession.level}
                    </span>
                </div>
            )}

            {/* Activity cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activities.map((activity) => (
                    <button
                        key={activity.id}
                        onClick={() => navigate(activity.embedPath)}
                        className="flex items-center gap-4 bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600/60
                                   rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.98] group"
                    >
                        {/* Icon */}
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                            style={{ backgroundColor: activity.color + '25' }}
                        >
                            {activity.emoji}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: activity.color }}>
                                {activity.code}
                            </p>
                            <p className="text-white font-semibold text-base leading-tight mb-1">
                                {activity.title}
                            </p>
                            <p className="text-white/50 text-sm leading-snug">
                                {activity.description}
                            </p>
                        </div>

                        {/* Arrow */}
                        <span className="text-white/25 text-2xl group-hover:text-white/50 transition-colors flex-shrink-0">›</span>
                    </button>
                ))}
            </div>

            {/* Info box */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
                <p className="text-white/60 text-sm leading-relaxed">
                    💡 Aktivitas ini menggunakan <strong className="text-white/80">Blockly</strong> — drag-and-drop blok untuk membuat program,
                    lalu jalankan dan lihat karakter bergerak!
                </p>
            </div>
        </div>
    )
}
