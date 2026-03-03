import { useRef, useState, useCallback, useEffect } from 'react'
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

// This page is used only in embedded (WebView) mode via /embed/chapter7.
// Web dashboard uses Chapter7ListPage instead.
export default function Chapter7Page({ isEmbedded = false }: Chapter7PageProps) {
    const stageRef = useRef<VisualStageRef>(null)
    const blocklyRef = useRef<BlocklyWorkspaceRef>(null)
    const [commands, setCommands] = useState<ExecutionCommand[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [activeTab, setActiveTab] = useState<'editor' | 'output'>('editor')
    const [blockCount, setBlockCount] = useState(0)
    useAppStore()

    const { getElapsedTime } = useTimeTracker({
        activityName: 'chapter7_visual_programming',
        autoStart: true,
    })

    useEffect(() => {
        if (isEmbedded && isWebView()) {
            setAuthTokenFromNative().then((tokenSet) => {
                console.log('🔌 Running in WebView')
                console.log('🔐 Auth token:', tokenSet ? 'Set ✅' : 'Missing ❌')
                const gamified = (window as any).__IS_GAMIFIED__
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
        if (isEmbedded) {
            sendToNative({
                type: 'ACTIVITY_COMPLETE',
                data: { score: 10, timeSpent: getElapsedTime() }
            })
        }
    }, [getElapsedTime, isEmbedded])

    const hasCode = commands.length > 0

    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden select-none">

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
                <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden bg-slate-900 ${activeTab === 'output' ? 'flex flex-col' : 'hidden'}`}>
                    <div className="flex flex-col items-center gap-4 p-4 pb-2">
                        <div className="w-full flex items-center justify-between">
                            <span className="text-white/70 text-sm font-semibold">🎬 Visual Stage</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isRunning ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                {isRunning ? '▶ Berjalan...' : '⏸ Siap'}
                            </span>
                        </div>
                        <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-purple-200/50">
                            <VisualStage
                                ref={stageRef}
                                width={window.innerWidth - 32}
                                height={window.innerWidth - 32}
                                onExecutionStart={handleExecutionStart}
                                onExecutionComplete={handleExecutionComplete}
                            />
                        </div>
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

                {activeTab === 'editor' && (
                    <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                        <button
                            onClick={() => { handleExecute(); setActiveTab('output') }}
                            disabled={isRunning || !hasCode}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600
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
                            className="flex items-center justify-center gap-1 px-3 py-2.5 bg-red-600/80 text-white font-semibold rounded-xl text-sm
                                       disabled:opacity-40 active:scale-95 transition-all duration-150"
                            title="Hapus Semua"
                        >🗑️</button>
                        <button
                            onClick={() => blocklyRef.current?.undo()}
                            className="flex items-center justify-center px-3 py-2.5 bg-slate-700 text-white rounded-xl text-sm
                                       active:scale-95 transition-all duration-150"
                            title="Undo"
                        >↩️</button>
                        <button
                            onClick={() => blocklyRef.current?.redo()}
                            className="flex items-center justify-center px-3 py-2.5 bg-slate-700 text-white rounded-xl text-sm
                                       active:scale-95 transition-all duration-150"
                            title="Redo"
                        >↪️</button>
                        <div className="flex items-center gap-1 px-2 py-2.5 bg-slate-700/60 rounded-xl text-xs text-slate-300 font-medium whitespace-nowrap">
                            🧱 {blockCount}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 px-3 pt-1 pb-3">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}
                    >
                        📝 Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === 'output' ? 'bg-purple-600 text-white shadow' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}
                    >
                        🎬 Output
                    </button>
                </div>
            </div>
        </div>
    )
}
