import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BeadPatternActivity from '../../components/activities/BeadPatternActivity'
import { useTimeTracker } from '../../hooks/useTimeTracker'

// Timer display component
function TimerDisplay({ getElapsedTime }: { getElapsedTime: () => number }) {
    const [time, setTime] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(getElapsedTime())
        }, 1000)

        return () => clearInterval(interval)
    }, [getElapsedTime])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <p className="text-white font-mono text-xl">{formatTime(time)}</p>
    )
}

export default function Chapter2Page() {
    const { finishActivity, getElapsedTime } = useTimeTracker({
        activityName: 'chapter2_bead_pattern',
        autoStart: true,
    })

    const handleComplete = async (score: number) => {
        const timeSpent = await finishActivity()
        console.log(`Chapter 2 completed! Score: ${score}, Time: ${timeSpent}s`)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/" className="text-white/60 hover:text-white transition-colors mb-2 inline-block">
                        ← Kembali ke Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span>🎨</span> Bab 2: Pengenalan Pola
                    </h1>
                    <p className="text-white/60 mt-2">
                        Belajar mengenali dan melanjutkan pola dengan aktivitas gelang manik-manik
                    </p>
                </div>

                {/* Timer */}
                <div className="bg-slate-800/50 px-4 py-2 rounded-lg">
                    <p className="text-white/60 text-sm">Waktu Belajar</p>
                    <TimerDisplay getElapsedTime={getElapsedTime} />
                </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-gradient-to-r from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">📌 Tujuan Pembelajaran</h2>
                <ul className="space-y-2 text-white/80">
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Memahami konsep pola dan urutan
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Mengidentifikasi pola yang berulang
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Memprediksi elemen berikutnya dalam sebuah pola
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Mengembangkan keterampilan berpikir komputasional
                    </li>
                </ul>
            </div>

            {/* Activity */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm 
                      border border-slate-700/50 rounded-2xl p-8">
                <BeadPatternActivity onComplete={handleComplete} />
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">💡 Tips</h2>
                <ul className="space-y-2 text-white/70">
                    <li>• Perhatikan urutan warna yang muncul sebelum slot kosong</li>
                    <li>• Cari pola yang berulang (misalnya: AB AB AB...)</li>
                    <li>• Jangan terburu-buru, pikirkan dengan tenang</li>
                    <li>• Jika salah, perhatikan petunjuk yang diberikan</li>
                </ul>
            </div>
        </div>
    )
}
