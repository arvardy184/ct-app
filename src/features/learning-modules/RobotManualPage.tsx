import { useRef, useState, useCallback, useEffect } from 'react'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { Stage, Layer, Rect, Text, Group, Circle, Arrow } from 'react-konva'
import { robotToolboxConfig, parseRobotCode, registerRobotBlocks } from '../../components/blockly/robotBlocks'
import type { RobotCommand } from '../../components/blockly/robotBlocks'
import { useTimeTracker } from '../../hooks/useTimeTracker'
import { useAppStore } from '../../stores/useAppStore'
import { sendToNative, isWebView } from '../../lib/bridge'
import { setAuthTokenFromNative } from '../../lib/supabase'

registerRobotBlocks()

// ── Grid constants ────────────────────────────────────────────────────────────
const COLS = 10
const ROWS = 10
const FINISH_COL = 7  // H
const FINISH_ROW = 6  // row 7, 0-indexed from bottom

// ── Sprite definitions ────────────────────────────────────────────────────────
// direction: 0=UP, 90=RIGHT, 180=DOWN, 270=LEFT  (clockwise)
const SPRITE_DEFS = [
    { name: 'Si Merah',  color: '#ef4444', startCol: 0, startRow: 8, startDir: 90  }, // A9  →
    { name: 'Si Pink',   color: '#ec4899', startCol: 1, startRow: 0, startDir: 0   }, // B1  ↑
    { name: 'Si Hijau',  color: '#22c55e', startCol: 7, startRow: 0, startDir: 0   }, // H1  ↑
    { name: 'Si Kuning', color: '#eab308', startCol: 9, startRow: 9, startDir: 180 }, // J10 ↓
]

interface SpriteState {
    col: number
    row: number   // 0=row1 (bottom), 9=row10 (top)
    dir: number   // 0|90|180|270
    saying?: string
    reached: boolean
}

function initSprites(): SpriteState[] {
    return SPRITE_DEFS.map(d => ({
        col: d.startCol, row: d.startRow, dir: d.startDir, reached: false
    }))
}

