import { useRef, useState, useCallback, useEffect } from 'react'
import BlocklyWorkspace, { BlocklyWorkspaceRef } from '../../components/blockly/BlocklyWorkspace'
import VisualStage, { VisualStageRef } from '../../components/stage/VisualStage'
import { useTimeTracker } from '../../hooks/useTimeTracker'
import { useAppStore } from '../../stores/useAppStore'
import { sendToNative, isWebView } from '../../lib/bridge'
import { ACTIVITY_XP_BAB7 } from '../../constants/gamification'
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
    const [toolboxVisible, setToolboxVisible] = useState(true)
    useAppStore()

    const { getElapsedTime } = useTimeTracker({
        activityName: 'chapter7_visual_programming',
        autoStart: true,
    })

    useEffect(() => {
        if (isEmbedded && isWebView()) {
            setAuthTokenFromNative().then(() => {
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
                data: { score: ACTIVITY_XP_BAB7['ap-k7-02'], timeSpent: getElapsedTime() }
            })
        }
    }, [getElapsedTime, isEmbedded])

    const hasCode = commands.length > 0

    return (
        <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden select-none">

         
            <div className="flex-1 min-h-0 relative">

                <div
                    className="absolute inset-0 flex"
                    style={{
                        visibility: activeTab === 'editor' ? 'visible' : 'hidden',
                        pointerEvents: activeTab === 'editor' ? 'auto' : 'none',
                        zIndex: activeTab === 'editor' ? 1 : 0,
                    }}
                >
                    <BlocklyWorkspace
                        ref={blocklyRef}
                        onCommandsGenerated={handleCommandsGenerated}
                        onExecute={handleExecute}
                        isRunning={isRunning}
                        hideControls
                    />
                </div>

     
                <div
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-slate-50 flex flex-col"
                    style={{
                        visibility: activeTab === 'output' ? 'visible' : 'hidden',
                        pointerEvents: activeTab === 'output' ? 'auto' : 'none',
                        zIndex: activeTab === 'output' ? 1 : 0,
                    }}
                >
                    <div className="flex flex-col items-center gap-4 p-4 pb-2">
                
                        <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                            <VisualStage
                                ref={stageRef}
                                width={window.innerWidth - 32}
                                height={window.innerWidth - 32}
                                onExecutionStart={handleExecutionStart}
                                onExecutionComplete={handleExecutionComplete}
                            />
                        </div>
                        <details className="w-full bg-white rounded-xl border border-slate-200 shadow-sm">
                            <summary className="px-4 py-3 text-slate-700 text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-colors rounded-xl">
                                💡 Tips &amp; Cara Pakai
                            </summary>
                            <div className="px-4 pb-4 text-slate-600 text-sm font-medium space-y-2 pt-1">
                                <p>• Buka tab <strong className="text-slate-800">Editor</strong> untuk menyusun blok</p>
                                <p>• Tekan <strong className="text-slate-800">▶ Jalankan</strong> di bawah untuk menjalankan program</p>
                                <p>• Gunakan blok <strong className="text-slate-800">"Ulangi"</strong> agar kode lebih ringkas</p>
                                <p>• Tekan <strong className="text-slate-800">↺ Reset</strong> pada stage untuk kembalikan kucing</p>
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-inset-bottom">

                {activeTab === 'editor' && (
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                        <button
                            onClick={() => { handleExecute(); setActiveTab('output') }}
                            disabled={isRunning || !hasCode}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600
                                       text-white font-bold rounded-xl text-sm shadow-sm
                                       disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
                                       active:bg-green-700 hover:bg-green-700 transition-all duration-150"
                        >
                            <span>{isRunning ? '⏳' : '▶'}</span>
                            {isRunning ? 'Berjalan...' : 'Jalankan'}
                        </button>
                        <button
                            onClick={() => blocklyRef.current?.clear()}
                            disabled={isRunning}
                            className="flex items-center justify-center gap-1 px-3 py-2.5 bg-red-100 text-red-600 hover:bg-red-200 font-semibold rounded-xl text-sm
                                       disabled:opacity-40 active:scale-95 transition-all duration-150"
                            title="Hapus Semua"
                        >🗑️</button>
                        <button
                            onClick={() => blocklyRef.current?.undo()}
                            className="flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm
                                       active:scale-95 transition-all duration-150"
                            title="Undo"
                        >↩️</button>
                        <button
                            onClick={() => blocklyRef.current?.redo()}
                            className="flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm
                                       active:scale-95 transition-all duration-150"
                            title="Redo"
                        >↪️</button>
                        <button
                            onClick={() => {
                                const next = blocklyRef.current?.toggleToolbox()
                                if (next !== undefined) setToolboxVisible(next)
                            }}
                            className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                                ${toolboxVisible
                                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            title={toolboxVisible ? 'Sembunyikan panel blok' : 'Tampilkan panel blok'}
                        >
                            {toolboxVisible ? '◀' : '▶'}
                        </button>
                        <div className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 rounded-xl text-xs text-slate-600 font-bold whitespace-nowrap">
                            🧱 {blockCount}
                        </div>
                    </div>
                )}

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
                </div>
            </div>
        </div>
    )
}
