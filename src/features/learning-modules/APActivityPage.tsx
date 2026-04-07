import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BlocklyWorkspace, { BlocklyWorkspaceRef } from '../../components/blockly/BlocklyWorkspace'
import VisualStage, { VisualStageRef } from '../../components/stage/VisualStage'
import { useTimeTracker } from '../../hooks/useTimeTracker'
import { useAppStore } from '../../stores/useAppStore'
import { sendToNative, isWebView } from '../../lib/bridge'
import { ACTIVITY_XP_BAB7 } from '../../constants/gamification'
import { setAuthTokenFromNative, logActivity, upsertUserProgress, supabase } from '../../lib/supabase'
import type { ExecutionCommand } from '../../types'

interface ActivityConfig {
    title: string
    icon: string
    challenge: string
    objective: string
    tips: string[]
    color: string
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
        color: 'text-blue-600 bg-blue-50 border-blue-200',
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
        color: 'text-green-600 bg-green-50 border-green-200',
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
        color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
}

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
    const [toolboxVisible, setToolboxVisible] = useState(true)
    const [hasRun, setHasRun] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const navigate = useNavigate()
    const { isGamified } = useAppStore()
    const { getElapsedTime } = useTimeTracker({ activityName: activityId, autoStart: true })


    useEffect(() => {
        if (isWebView()) {
            setAuthTokenFromNative().then(() => {
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
        setHasRun(true)
        if (isWebView()) {
            const score = ACTIVITY_XP_BAB7[activityId] ?? Math.max(10, 50 - blockCount)
            sendToNative({ type: 'ACTIVITY_COMPLETE', data: { score, timeSpent: getElapsedTime() } })
        }
    }, [getElapsedTime, blockCount, activityId])

    const handleSubmit = useCallback(async () => {
        if (submitted || isSubmitting) return
        setIsSubmitting(true)
        const score = ACTIVITY_XP_BAB7[activityId] ?? Math.max(10, 50 - blockCount)
        const { data } = await supabase.auth.getSession()
        const uid = data.session?.user?.id
        if (uid) {
            await logActivity(uid, activityId.toUpperCase(), getElapsedTime(), 1, score, true)
            await upsertUserProgress(uid, 'chapter7', 'completed')
            await upsertUserProgress(uid, 'posttest_chapter7', 'unlocked')
        }
        setIsSubmitting(false)
        setSubmitted(true)
    }, [submitted, isSubmitting, activityId, blockCount, getElapsedTime])

    const hasCode = commands.length > 0

    return (
        <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden select-none">

        
            {showChallenge && (
                <div className="flex-shrink-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10 transition-all">
                    <div className="flex items-start gap-4">
                        {!isWebView() && (
                            <button
                                onClick={() => navigate(-1)}
                                className="flex-shrink-0 mt-0.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg transition-all duration-150 border border-slate-200"
                            >← Kembali</button>
                        )}
                        <span className="text-3xl flex-shrink-0">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-800 font-bold text-base leading-tight mb-0.5">{config.challenge}</p>
                            <p className="text-slate-500 text-xs leading-relaxed">{config.objective}</p>
                        </div>
                        <button
                            onClick={() => setShowChallenge(false)}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-700 text-lg font-bold leading-none p-1 rounded-md hover:bg-slate-100 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    {isGamified && (
                        <div className="mt-3 flex items-center gap-1.5">
                            <span className={`px-2.5 py-1 text-xs rounded-full font-bold border ${config.color}`}>
                                🏆 Selesaikan tantangan untuk XP!
                            </span>
                        </div>
                    )}
                </div>
            )}

   
            <div className="flex-1 min-h-0 relative">

                <div className={`absolute inset-0 flex ${activeTab === 'editor' ? 'z-10' : 'opacity-0 pointer-events-none z-0'}`}>
                    <BlocklyWorkspace
                        ref={blocklyRef}
                        onCommandsGenerated={handleCommandsGenerated}
                        onExecute={handleExecute}
                        isRunning={isRunning}
                        hideControls
                    />
                </div>

                {/* Output Tab */}
                <div className={`absolute inset-0 overflow-y-auto bg-slate-50 ${activeTab === 'output' ? 'flex flex-col z-10' : 'opacity-0 pointer-events-none z-0'}`}>
                    <div className="flex flex-col items-center gap-4 p-4 pb-2">
 

                        {/* Canvas */}
                        <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                            <VisualStage
                                ref={stageRef}
                                width={window.innerWidth - 32}
                                height={window.innerWidth - 32}
                                onExecutionStart={handleExecutionStart}
                                onExecutionComplete={handleExecutionComplete}
                            />
                        </div>

                        {/* Tips collapsible */}
                        <details className="w-full bg-white rounded-xl border border-slate-200 shadow-sm">
                            <summary className="px-4 py-3 text-slate-700 text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-colors rounded-xl flex items-center gap-2">
                                💡 Tips untuk aktivitas ini
                            </summary>
                            <div className="px-4 pb-4 text-slate-600 text-sm font-medium space-y-2 pt-1">
                                {config.tips.map((tip, i) => (
                                    <p key={i}>• <span className="text-slate-700">{tip}</span></p>
                                ))}
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            {/* ── Fixed Bottom Bar ───────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">

                {/* Action buttons — editor tab only */}
                {activeTab === 'editor' && (
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1 w-full overflow-x-auto no-scrollbar">
                        {/* Run */}
                        <button
                            onClick={() => { handleExecute(); setActiveTab('output') }}
                            disabled={isRunning || !hasCode}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 min-w-[120px]
                                       bg-green-600 text-white font-bold rounded-xl text-sm shadow-sm
                                       disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
                                       active:bg-green-700 hover:bg-green-700 transition-all duration-150"
                        >
                            <span>{isRunning ? '⏳' : '▶'}</span>
                            {isRunning ? 'Berjalan...' : 'Jalankan'}
                        </button>
                        <button
                            onClick={() => blocklyRef.current?.clear()}
                            disabled={isRunning}
                            className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold border border-red-100 rounded-xl text-sm
                                       disabled:opacity-40 active:scale-95 transition-all duration-150 flex-shrink-0"
                            title="Hapus Semua"
                        >🗑️</button>
                        <button
                            onClick={() => blocklyRef.current?.undo()}
                            className="px-4 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 font-bold rounded-xl text-sm
                                       active:scale-95 transition-all duration-150 flex-shrink-0"
                            title="Undo"
                        >↩️</button>
                        <button
                            onClick={() => blocklyRef.current?.redo()}
                            className="px-4 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 font-bold rounded-xl text-sm
                                       active:scale-95 transition-all duration-150 flex-shrink-0"
                            title="Redo"
                        >↪️</button>
                        <button
                            onClick={() => {
                                const next = blocklyRef.current?.toggleToolbox()
                                if (next !== undefined) setToolboxVisible(next)
                            }}
                            className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 flex-shrink-0
                                ${toolboxVisible
                                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            title={toolboxVisible ? 'Sembunyikan panel blok' : 'Tampilkan panel blok'}
                        >
                            {toolboxVisible ? '◀' : '▶'}
                        </button>
                        <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold whitespace-nowrap flex-shrink-0">
                            🧱 {blockCount}
                        </div>
                    </div>
                )}

                {/* Submit button — output tab, after running, web only */}
                {activeTab === 'output' && hasRun && !isWebView() && (
                    <div className="px-4 pt-3 pb-1">
                        {submitted ? (
                            <div className="flex items-center justify-center gap-2 py-2.5 bg-green-50 border border-green-200 text-green-700 font-bold rounded-xl text-sm">
                                ✅ Aktivitas berhasil dikumpulkan!
                            </div>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700
                                           text-white font-bold rounded-xl text-sm shadow-sm
                                           disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
                                           active:bg-indigo-800 transition-all duration-150"
                            >
                                {isSubmitting ? '⏳ Menyimpan...' : '📤 Kumpulkan'}
                            </button>
                        )}
                    </div>
                )}

                {/* Tab switcher */}
                <div className="flex gap-3 px-4 pt-2 pb-4">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                            ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                    >
                        📝 Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                            ${activeTab === 'output' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                    >
                        🎬 Output
                    </button>
                    {!showChallenge && (
                        <button
                            onClick={() => setShowChallenge(true)}
                            className={`flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${config.color} shadow-sm hover:opacity-80`}
                            title="Lihat Tantangan"
                        >
                            🎯 Target
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
