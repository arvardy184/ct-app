import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { toolboxConfig, registerCustomBlocks } from './blocks/customBlocks'
import { isWebView } from '../../lib/bridge'
import type { ExecutionCommand } from '../../types'


registerCustomBlocks()

interface BlocklyWorkspaceProps {
    onCodeGenerated?: (code: string) => void
    onCommandsGenerated?: (commands: ExecutionCommand[]) => void
    onExecute?: () => void
    isRunning?: boolean
    hideControls?: boolean
}

export interface BlocklyWorkspaceRef {
    clear: () => void
    undo: () => void
    redo: () => void
    getBlockCount: () => number
    hasCode: () => boolean
    resize: () => void
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

 
    useEffect(() => {
        if (!blocklyDiv.current || workspaceRef.current) return

        
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        const isMobile = isTouchDevice || window.innerWidth < 768

        const workspace = Blockly.inject(blocklyDiv.current, {
            toolbox: toolboxConfig,
            grid: {
                spacing: 25,
                length: 3,
                colour: '#e2e8f0', 
                snap: true
            },
            zoom: {
                controls: true,
                wheel: true,
                pinch: true,    
                startScale: isMobile ? 1.0 : 0.9,    
                maxScale: 2,
                minScale: 0.3,
                scaleSpeed: 1.2
            },
            move: {
                scrollbars: true,
                drag: true,        
                wheel: true,       
            },
            trashcan: true,
            sounds: false,
            renderer: 'zelos',
            theme: Blockly.Theme.defineTheme('scratch_light', {
                name: 'scratch_light',
                base: Blockly.Themes.Classic,
                componentStyles: {
                    workspaceBackgroundColour: '#f8fafc', 
                    toolboxBackgroundColour: '#ffffff',
                    toolboxForegroundColour: '#334155', 
                    flyoutBackgroundColour: '#f1f5f9', 
                    flyoutForegroundColour: '#1e293b',
                    flyoutOpacity: 0.95,
                    scrollbarColour: '#cbd5e1',
                    insertionMarkerColour: '#000',
                    insertionMarkerOpacity: 0.2,
                    scrollbarOpacity: 0.8,
                    cursorColour: '#94a3b8', 
                },
                fontStyle: {
                    family: 'Inter, sans-serif',
                    weight: 'bold',
                    size: 12,
                },
            }),
        })
        workspaceRef.current = workspace

       
        Blockly.dialog.setPrompt((msg: string, defaultValue: string, callback: (val: string | null) => void) => {
            const asyncPrompt = (window as any).__asyncPrompt
            if (typeof asyncPrompt === 'function') {
            
                asyncPrompt(msg, defaultValue).then((result: string | null) => {
                    callback(result)
                })
            } else {
                callback(window.prompt(msg, defaultValue))
            }
        })


        const rafId = requestAnimationFrame(() => {
            if (workspaceRef.current) Blockly.svgResize(workspaceRef.current)
            if (blocklyDiv.current) {
                blocklyDiv.current.style.touchAction = 'none'
                const svg = blocklyDiv.current.querySelector('.blocklySvg') as HTMLElement | null
                if (svg) svg.style.touchAction = 'none'
            }
        })

        const resizeObserver = new ResizeObserver(() => {
            if (workspaceRef.current) Blockly.svgResize(workspaceRef.current)
        })
        resizeObserver.observe(blocklyDiv.current)

      
        const handleWindowResize = () => {
            if (workspaceRef.current) Blockly.svgResize(workspaceRef.current)
        }
        window.addEventListener('resize', handleWindowResize)

       
        // Override FieldNumber & FieldTextInput agar pakai modal kustom di WebView
        if (isWebView()) {
            const asyncPrompt = (window as any).__asyncPrompt
            if (asyncPrompt && (Blockly.FieldNumber as any).prototype) {
                ;(Blockly.FieldNumber as any).prototype.showEditor_ = function () {
                    const self = this
                    asyncPrompt('Masukkan angka:', String(self.getValue())).then((result: string | null) => {
                        if (result !== null && result !== undefined) {
                            const num = Number(result)
                            if (!isNaN(num)) self.setValue(num)
                        }
                    })
                }
            }
            if (asyncPrompt && (Blockly.FieldTextInput as any).prototype) {
                ;(Blockly.FieldTextInput as any).prototype.showEditor_ = function () {
                    const self = this
                    asyncPrompt('Masukkan teks:', String(self.getValue())).then((result: string | null) => {
                        if (result !== null && result !== undefined) self.setValue(result)
                    })
                }
            }
        }

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
    }, [])


