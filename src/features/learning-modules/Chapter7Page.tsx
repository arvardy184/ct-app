import { useRef, useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BlocklyWorkspace, { BlocklyWorkspaceRef } from '../../components/blockly/BlocklyWorkspace'
import VisualStage, { VisualStageRef } from '../../components/stage/VisualStage'
import { useTimeTracker } from '../../hooks/useTimeTracker'
import { useAppStore } from '../../stores/useAppStore'
import { sendToNative, isWebView } from '../../lib/bridge'
import { setAuthTokenFromNative } from '../../lib/supabase'
import type { ExecutionCommand } from '../../types'

interface Chapter7PageProps {
    isEmbedded?: boolean
}

export default function Chapter7Page({ isEmbedded = false }: Chapter7PageProps) {
    const stageRef = useRef<VisualStageRef>(null)
    const blocklyRef = useRef<BlocklyWorkspaceRef>(null)
    const [commands, setCommands] = useState<ExecutionCommand[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [activeTab, setActiveTab] = useState<'editor' | 'output'>('editor')
    const [blockCount, setBlockCount] = useState(0)
    const { isGamified } = useAppStore()

    const { getElapsedTime } = useTimeTracker({
        activityName: 'chapter7_visual_programming',
        autoStart: true,
    })

    // Detect embedded mode and auth token from native
    useEffect(() => {
        if (isEmbedded && isWebView()) {
            // Set auth token to Supabase client (async)
            setAuthTokenFromNative().then((tokenSet) => {
                console.log('🔌 Running in WebView')
                console.log('🔐 Auth token:', tokenSet ? 'Set ✅' : 'Missing ❌')
                
                // Read gamification mode from native
                const gamified = (window as any).__IS_GAMIFIED__
                console.log('🎮 Gamification mode:', gamified)
                
                // Update store if needed
                if (typeof gamified === 'boolean') {
                    useAppStore.setState({ isGamified: gamified })
                }
            })
        }
    }, [isEmbedded])

    const handleCommandsGenerated = useCallback((newCommands: ExecutionCommand[]) => {
        setCommands(newCommands)
        setBlockCount(blocklyRef.current?.getBlockCount() ?? 0)
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

    // Embedded mobile-optimised view — tab layout with fixed bottom bar
    if (isEmbedded) {
        const hasCode = commands.length > 0

        return (
            <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden select-none">

                {/* ── Tab Content ────────────────────────────────────── */}
                <div className="flex-1 min-h-0 relative">

                    {/* Editor Tab */}
                    <div className={`absolute inset-0 ${activeTab === 'editor' ? 'flex' : 'hidden'}`}>
                        <BlocklyWorkspace
                            ref={blocklyRef}
                            onCommandsGenerated={handleCommandsGenerated}
                            onExecute={handleExecute}
                            isRunning={isRunning}
                            hideControls
                        />
                    </div>

                    {/* Output Tab */}
                    <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden bg-slate-900 ${activeTab === 'output' ? 'flex flex-col' : 'hidden'}`}>
                        <div className="flex flex-col items-center gap-4 p-4 pb-2">
                            {/* Status badge */}
                            <div className="w-full flex items-center justify-between">
                                <span className="text-white/70 text-sm font-semibold">🎬 Visual Stage</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isRunning ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                    {isRunning ? '▶ Berjalan...' : '⏸ Siap'}
                                </span>
                            </div>

                            {/* Canvas */}
                            <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-purple-200/50">
                                <VisualStage
                                    ref={stageRef}
                                    width={window.innerWidth - 32}
                                    height={window.innerWidth - 32}
                                    onExecutionStart={handleExecutionStart}
                                    onExecutionComplete={handleExecutionComplete}
                                />
                            </div>

                            {/* Tips */}
                            <details className="w-full bg-slate-800/60 rounded-xl border border-slate-700/40">
                                <summary className="px-4 py-3 text-white/60 text-xs cursor-pointer hover:text-white/80 transition-colors">
                                    💡 Tips &amp; Cara Pakai
                                </summary>
                                <div className="px-4 pb-3 text-white/50 text-xs space-y-1.5 pt-1">
                                    <p>• Buka tab <strong className="text-white/70">Editor</strong> untuk menyusun blok</p>
                                    <p>• Tekan <strong className="text-white/70">▶ Jalankan</strong> di bawah untuk menjalankan program</p>
                                    <p>• Gunakan blok <strong className="text-white/70">"Ulangi"</strong> agar kode lebih ringkas</p>
                                    <p>• Tekan <strong className="text-white/70">↺ Reset</strong> pada stage untuk kembalikan kucing</p>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>

                {/* ── Fixed Bottom Bar ────────────────────────────────── */}
                <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700/60 safe-area-inset-bottom">

                    {/* Action buttons — only visible on editor tab */}
                    {activeTab === 'editor' && (
                        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                            {/* Run */}
                            <button
                                onClick={() => {
                                    handleExecute()
                                    setActiveTab('output')
                                }}
                                disabled={isRunning || !hasCode}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600
                                           text-white font-bold rounded-xl text-sm shadow
                                           disabled:opacity-40 disabled:cursor-not-allowed
                                           active:scale-95 transition-all duration-150"
                            >
                                <span>{isRunning ? '⏳' : '▶'}</span>
                                {isRunning ? 'Berjalan...' : 'Jalankan'}
                            </button>

                            {/* Clear */}
                            <button
                                onClick={() => blocklyRef.current?.clear()}
                                disabled={isRunning}
                                className="flex items-center justify-center gap-1 px-3 py-2.5 bg-red-600/80 text-white font-semibold rounded-xl text-sm
                                           disabled:opacity-40 active:scale-95 transition-all duration-150"
                                title="Hapus Semua"
                            >
                                🗑️
                            </button>

                            {/* Undo */}
                            <button
                                onClick={() => blocklyRef.current?.undo()}
                                className="flex items-center justify-center px-3 py-2.5 bg-slate-700 text-white rounded-xl text-sm
                                           active:scale-95 transition-all duration-150"
                                title="Undo"
                            >
                                ↩️
                            </button>

                            {/* Redo */}
                            <button
                                onClick={() => blocklyRef.current?.redo()}
                                className="flex items-center justify-center px-3 py-2.5 bg-slate-700 text-white rounded-xl text-sm
                                           active:scale-95 transition-all duration-150"
                                title="Redo"
                            >
                                ↪️
                            </button>

                            {/* Block count chip */}
                            <div className="flex items-center gap-1 px-2 py-2.5 bg-slate-700/60 rounded-xl text-xs text-slate-300 font-medium whitespace-nowrap">
                                🧱 {blockCount}
                            </div>
                        </div>
                    )}

                    {/* Tab switcher */}
                    <div className="flex gap-2 px-3 pt-1 pb-3">
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                                ${activeTab === 'editor'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            📝 Editor
                        </button>
                        <button
                            onClick={() => setActiveTab('output')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                                ${activeTab === 'output'
                                    ? 'bg-purple-600 text-white shadow'
                                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            🎬 Output
                        </button>
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