// ── Grid Stage ────────────────────────────────────────────────────────────────
function RobotGridStage({
    sprites,
    cellSize,
    labelSize,
}: {
    sprites: SpriteState[]
    cellSize: number
    labelSize: number
}) {
    const W = labelSize + COLS * cellSize + labelSize
    const H = labelSize + ROWS * cellSize + labelSize

    // Convert game coords to screen coords
    const toScreenX = (col: number) => labelSize + col * cellSize + cellSize / 2
    const toScreenY = (row: number) => labelSize + (ROWS - 1 - row) * cellSize + cellSize / 2

    // Direction arrow offsets (points to)
    const dirArrow = (dir: number): [number, number] => {
        if (dir === 0)   return [0,   -cellSize * 0.4]
        if (dir === 90)  return [cellSize * 0.4, 0]
        if (dir === 180) return [0,   cellSize * 0.4]
        return [-cellSize * 0.4, 0]
    }

    return (
        <Stage width={W} height={H}>
            <Layer>
                {/* Background */}
                <Rect x={0} y={0} width={W} height={H} fill="#1e293b" />

                {/* Grid cells */}
                {Array.from({ length: ROWS }, (_, r) =>
                    Array.from({ length: COLS }, (_, c) => {
                        const isFinish = c === FINISH_COL && r === FINISH_ROW
                        const sx = labelSize + c * cellSize
                        const sy = labelSize + (ROWS - 1 - r) * cellSize
                        return (
                            <Group key={`${c}-${r}`}>
                                <Rect
                                    x={sx} y={sy}
                                    width={cellSize} height={cellSize}
                                    fill={isFinish ? '#fde047' : '#334155'}
                                    stroke="#475569"
                                    strokeWidth={0.5}
                                />
                                {isFinish && (
                                    <Text
                                        x={sx} y={sy + cellSize * 0.25}
                                        width={cellSize} align="center"
                                        text="F" fontSize={cellSize * 0.45}
                                        fontStyle="bold" fill="#1e293b"
                                    />
                                )}
                            </Group>
                        )
                    })
                )}

                {/* Column labels (A-J) at bottom */}
                {Array.from({ length: COLS }, (_, c) => (
                    <Text
                        key={`col-${c}`}
                        x={labelSize + c * cellSize}
                        y={H - labelSize + 3}
                        width={cellSize} align="center"
                        text={String.fromCharCode(65 + c)}
                        fontSize={labelSize * 0.6}
                        fill="#94a3b8"
                    />
                ))}

                {/* Row labels (1-10) at left */}
                {Array.from({ length: ROWS }, (_, r) => (
                    <Text
                        key={`row-${r}`}
                        x={2}
                        y={labelSize + (ROWS - 1 - r) * cellSize + cellSize / 2 - labelSize * 0.3}
                        width={labelSize - 4} align="right"
                        text={String(r + 1)}
                        fontSize={labelSize * 0.55}
                        fill="#94a3b8"
                    />
                ))}

                {/* Sprites */}
                {sprites.map((s, i) => {
                    const sx = toScreenX(s.col)
                    const sy = toScreenY(s.row)
                    const [ax, ay] = dirArrow(s.dir)
                    const r = cellSize * 0.36
                    return (
                        <Group key={i}>
                            {/* Circle body */}
                            <Circle
                                x={sx} y={sy} radius={r}
                                fill={SPRITE_DEFS[i].color}
                                stroke={s.reached ? '#fde047' : 'white'}
                                strokeWidth={s.reached ? 2.5 : 1}
                            />
                            {/* Direction arrow */}
                            <Arrow
                                points={[sx, sy, sx + ax, sy + ay]}
                                pointerLength={cellSize * 0.15}
                                pointerWidth={cellSize * 0.12}
                                fill="white" stroke="white"
                                strokeWidth={1.5}
                            />
                            {/* Speech bubble */}
                            {s.saying && (
                                <Group>
                                    <Rect
                                        x={sx - 22} y={sy - r - 26}
                                        width={44} height={20}
                                        fill="white" cornerRadius={4}
                                    />
                                    <Text
                                        x={sx - 22} y={sy - r - 24}
                                        width={44} align="center"
                                        text={s.saying}
                                        fontSize={10} fill="#1e293b"
                                    />
                                </Group>
                            )}
                        </Group>
                    )
                })}
            </Layer>
        </Stage>
    )
}

