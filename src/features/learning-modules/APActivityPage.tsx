import { useRef, useState, useCallback, useEffect } from 'react'
import BlocklyWorkspace, { BlocklyWorkspaceRef } from '../../components/blockly/BlocklyWorkspace'
import VisualStage, { VisualStageRef } from '../../components/stage/VisualStage'
import { useTimeTracker } from '../../hooks/useTimeTracker'
import { useAppStore } from '../../stores/useAppStore'
import { sendToNative, isWebView } from '../../lib/bridge'
import { setAuthTokenFromNative } from '../../lib/supabase'
import type { ExecutionCommand } from '../../types'

// ─── Per-activity configuration ──────────────────────────────────────────────
interface ActivityConfig {
    title: string
    icon: string
    challenge: string
    objective: string
    tips: string[]
    color: string // Tailwind gradient classes
}

const ACTIVITY_CONFIGS: Record<string, ActivityConfig> = {
    'ap-k7-02': {
        title: 'AP-K7-02: Objek Pertama Kalian',
        icon: '🐱',
        challenge: 'Gerakkan kucing ke titik tujuan!',
        objective: 'Susun blok Gerak Maju dan Putar agar kucing mencapai sudut kanan bawah.',
        tips: [
            'Mulai dengan blok "Ketika program dimulai"',
            'Gunakan "Gerak Maju" untuk memindahkan kucing',
            'Gunakan "Putar Kanan/Kiri" untuk mengubah arah',
            'Coba beberapa kombinasi dan lihat hasilnya!',
        ],
        color: 'from-blue-500 to-cyan-600',
    },
    'ap-k7-03': {
        title: 'AP-K7-03: Jalan Tanpa Henti',
        icon: '🔄',
        challenge: 'Buat kucing berjalan membentuk persegi!',
        objective: 'Gunakan blok "Ulangi" untuk membuat kucing bergerak membentuk persegi dengan lebih sedikit blok.',
        tips: [
            'Persegi = 4 sisi yang sama panjang + 4 belokan 90°',
            'Tanpa loop: perlu 8 blok (Maju + Putar × 4)',
            'Dengan "Ulangi 4 kali": cukup 3 blok saja!',
            'Coba "Gerak Maju 10, Putar Kanan 90°" di dalam loop',
        ],
        color: 'from-green-500 to-emerald-600',
    },
    'ap-k7-04': {
        title: 'AP-K7-04: Bermain dengan Suara & Lebih Natural',
        icon: '🎵',
        challenge: 'Buat gerakan kucing lebih natural dan teratur!',
        objective: 'Gunakan blok "Tunggu" di antara gerakan agar kucing bergerak lebih alami, lalu eksplorasi pola gerakan baru.',
        tips: [
            'Blok "Tunggu 1 detik" memberi jeda antar gerakan',
            'Coba: Maju → Tunggu → Putar → Tunggu → Maju',
            'Kombinasikan dengan "Ulangi" untuk pola berulang',
            'Bereksperimenlah dengan sudut putar yang berbeda (45°, 60°, 90°)',
        ],
        color: 'from-purple-500 to-pink-600',
    },
    'ap-k7-08': {
        title: 'AP-K7-08-U: Bermain Robot Manual',
        icon: '🤖',
        challenge: 'Navigasikan robot melewati jalur tanpa keluar!',
        objective: 'Program kucing agar bergerak dari posisi awal (kiri atas) ke tujuan (kanan bawah) mengikuti jalur grid tanpa keluar batas.',
        tips: [
            'Perhatikan posisi X dan Y yang ditampilkan di stage',
            'Setiap "Gerak Maju 10" = 1 kotak grid ke depan',
            'Rencanakan rute dulu sebelum membuat blok',
            'Gunakan "Putar 90°" untuk berbelok di persimpangan',
        ],
        color: 'from-orange-500 to-red-600',
    },
}

// ─── Component ────────────────────────────────────────────────────────────────
interface APActivityPageProps {
    activityId: string
}