    const parseSingleLine = (line: string): ExecutionCommand | null => {
        const moveMatch = line.match(/moveForward\((\d+)\)/)
        if (moveMatch) return { type: 'move', value: parseInt(moveMatch[1]) }
        const turnRightMatch = line.match(/turnRight\((\d+)\)/)
        if (turnRightMatch) return { type: 'turnRight', value: parseInt(turnRightMatch[1]) }
        const turnLeftMatch = line.match(/turnLeft\((\d+)\)/)
        if (turnLeftMatch) return { type: 'turnLeft', value: parseInt(turnLeftMatch[1]) }
        const waitMatch = line.match(/wait\(([\d.]+)\)/)
        if (waitMatch) return { type: 'wait', value: parseFloat(waitMatch[1]) }
        const changeXMatch = line.match(/changeX\((-?\d+)\)/)
        if (changeXMatch) return { type: 'changeX', value: parseInt(changeXMatch[1]) }
        const changeYMatch = line.match(/changeY\((-?\d+)\)/)
        if (changeYMatch) return { type: 'changeY', value: parseInt(changeYMatch[1]) }
        const goToMatch = line.match(/goTo\((-?\d+),\s*(-?\d+)\)/)
        if (goToMatch) return { type: 'goTo', x: parseInt(goToMatch[1]), y: parseInt(goToMatch[2]) }
        if (line.includes('nextCostume()')) return { type: 'nextCostume' }
        if (line.includes('playSound()')) return { type: 'playSound' }
        if (line.includes('bounceOnEdge()')) return { type: 'bounceOnEdge' }
        if (line.includes('startSound()')) return { type: 'startSound' }
        return null
    }

    const parseBlock = (lines: string[], cursor: { i: number }): ExecutionCommand[] => {
        const commands: ExecutionCommand[] = []
        while (cursor.i < lines.length) {
            const raw = lines[cursor.i]
            const line = raw.trim()
            cursor.i++

            if (!line) continue

            // Akhir blok — kembalikan ke caller
            if (line === '//REPEAT_END' || line === '//FOREVER_END' || line === '//IF_END') return commands

      
            const repeatMatch = line.match(/^\/\/REPEAT_START:(\d+)$/)
            if (repeatMatch) {
                const times = parseInt(repeatMatch[1])
                const body = parseBlock(lines, cursor)
                commands.push({ type: 'repeat', times, body })
                continue
            }

            // Forever loop
            if (line === '//FOREVER_START') {
                const body = parseBlock(lines, cursor) // rekursi, konsumsi sampai FOREVER_END
                commands.push({ type: 'forever', body })
                continue
            }

            // If at edge
            if (line === '//IF_AT_EDGE_START') {
                const body = parseBlock(lines, cursor)
                commands.push({ type: 'ifAtEdge', body })
                continue
            }

            // If NOT at edge
            if (line === '//IF_NOT_AT_EDGE_START') {
                const body = parseBlock(lines, cursor)
                commands.push({ type: 'ifNotAtEdge', body })
                continue
            }

            // Command biasa
            const cmd = parseSingleLine(line)
            if (cmd) commands.push(cmd)
        }
        return commands
    }

    const parseCommands = (code: string): ExecutionCommand[] => {
        const lines = code.split('\n')
        return parseBlock(lines, { i: 0 })
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
