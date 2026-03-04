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
        <p className="text-slate-800 font-mono text-xl font-bold">{formatTime(time)}</p>
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
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors mb-2 inline-block">
                        ← Kembali ke Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <span>🎨</span> Bab 2: Pengenalan Pola
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Belajar mengenali dan melanjutkan pola dengan aktivitas gelang manik-manik
                    </p>
                </div>

                {/* Timer */}
                <div className="bg-white border border-slate-200 shadow-sm px-5 py-3 rounded-xl text-center">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Waktu Belajar</p>
                    <TimerDisplay getElapsedTime={getElapsedTime} />
                </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-pink-50 border border-pink-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-pink-800 mb-4 flex items-center gap-2">
                    <span>📌</span> Tujuan Pembelajaran
                </h2>
                <ul className="space-y-3 text-pink-700 font-medium">
                    <li className="flex items-start gap-3">
                        <span className="text-pink-500 mt-0.5">✓</span>
                        Memahami konsep pola dan urutan
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-pink-500 mt-0.5">✓</span>
                        Mengidentifikasi pola yang berulang
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-pink-500 mt-0.5">✓</span>
                        Memprediksi elemen berikutnya dalam sebuah pola
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-pink-500 mt-0.5">✓</span>
                        Mengembangkan keterampilan berpikir komputasional
                    </li>
                </ul>
            </div>

            {/* Activity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <BeadPatternActivity onComplete={handleComplete} />
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <span>💡</span> Tips
                </h2>
                <ul className="space-y-2 text-blue-700 font-medium">
                    <li>• Perhatikan urutan warna yang muncul sebelum slot kosong</li>
                    <li>• Cari pola yang berulang (misalnya: AB AB AB...)</li>
                    <li>• Jangan terburu-buru, pikirkan dengan tenang</li>
                    <li>• Jika salah, perhatikan petunjuk yang diberikan</li>
                </ul>
            </div>
        </div>
    )
}
