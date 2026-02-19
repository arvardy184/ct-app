import { useRef, useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BlocklyWorkspace from '../../components/blockly/BlocklyWorkspace'
import VisualStage, { VisualStageRef } from '../../components/stage/VisualStage'
import { useTimeTracker } from '../../hooks/useTimeTracker'
import { useAppStore } from '../../stores/useAppStore'
import { sendToNative, isWebView } from '../../lib/bridge'
import type { ExecutionCommand } from '../../types'

interface Chapter7PageProps {
    isEmbedded?: boolean
}

export default function Chapter7Page({ isEmbedded = false }: Chapter7PageProps) {
    const stageRef = useRef<VisualStageRef>(null)
    const [commands, setCommands] = useState<ExecutionCommand[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const { isGamified } = useAppStore()

    const { getElapsedTime } = useTimeTracker({
        activityName: 'chapter7_visual_programming',
        autoStart: true,
    })

    // Detect embedded mode and auth token from native
    useEffect(() => {
        if (isEmbedded && isWebView()) {
            const token = (window as any).__NATIVE_AUTH_TOKEN__
            const gamified = (window as any).__IS_GAMIFIED__
            console.log('🔌 Running in WebView - Auth token:', token ? 'Present' : 'Missing')
            console.log('🎮 Gamification mode:', gamified)
            
            // Update store if needed
            if (typeof gamified === 'boolean') {
                useAppStore.setState({ isGamified: gamified })
            }
        }
    }, [isEmbedded])

    const handleCommandsGenerated = useCallback((newCommands: ExecutionCommand[]) => {
        setCommands(newCommands)
    }, [])

    const handleExecute = useCallback(() => {
        if (stageRef.current && commands.length > 0) {
            stageRef.current.executeCommands(commands)
        }
    }, [commands])

    const handleExecutionStart = useCallback(() => {
        setIsRunning(true)
    }, [])

    const handleExecutionComplete = useCallback(() => {
        setIsRunning(false)
        
        // Send completion to Native - Mobile app will handle XP & logging
        if (isEmbedded) {
            sendToNative({
                type: 'ACTIVITY_COMPLETE',
                data: {
                    score: 10,
                    timeSpent: getElapsedTime()
                }
            })
        }
    }, [getElapsedTime, isEmbedded])

    // Minimalist embedded view - just the game
    if (isEmbedded) {
        return (
            <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
                    {/* Blockly Workspace */}
                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-lg overflow-hidden">
                        <BlocklyWorkspace
                            onCommandsGenerated={handleCommandsGenerated}
                            onExecute={handleExecute}
                            isRunning={isRunning}
                        />
                    </div>

                    {/* Visual Stage */}
                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-lg p-4 flex items-center justify-center">
                        <VisualStage
                            ref={stageRef}
                            width={Math.min(480, window.innerWidth - 100)}
                            height={Math.min(400, window.innerHeight - 100)}
                            onExecutionStart={handleExecutionStart}
                            onExecutionComplete={handleExecutionComplete}
                        />
                    </div>
                </div>
            </div>
        )
    }

    // Full web view - with all context and instructions
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/" className="text-white/60 hover:text-white transition-colors mb-2 inline-block">
                        ← Kembali ke Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span>🧩</span> Bab 7: Visual Programming
                    </h1>
                    <p className="text-white/60 mt-2">
                        Buat program visual seperti Scratch untuk menggerakkan karakter
                    </p>
                </div>

                {/* Timer */}
                <div className="bg-slate-800/50 px-4 py-2 rounded-lg">
                    <p className="text-white/60 text-sm">Waktu Belajar</p>
                    <TimerDisplay getElapsedTime={getElapsedTime} />
                </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">📌 Tujuan Pembelajaran</h2>
                <ul className="space-y-2 text-white/80">
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Memahami konsep pemrograman visual
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Membuat urutan perintah (sequence)
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Menggunakan perulangan (loop) untuk efisiensi
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Menguji dan memperbaiki program (debugging)
                    </li>
                </ul>
            </div>

            {/* Main Content - Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Blockly Workspace */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm 
                        border border-slate-700/50 rounded-2xl p-6">
                    <BlocklyWorkspace
                        onCommandsGenerated={handleCommandsGenerated}
                        onExecute={handleExecute}
                        isRunning={isRunning}
                    />
                </div>

                {/* Right: Visual Stage */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm 
                        border border-slate-700/50 rounded-2xl p-6">
                    <VisualStage
                        ref={stageRef}
                        width={480}
                        height={400}
                        onExecutionStart={handleExecutionStart}
                        onExecutionComplete={handleExecutionComplete}
                    />
                </div>
            </div>

            {/* Challenge Section */}
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🎯 Tantangan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ChallengeCard
                        title="Persegi"
                        description="Buat kucing menggambar persegi dengan 4 sisi sama panjang"
                        xp={20}
                        isGamified={isGamified}
                    />
                    <ChallengeCard
                        title="Bintang"
                        description="Buat kucing berputar membentuk pola bintang"
                        xp={30}
                        isGamified={isGamified}
                    />
                    <ChallengeCard
                        title="Spiral"
                        description="Buat kucing bergerak dalam pola spiral"
                        xp={50}
                        isGamified={isGamified}
                    />
                </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">💡 Tips</h2>
                <ul className="space-y-2 text-white/70">
                    <li>• Mulai dengan blok <strong>"Ketika Bendera Hijau diklik"</strong></li>
                    <li>• Gunakan blok <strong>"Ulangi"</strong> untuk mengurangi jumlah blok</li>
                    <li>• Untuk membuat persegi: maju 10 langkah, putar 90 derajat, ulangi 4x</li>
                    <li>• Klik tombol <strong>"Reset Posisi"</strong> untuk mengembalikan kucing ke tengah</li>
                </ul>
            </div>
        </div>
    )
}

// Challenge Card Component
function ChallengeCard({
    title,
    description,
    xp,
    isGamified
}: {
    title: string
    description: string
    xp: number
    isGamified: boolean
}) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-yellow-500/50 transition-colors">
            <h3 className="text-white font-bold mb-2">{title}</h3>
            <p className="text-white/60 text-sm mb-3">{description}</p>
            {isGamified && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">
                    +{xp} XP
                </span>
            )}
        </div>
    )
}

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
