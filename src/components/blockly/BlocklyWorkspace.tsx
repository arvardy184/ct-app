import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { toolboxConfig, registerCustomBlocks } from './blocks/customBlocks'
import type { ExecutionCommand } from '../../types'

// Register custom blocks
registerCustomBlocks()

interface BlocklyWorkspaceProps {
    onCodeGenerated?: (code: string) => void
    onCommandsGenerated?: (commands: ExecutionCommand[]) => void
    onExecute?: () => void
    isRunning?: boolean
    /** Sembunyikan tombol kontrol bawaan — parent yang tangani (untuk mode mobile/embedded) */
    hideControls?: boolean
}

export interface BlocklyWorkspaceRef {
    clear: () => void
    undo: () => void
    redo: () => void
    getBlockCount: () => number
    hasCode: () => boolean
}

const BlocklyWorkspace = forwardRef<BlocklyWorkspaceRef, BlocklyWorkspaceProps>(function BlocklyWorkspace({
    onCodeGenerated,
    onCommandsGenerated,
    onExecute,
    isRunning = false,
    hideControls = false,
}, ref) {
    const blocklyDiv = useRef<HTMLDivElement>(null)
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
    const [generatedCode, setGeneratedCode] = useState<string>('')
    const [blockCount, setBlockCount] = useState(0)

    // Initialize Blockly workspace
    useEffect(() => {
        if (blocklyDiv.current && !workspaceRef.current) {
            workspaceRef.current = Blockly.inject(blocklyDiv.current, {
                toolbox: toolboxConfig,
                grid: {
                    spacing: 25,
                    length: 3,
                    colour: '#e0e0e0',
                    snap: true
                },
                zoom: {
                    controls: true,
                    wheel: true,
                    startScale: 0.9,
                    maxScale: 2,
                    minScale: 0.4,
                    scaleSpeed: 1.2
                },
                trashcan: true,
                scrollbars: true,
                sounds: false,
                renderer: 'zelos',
                theme: Blockly.Theme.defineTheme('scratch', {
                    name: 'scratch',
                    base: Blockly.Themes.Classic,
                    componentStyles: {
                        workspaceBackgroundColour: '#f9fafb',
                        toolboxBackgroundColour: '#1e293b',
                        toolboxForegroundColour: '#ffffff',
                        flyoutBackgroundColour: '#334155',
                        flyoutForegroundColour: '#ffffff',
                        flyoutOpacity: 0.95,
                        scrollbarColour: '#64748b',
                        insertionMarkerColour: '#fff',
                        insertionMarkerOpacity: 0.3,
                        scrollbarOpacity: 0.4,
                        cursorColour: '#d0d0d0',
                    },
                    fontStyle: {
                        family: 'Inter, sans-serif',
                        weight: 'bold',
                        size: 12,
                    },
                }),
            })

            // Listen for workspace changes
            workspaceRef.current.addChangeListener((event) => {
                if (event.type === Blockly.Events.BLOCK_MOVE ||
                    event.type === Blockly.Events.BLOCK_CHANGE ||
                    event.type === Blockly.Events.BLOCK_DELETE ||
                    event.type === Blockly.Events.BLOCK_CREATE) {
                    if (workspaceRef.current) {
                        const code = javascriptGenerator.workspaceToCode(workspaceRef.current)
                        setGeneratedCode(code)
                        onCodeGenerated?.(code)

                        const blocks = workspaceRef.current.getAllBlocks(false)
                        setBlockCount(blocks.length)

                        const commands = parseCommands(code)
                        onCommandsGenerated?.(commands)
                    }
                }
            })
        }

        return () => {
            if (workspaceRef.current) {
                workspaceRef.current.dispose()
                workspaceRef.current = null
            }
        }
    }, [onCodeGenerated, onCommandsGenerated])

    const parseCommands = (code: string): ExecutionCommand[] => {
        const commands: ExecutionCommand[] = []
        const lines = code.split('\n')
        for (const line of lines) {
            const moveMatch = line.match(/moveForward\((\d+)\)/)
            if (moveMatch) commands.push({ type: 'move', value: parseInt(moveMatch[1]) })
            const turnRightMatch = line.match(/turnRight\((\d+)\)/)
            if (turnRightMatch) commands.push({ type: 'turnRight', value: parseInt(turnRightMatch[1]) })
            const turnLeftMatch = line.match(/turnLeft\((\d+)\)/)
            if (turnLeftMatch) commands.push({ type: 'turnLeft', value: parseInt(turnLeftMatch[1]) })
            const waitMatch = line.match(/wait\(([\d.]+)\)/)
            if (waitMatch) commands.push({ type: 'wait', value: parseFloat(waitMatch[1]) })
        }
        return commands
    }

    const clearWorkspace = useCallback(() => {
        if (workspaceRef.current) {
            workspaceRef.current.clear()
            setGeneratedCode('')
            setBlockCount(0)
        }
    }, [])

    const undo = useCallback(() => {
        workspaceRef.current?.undo(false)
    }, [])

    const redo = useCallback(() => {
        workspaceRef.current?.undo(true)
    }, [])

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        clear: clearWorkspace,
        undo,
        redo,
        getBlockCount: () => blockCount,
        hasCode: () => generatedCode.trim().length > 0,
    }), [clearWorkspace, undo, redo, blockCount, generatedCode])

    return (
        <div className="flex flex-col h-full gap-2">
            {/* Control Buttons — hanya tampil di mode desktop */}
            {!hideControls && (
                <div className="flex items-center justify-between flex-shrink-0">
                    <div className="flex gap-2">
                        <button
                            onClick={onExecute}
                            disabled={isRunning || !generatedCode.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600
                           text-white font-bold rounded-xl shadow-lg hover:shadow-xl
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:from-green-400 hover:to-emerald-500
                           transform hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            <span className="text-xl">{isRunning ? '⏳' : '🚩'}</span>
                            {isRunning ? 'Menjalankan...' : 'Jalankan'}
                        </button>
                        <button
                            onClick={clearWorkspace}
                            disabled={isRunning}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600
                           text-white font-bold rounded-xl shadow-lg hover:shadow-xl
                           hover:from-red-400 hover:to-rose-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transform hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            <span className="text-xl">🗑️</span>
                            Hapus
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={undo} className="p-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors" title="Undo">↩️</button>
                        <button onClick={redo} className="p-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors" title="Redo">↪️</button>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-400">🧱</span>
                        <span className="text-white font-medium">{blockCount} Blok</span>
                    </div>
                </div>
            )}

            {/* Blockly Workspace — flex-1 agar isi semua sisa ruang */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-indigo-200/50 min-h-0">
                <div ref={blocklyDiv} className="w-full h-full" />
            </div>

            {/* Generated Code Preview — hanya di desktop */}
            {!hideControls && (
                <div className="bg-slate-900 rounded-xl p-4 shadow-lg flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <span>📝</span> Kode JavaScript
                        </h3>
                        <span className="text-slate-500 text-sm">
                            {generatedCode.split('\n').filter(l => l.trim()).length} baris
                        </span>
                    </div>
                    <pre className="bg-slate-800 rounded-lg p-3 text-sm text-blue-300 overflow-x-auto max-h-32 font-mono">
                        {generatedCode || '// Drag blocks ke workspace untuk mulai coding...'}
                    </pre>
                </div>
            )}
        </div>
    )
})

export default BlocklyWorkspace