// ── Robot Blockly Workspace ───────────────────────────────────────────────────
function RobotWorkspace({
    onCodeChange,
    workspaceStateRef,
}: {
    onCodeChange: (code: string) => void
    workspaceStateRef: React.MutableRefObject<string>
}) {
    const divRef = useRef<HTMLDivElement>(null)
    const wsRef  = useRef<Blockly.WorkspaceSvg | null>(null)

    useEffect(() => {
        if (!divRef.current || wsRef.current) return

        wsRef.current = Blockly.inject(divRef.current, {
            toolbox: robotToolboxConfig,
            grid: { spacing: 20, length: 2, colour: '#e0e0e0', snap: true },
            zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.8, minScale: 0.5 },
            trashcan: true,
            scrollbars: true,
            sounds: false,
            renderer: 'zelos',
            theme: Blockly.Theme.defineTheme('robot', {
                name: 'robot',
                base: Blockly.Themes.Classic,
                componentStyles: {
                    workspaceBackgroundColour: '#f1f5f9',
                    toolboxBackgroundColour: '#1e293b',
                    toolboxForegroundColour: '#ffffff',
                    flyoutBackgroundColour: '#334155',
                    flyoutForegroundColour: '#ffffff',
                    flyoutOpacity: 0.97,
                },
            }),
        })

        wsRef.current.addChangeListener(() => {
            if (!wsRef.current) return
            const code = javascriptGenerator.workspaceToCode(wsRef.current)
            workspaceStateRef.current = code
            onCodeChange(code)
        })

        return () => { wsRef.current?.dispose(); wsRef.current = null }
    }, [])

    // Expose save/load via imperative approach
    ;(RobotWorkspace as any)._wsRef = wsRef

    return <div ref={divRef} className="w-full h-full" />
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RobotManualPage() {
    const STEP_DELAY = 280 // ms per grid step

    const [activeSprite, setActiveSprite] = useState(0)
    const [sprites, setSprites] = useState<SpriteState[]>(initSprites)
    const [spriteCodes, setSpriteCodes] = useState<string[]>(['', '', '', ''])
    // Per-sprite workspace XML strings (to swap when switching sprite tabs)
    const spriteXmlRef  = useRef<string[]>(['', '', '', ''])
    const workspaceCodeRef = useRef<string>('')
    const wsRef = useRef<Blockly.WorkspaceSvg | null>(null)
    const wsContainerRef = useRef<HTMLDivElement>(null)

    const [isRunning, setIsRunning] = useState(false)
    const [activeTab, setActiveTab] = useState<'editor' | 'grid'>('editor')
    const [allReached, setAllReached] = useState(false)

    const { isGamified } = useAppStore()
    const { getElapsedTime } = useTimeTracker({ activityName: 'ap-k7-08', autoStart: true })

    // Auth injection
    useEffect(() => {
        if (isWebView()) {
            setAuthTokenFromNative().then(() => {
                const gamified = (window as any).__IS_GAMIFIED__
                if (typeof gamified === 'boolean') useAppStore.setState({ isGamified: gamified })
            })
        }
    }, [])

    // Inject Blockly into the container once
    useEffect(() => {
        if (!wsContainerRef.current || wsRef.current) return

        wsRef.current = Blockly.inject(wsContainerRef.current, {
            toolbox: robotToolboxConfig,
            grid: { spacing: 20, length: 2, colour: '#e0e0e0', snap: true },
            zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.8, minScale: 0.5 },
            trashcan: true,
            scrollbars: true,
            sounds: false,
            renderer: 'zelos',
            theme: Blockly.Theme.defineTheme('robot_theme', {
                name: 'robot_theme',
                base: Blockly.Themes.Classic,
                componentStyles: {
                    workspaceBackgroundColour: '#f1f5f9',
                    toolboxBackgroundColour: '#1e293b',
                    toolboxForegroundColour: '#ffffff',
                    flyoutBackgroundColour: '#334155',
                    flyoutForegroundColour: '#ffffff',
                    flyoutOpacity: 0.97,
                },
            }),
        })

        wsRef.current.addChangeListener(() => {
            if (!wsRef.current) return
            const code = javascriptGenerator.workspaceToCode(wsRef.current)
            workspaceCodeRef.current = code
            setSpriteCodes(prev => {
                const next = [...prev]
                next[activeSprite] = code
                return next
            })
        })

        return () => { wsRef.current?.dispose(); wsRef.current = null }
    }, []) // only on mount

    // Save/load workspace XML when switching sprite tabs
    function switchSpriteTab(newIndex: number) {
        if (!wsRef.current || newIndex === activeSprite) return

        // Save current
        const xml = Blockly.Xml.workspaceToDom(wsRef.current)
        spriteXmlRef.current[activeSprite] = Blockly.Xml.domToText(xml)

        // Load new
        wsRef.current.clear()
        const savedXml = spriteXmlRef.current[newIndex]
        if (savedXml) {
            const dom = Blockly.Xml.textToDom(savedXml)
            Blockly.Xml.domToWorkspace(dom, wsRef.current)
        }
        setActiveSprite(newIndex)
    }

    // ── Execution engine ──────────────────────────────────────────────────────
    const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

    async function executeCommands(
        spriteIdx: number,
        commands: RobotCommand[],
        currentSprites: SpriteState[]
    ): Promise<SpriteState[]> {
        let state = [...currentSprites]

        for (const cmd of commands) {
            const s = state[spriteIdx]

            if (cmd.type === 'maju' && cmd.n !== undefined) {
                const dCol = [0, 1, 0, -1][s.dir / 90]
                const dRow = [1, 0, -1, 0][s.dir / 90]
                for (let step = 0; step < cmd.n; step++) {
                    state = state.map((sp, i) => i !== spriteIdx ? sp : {
                        ...sp,
                        col: Math.max(0, Math.min(COLS - 1, sp.col + dCol)),
                        row: Math.max(0, Math.min(ROWS - 1, sp.row + dRow)),
                    })
                    setSprites([...state])
                    await delay(STEP_DELAY)
                }
            } else if (cmd.type === 'putar' && cmd.n !== undefined) {
                state = state.map((sp, i) => i !== spriteIdx ? sp : {
                    ...sp,
                    dir: ((sp.dir + cmd.n!) % 360) as number,
                })
                setSprites([...state])
                await delay(STEP_DELAY * 0.6)
            } else if (cmd.type === 'bilang') {
                state = state.map((sp, i) => i !== spriteIdx ? sp : { ...sp, saying: cmd.text })
                setSprites([...state])
                await delay(1200)
                state = state.map((sp, i) => i !== spriteIdx ? sp : { ...sp, saying: undefined })
                setSprites([...state])
            } else if (cmd.type === 'ulangi' && cmd.body && cmd.n !== undefined) {
                for (let i = 0; i < cmd.n; i++) {
                    state = await executeCommands(spriteIdx, cmd.body, state)
                }
            } else if (cmd.type === 'jika_finish' && cmd.body) {
                const s2 = state[spriteIdx]
                if (s2.col === FINISH_COL && s2.row === FINISH_ROW) {
                    state = await executeCommands(spriteIdx, cmd.body, state)
                }
            }
        }
        return state
    }

    async function handleRun() {
        if (isRunning) return

        // Save current sprite workspace
        if (wsRef.current) {
            const xml = Blockly.Xml.workspaceToDom(wsRef.current)
            spriteXmlRef.current[activeSprite] = Blockly.Xml.domToText(xml)
        }

        setIsRunning(true)
        setAllReached(false)
        setActiveTab('grid')

        // Reset sprites
        const resetState = initSprites()
        setSprites(resetState)
        await delay(200)

        // Parse all 4 sprite codes
        const allCodes = spriteCodes.map((c, i) =>
            i === activeSprite ? workspaceCodeRef.current : c
        )
        const allCommands = allCodes.map(parseRobotCode)

        // Run all 4 concurrently — each keeps its own "current" state
        // We merge state updates via functional setState
        try {
            let sharedState = initSprites()

            await Promise.all(
                allCommands.map(async (cmds, i) => {
                    // Each sprite runs independently, updating shared state
                    const finalState = await executeCommands(i, cmds, sharedState)
                    sharedState = finalState
                })
            )

            // Mark sprites that reached finish
            setSprites(prev =>
                prev.map(s => ({
                    ...s,
                    reached: s.col === FINISH_COL && s.row === FINISH_ROW,
                }))
            )

            // Check win condition
            const reached = sharedState.filter(
                s => s.col === FINISH_COL && s.row === FINISH_ROW
            ).length
            if (reached === SPRITE_DEFS.length) {
                setAllReached(true)
                sendToNative({ type: 'ACTIVITY_COMPLETE', data: { score: 50, timeSpent: getElapsedTime() } })
            }
        } finally {
            setIsRunning(false)
        }
    }

    function handleReset() {
        setSprites(initSprites())
        setAllReached(false)
    }

    // ── Responsive cell size ──────────────────────────────────────────────────
    const LABEL = 18
    const availableWidth = window.innerWidth - 32
    const cellSize = Math.floor((availableWidth - LABEL * 2) / COLS)

    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden select-none">

            {/* ── Challenge banner ─────────────────────────────────── */}
            <div className="flex-shrink-0 bg-gradient-to-r from-orange-600 to-red-600 px-3 py-2">
                <p className="text-white font-bold text-sm">🤖 AP-K7-08-U: Bermain Robot Manual</p>
                <p className="text-white/80 text-xs mt-0.5">Program ke-4 sprite agar mencapai titik <strong>Finish (H7)</strong>. Pilih sprite lalu susun blok.</p>
            </div>

            {/* ── Sprite selector ──────────────────────────────────── */}
            <div className="flex-shrink-0 flex gap-1.5 px-3 py-2 bg-slate-800/80 border-b border-slate-700/50">
                {SPRITE_DEFS.map((def, i) => (
                    <button
                        key={i}
                        onClick={() => switchSpriteTab(i)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border
                            ${activeSprite === i
                                ? 'text-white border-transparent shadow'
                                : 'bg-slate-700/40 text-slate-400 border-slate-600/40 hover:text-white'
                            }`}
                        style={activeSprite === i ? { backgroundColor: def.color, borderColor: def.color } : undefined}
                    >
                        <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: activeSprite === i ? 'white' : def.color }}
                        />
                        {def.name}
                        {spriteCodes[i] ? ' ✓' : ''}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ──────────────────────────────────────── */}
            <div className="flex-1 min-h-0 relative">
                {/* Editor tab */}
                <div className={`absolute inset-0 ${activeTab === 'editor' ? 'flex' : 'hidden'}`}>
                    <div ref={wsContainerRef} className="w-full h-full" />
                </div>

                {/* Grid tab */}
                <div className={`absolute inset-0 overflow-y-auto bg-slate-900 ${activeTab === 'grid' ? 'flex flex-col' : 'hidden'}`}>
                    <div className="flex flex-col items-center gap-3 p-4">
                        {/* Win banner */}
                        {allReached && (
                            <div className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl text-center">
                                <p className="text-slate-900 font-black text-lg">🎉 Semua Sprite Mencapai Finish!</p>
                                {isGamified && <p className="text-slate-800 text-sm font-semibold mt-0.5">+50 XP didapat!</p>}
                            </div>
                        )}

                        {/* Legend */}
                        <div className="w-full flex flex-wrap gap-2">
                            {SPRITE_DEFS.map((def, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: def.color }} />
                                    <span className="text-slate-400 text-xs">{def.name}</span>
                                    {sprites[i].reached && <span className="text-yellow-400 text-xs">✓</span>}
                                </div>
                            ))}
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-yellow-300" />
                                <span className="text-slate-400 text-xs">Finish (H7)</span>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-xl">
                            <RobotGridStage sprites={sprites} cellSize={cellSize} labelSize={LABEL} />
                        </div>

                        {/* Reset */}
                        <button
                            onClick={handleReset}
                            disabled={isRunning}
                            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl
                                       disabled:opacity-40 active:scale-95 transition-all duration-150"
                        >
                            🔄 Reset Posisi
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Bottom bar ───────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700/60">
                {/* Action row */}
                <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5
                                   bg-gradient-to-r from-orange-500 to-red-600
                                   text-white font-bold rounded-xl text-sm shadow
                                   disabled:opacity-40 active:scale-95 transition-all duration-150"
                    >
                        {isRunning ? '⏳ Menjalankan...' : '▶ Jalankan Semua'}
                    </button>
                    <button
                        onClick={() => wsRef.current?.undo(false)}
                        className="px-3 py-2.5 bg-slate-700 text-white rounded-xl text-sm
                                   active:scale-95 transition-all duration-150"
                    >↩️</button>
                    <button
                        onClick={() => wsRef.current?.clear()}
                        disabled={isRunning}
                        className="px-3 py-2.5 bg-red-700/70 text-white rounded-xl text-sm
                                   disabled:opacity-40 active:scale-95 transition-all duration-150"
                    >🗑️</button>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-2 px-3 pt-1 pb-3">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-700/50 text-slate-400'}`}
                    >📝 Editor</button>
                    <button
                        onClick={() => setActiveTab('grid')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === 'grid' ? 'bg-orange-600 text-white shadow' : 'bg-slate-700/50 text-slate-400'}`}
                    >🗺️ Grid</button>
                </div>
            </div>
        </div>
    )
}
