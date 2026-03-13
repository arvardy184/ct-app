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
    resize: () => void
    /** Toggle toolbox sidebar. Returns state baru (true = visible). */
    toggleToolbox: () => boolean
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
    const [toolboxVisible, setToolboxVisible] = useState(true)

    // Initialize Blockly workspace
    useEffect(() => {
        if (!blocklyDiv.current || workspaceRef.current) return

        // Detect if running on a touch device / mobile
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        const isMobile = isTouchDevice || window.innerWidth < 768

        const workspace = Blockly.inject(blocklyDiv.current, {
            toolbox: toolboxConfig,
            grid: {
                spacing: 25,
                length: 3,
                colour: '#e2e8f0', // slate-200
                snap: true
            },
            zoom: {
                controls: true,
                wheel: true,
                pinch: true,       // Enable pinch-to-zoom on mobile
                startScale: isMobile ? 1.0 : 0.9,     // Larger scale on mobile for easier tapping
                maxScale: 2,
                minScale: 0.3,
                scaleSpeed: 1.2
            },
            move: {
                scrollbars: true,
                drag: true,        // Allow workspace panning via touch drag
                wheel: true,       // Allow workspace scroll via mouse wheel
            },
            trashcan: true,
            sounds: false,
            renderer: 'zelos',
            theme: Blockly.Theme.defineTheme('scratch_light', {
                name: 'scratch_light',
                base: Blockly.Themes.Classic,
                componentStyles: {
                    workspaceBackgroundColour: '#f8fafc', // slate-50
                    toolboxBackgroundColour: '#ffffff',
                    toolboxForegroundColour: '#334155', // slate-700
                    flyoutBackgroundColour: '#f1f5f9', // slate-100
                    flyoutForegroundColour: '#1e293b', // slate-800
                    flyoutOpacity: 0.95,
                    scrollbarColour: '#cbd5e1', // slate-300
                    insertionMarkerColour: '#000',
                    insertionMarkerOpacity: 0.2,
                    scrollbarOpacity: 0.8,
                    cursorColour: '#94a3b8', // slate-400
                },
                fontStyle: {
                    family: 'Inter, sans-serif',
                    weight: 'bold',
                    size: 12,
                },
            }),
        })
        workspaceRef.current = workspace

        // Force correct sizing after layout settles (flex/absolute containers can report 0 on first paint)
        const rafId = requestAnimationFrame(() => {
            if (workspaceRef.current) Blockly.svgResize(workspaceRef.current)
            // Mobile touch fix: set after Blockly injects its SVG elements
            if (blocklyDiv.current) {
                blocklyDiv.current.style.touchAction = 'none'
                const svg = blocklyDiv.current.querySelector('.blocklySvg') as HTMLElement | null
                if (svg) svg.style.touchAction = 'none'
            }
        })

        // Keep Blockly sized when the container is resized (e.g. challenge banner toggle)
        const resizeObserver = new ResizeObserver(() => {
            if (workspaceRef.current) Blockly.svgResize(workspaceRef.current)
        })
        resizeObserver.observe(blocklyDiv.current)

        // Also handle browser window resize
        const handleWindowResize = () => {
            if (workspaceRef.current) Blockly.svgResize(workspaceRef.current)
        }
        window.addEventListener('resize', handleWindowResize)

        // Listen for workspace changes
        workspace.addChangeListener((event) => {
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

        return () => {
            cancelAnimationFrame(rafId)
            resizeObserver.disconnect()
            window.removeEventListener('resize', handleWindowResize)
            if (workspaceRef.current) {
                workspaceRef.current.dispose()
                workspaceRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
            const changeXMatch = line.match(/changeX\((-?\d+)\)/)
            if (changeXMatch) commands.push({ type: 'changeX', value: parseInt(changeXMatch[1]) })
            const changeYMatch = line.match(/changeY\((-?\d+)\)/)
            if (changeYMatch) commands.push({ type: 'changeY', value: parseInt(changeYMatch[1]) })
            const goToMatch = line.match(/goTo\((-?\d+),\s*(-?\d+)\)/)
            if (goToMatch) commands.push({ type: 'goTo', x: parseInt(goToMatch[1]), y: parseInt(goToMatch[2]) })
            if (line.includes('nextCostume()')) commands.push({ type: 'nextCostume' })
            if (line.includes('playSound()')) commands.push({ type: 'playSound' })
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
        // Dipanggil setelah tab switch kembali ke editor (display: none → flex)
        // supaya Blockly tahu ukuran container yang benar dan tidak blank.
        resize: () => {
            requestAnimationFrame(() => {
                if (workspaceRef.current) Blockly.svgResize(workspaceRef.current)
            })
        },
        toggleToolbox: () => {
            const ws = workspaceRef.current
            if (!ws) return true
            const toolbox = ws.getToolbox()
            if (!toolbox) return true
            const next = !toolboxVisible
            toolbox.setVisible(next)
            // Resize supaya canvas mengisi ruang toolbox yang hilang/muncul
            requestAnimationFrame(() => Blockly.svgResize(ws))
            setToolboxVisible(next)
            return next
        },
    }), [clearWorkspace, undo, redo, blockCount, generatedCode, toolboxVisible])

    return (
        <div className="flex flex-col w-full h-full gap-3 p-2 bg-slate-50">
            {/* Control Buttons — hanya tampil di mode desktop */}
            {!hideControls && (
                <div className="flex items-center justify-between flex-shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex gap-2">
                        <button
                            onClick={onExecute}
                            disabled={isRunning || !generatedCode.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-600
                                       text-white font-bold rounded-xl shadow-sm
                                       disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
                                       hover:bg-green-700 active:scale-95 transition-all duration-150"
                        >
                            <span className="text-lg">{isRunning ? '⏳' : '🚩'}</span>
                            {isRunning ? 'Menjalankan...' : 'Jalankan'}
                        </button>
                        <button
                            onClick={clearWorkspace}
                            disabled={isRunning}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-100
                                       text-red-600 font-bold rounded-xl
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       hover:bg-red-100 active:scale-95 transition-all duration-150"
                        >
                            <span className="text-lg">🗑️</span>
                            Hapus
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={undo} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-200 hover:text-slate-800 transition-colors" title="Undo">↩️</button>
                        <button onClick={redo} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-200 hover:text-slate-800 transition-colors" title="Redo">↪️</button>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-slate-500">🧱</span>
                        <span className="text-slate-700 font-bold">{blockCount} Blok</span>
                    </div>
                </div>
            )}

            {/* Blockly Workspace */}
            <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 min-h-0 relative">
                <div ref={blocklyDiv} className="absolute inset-0" style={{ touchAction: 'none' }} />
            </div>

            {/* Generated Code Preview — hanya di desktop */}
            {!hideControls && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-slate-800 font-bold flex items-center gap-2">
                            <span>📝</span> Kode JavaScript
                        </h3>
                        <span className="text-slate-500 text-sm font-semibold bg-slate-100 px-3 py-1 rounded-full">
                            {generatedCode.split('\n').filter(l => l.trim()).length} baris
                        </span>
                    </div>
                    <pre className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 border border-slate-200 overflow-x-auto max-h-32 font-mono shadow-inner">
                        {generatedCode || '// Drag blocks ke workspace untuk mulai coding...'}
                    </pre>
                </div>
            )}
        </div>
    )
})

export default BlocklyWorkspace
