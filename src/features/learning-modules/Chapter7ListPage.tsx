import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { supabase, getCompletedActivities } from '../../lib/supabase'

const activities = [
    {
        id: 'ap-k7-02',
        code: 'AP-K7-02',
        title: 'Objek Pertama Kalian',
        description: 'Gerakkan kucing ke titik tujuan menggunakan blok Gerak Maju dan Putar.',
        emoji: '🐱',
        color: '#3b82f6', // blue-500
        embedPath: '/embed/ap-k7-02',
    },
    {
        id: 'ap-k7-03',
        code: 'AP-K7-03',
        title: 'Jalan Tanpa Henti',
        description: 'Buat kucing berjalan membentuk persegi menggunakan blok Ulangi (Loop).',
        emoji: '🔄',
        color: '#10b981', // emerald-500
        embedPath: '/embed/ap-k7-03',
    },
    {
        id: 'ap-k7-04',
        code: 'AP-K7-04',
        title: 'Bermain dengan Suara & Lebih Natural',
        description: 'Buat gerakan lebih natural dengan blok Tunggu dan pola kompleks.',
        emoji: '🎵',
        color: '#8b5cf6', // violet-500
        embedPath: '/embed/ap-k7-04',
    },
    {
        id: 'ap-k7-08',
        code: 'AP-K7-08-U',
        title: 'Bermain Robot Manual',
        description: 'Navigasikan 4 robot melewati jalur di atas grid 10×10 menuju titik Finish.',
        emoji: '🤖',
        color: '#f97316', // orange-500
        embedPath: '/embed/ap-k7-08',
    },
]

export default function Chapter7ListPage() {
    const { isGamified, userSession } = useAppStore()
    const navigate = useNavigate()
    const [completed, setCompleted] = useState<Set<string>>(new Set())

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session?.user?.id) {
                getCompletedActivities(data.session.user.id).then(setCompleted)
            }
        })
    }, [])

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Header */}
            <div>
                <Link to="/" className="text-slate-500 hover:text-slate-800 transition-colors mb-2 inline-block text-sm font-semibold">
                    ← Kembali ke Dashboard
                </Link>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <span>🧩</span> Bab 7: Algoritma Pemrograman Visual
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                    Pilih aktivitas untuk belajar membuat program visual seperti Scratch!
                </p>
            </div>

            {/* XP badge (gamified users) */}
            {isGamified && userSession && (
                <div className="flex gap-3">
                    <span className="text-sm px-4 py-1.5 bg-yellow-50 text-yellow-600 rounded-full font-bold border border-yellow-200 shadow-sm">
                        ⭐ {userSession.xp} XP
                    </span>
                    <span className="text-sm px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full font-bold border border-indigo-200 shadow-sm">
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
                        className="flex items-center gap-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300
                                   rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.98] group shadow-sm hover:shadow"
                    >
                        {/* Icon */}
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl shadow-sm border border-black/5"
                            style={{ backgroundColor: activity.color + '15' }} // slightly tinted background
                        >
                            {activity.emoji}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: activity.color }}>
                                {activity.code}
                            </p>
                            <p className="text-slate-800 font-bold text-lg leading-tight mb-1.5 group-hover:text-indigo-600 transition-colors">
                                {activity.title}
                            </p>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                {activity.description}
                            </p>
                        </div>

                        {/* Done badge / Arrow */}
                        {completed.has(activity.code)
                            ? <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-600 text-sm font-black shadow-sm" title="Selesai">✓</span>
                            : <span className="text-slate-300 text-3xl group-hover:text-slate-400 transition-colors flex-shrink-0">›</span>
                        }
                    </button>
                ))}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                <p className="text-blue-800 text-sm font-medium leading-relaxed">
                    💡 <strong className="font-bold text-blue-900">Info:</strong> Aktivitas ini menggunakan <strong className="font-bold border-b-2 border-blue-300">Blockly</strong> — drag-and-drop blok untuk membuat program,
                    lalu jalankan dan lihat karakter bergerak!
                </p>
            </div>
        </div>
    )
}