export default function APActivityPage({ activityId }: APActivityPageProps) {
    const config = ACTIVITY_CONFIGS[activityId] ?? ACTIVITY_CONFIGS['ap-k7-02']

    const stageRef = useRef<VisualStageRef>(null)
    const blocklyRef = useRef<BlocklyWorkspaceRef>(null)
    const [commands, setCommands] = useState<ExecutionCommand[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [activeTab, setActiveTab] = useState<'editor' | 'output'>('editor')
    const [blockCount, setBlockCount] = useState(0)
    const [showChallenge, setShowChallenge] = useState(true)

    const { isGamified } = useAppStore()
    const { getElapsedTime } = useTimeTracker({ activityName: activityId, autoStart: true })

    // Auth token injection from native
    useEffect(() => {
        if (isWebView()) {
            setAuthTokenFromNative().then((ok) => {
                console.log(`🔌 [${activityId}] Running in WebView`)
                console.log('🔐 Auth token:', ok ? 'Set ✅' : 'Missing ❌')
                const gamified = (window as any).__IS_GAMIFIED__
                if (typeof gamified === 'boolean') {
                    useAppStore.setState({ isGamified: gamified })
                }
            })
        }
    }, [activityId])

    const handleCommandsGenerated = useCallback((newCommands: ExecutionCommand[]) => {
        setCommands(newCommands)
        setBlockCount(blocklyRef.current?.getBlockCount() ?? 0)
    }, [])

    const handleExecute = useCallback(() => {
        if (stageRef.current && commands.length > 0) {
            stageRef.current.executeCommands(commands)
        }
    }, [commands])

    const handleExecutionStart = useCallback(() => setIsRunning(true), [])

    const handleExecutionComplete = useCallback(() => {
        setIsRunning(false)
        sendToNative({
            type: 'ACTIVITY_COMPLETE',
            data: { score: Math.max(10, 50 - blockCount), timeSpent: getElapsedTime() },
        })
    }, [getElapsedTime, blockCount])

    const hasCode = commands.length > 0

    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden select-none">

            {/* ── Challenge Banner (collapsible) ─────────────────────── */}
            {showChallenge && (
                <div className={`flex-shrink-0 bg-gradient-to-r ${config.color} p-3`}>
                    <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm leading-tight">{config.challenge}</p>
                            <p className="text-white/80 text-xs mt-0.5 leading-snug">{config.objective}</p>
                        </div>
                        <button
                            onClick={() => setShowChallenge(false)}
                            className="flex-shrink-0 text-white/70 hover:text-white text-lg leading-none"
                        >
                            ✕
                        </button>
                    </div>
                    {isGamified && (
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full font-medium">
                                🏆 Selesaikan tantangan untuk dapat XP!
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab Content ────────────────────────────────────────── */}
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
                <div className={`absolute inset-0 overflow-y-auto bg-slate-900 ${activeTab === 'output' ? 'flex flex-col' : 'hidden'}`}>
                    <div className="flex flex-col items-center gap-4 p-4 pb-2">
                        {/* Status */}
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

                        {/* Tips collapsible */}
                        <details className="w-full bg-slate-800/60 rounded-xl border border-slate-700/40">
                            <summary className="px-4 py-3 text-white/60 text-xs cursor-pointer hover:text-white/80 transition-colors">
                                💡 Tips untuk aktivitas ini
                            </summary>
                            <div className="px-4 pb-3 text-white/50 text-xs space-y-1.5 pt-1">
                                {config.tips.map((tip, i) => (
                                    <p key={i}>• {tip}</p>
                                ))}
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            {/* ── Fixed Bottom Bar ───────────────────────────────────── */}
            <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700/60">

                {/* Action buttons — editor tab only */}
                {activeTab === 'editor' && (
                    <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                        {/* Run */}
                        <button
                            onClick={() => { handleExecute(); setActiveTab('output') }}
                            disabled={isRunning || !hasCode}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5
                                       bg-gradient-to-r from-green-500 to-emerald-600
                                       text-white font-bold rounded-xl text-sm shadow
                                       disabled:opacity-40 disabled:cursor-not-allowed
                                       active:scale-95 transition-all duration-150"
                        >
                            <span>{isRunning ? '⏳' : '▶'}</span>
                            {isRunning ? 'Berjalan...' : 'Jalankan'}
                        </button>
                        <button
                            onClick={() => blocklyRef.current?.clear()}
                            disabled={isRunning}
                            className="px-3 py-2.5 bg-red-600/80 text-white rounded-xl text-sm
                                       disabled:opacity-40 active:scale-95 transition-all duration-150"
                            title="Hapus Semua"
                        >🗑️</button>
                        <button
                            onClick={() => blocklyRef.current?.undo()}
                            className="px-3 py-2.5 bg-slate-700 text-white rounded-xl text-sm
                                       active:scale-95 transition-all duration-150"
                            title="Undo"
                        >↩️</button>
                        <button
                            onClick={() => blocklyRef.current?.redo()}
                            className="px-3 py-2.5 bg-slate-700 text-white rounded-xl text-sm
                                       active:scale-95 transition-all duration-150"
                            title="Redo"
                        >↪️</button>
                        <div className="px-2 py-2.5 bg-slate-700/60 rounded-xl text-xs text-slate-300 font-medium whitespace-nowrap">
                            🧱 {blockCount}
                        </div>
                    </div>
                )}

                {/* Tab switcher */}
                <div className="flex gap-2 px-3 pt-1 pb-3">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-700/50 text-slate-400'}`}
                    >
                        📝 Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === 'output' ? 'bg-purple-600 text-white shadow' : 'bg-slate-700/50 text-slate-400'}`}
                    >
                        🎬 Output
                    </button>
                    {!showChallenge && (
                        <button
                            onClick={() => setShowChallenge(true)}
                            className={`flex items-center justify-center px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-gradient-to-r ${config.color} text-white`}
                            title="Lihat Tantangan"
                        >
                            🎯
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
