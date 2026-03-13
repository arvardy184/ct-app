import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { Stage, Layer, Rect, Text, Group, Circle, Arrow } from 'react-konva'
import { robotToolboxConfig, parseRobotCode, registerRobotBlocks } from '../../components/blockly/robotBlocks'
import type { RobotCommand } from '../../components/blockly/robotBlocks'
import { useTimeTracker } from '../../hooks/useTimeTracker'
import { useAppStore } from '../../stores/useAppStore'
import { sendToNative, isWebView } from '../../lib/bridge'
import { setAuthTokenFromNative, logActivity, supabase } from '../../lib/supabase'

registerRobotBlocks()

// ── Grid constants ────────────────────────────────────────────────────────────
const COLS = 10
const ROWS = 10
const FINISH_COL = 7  // H
const FINISH_ROW = 6  // row 7, 0-indexed from bottom

// ── Sprite definitions ────────────────────────────────────────────────────────
// direction: 0=UP, 90=RIGHT, 180=DOWN, 270=LEFT  (clockwise)
const SPRITE_DEFS = [
    { name: 'Si Merah', color: '#ef4444', startCol: 0, startRow: 8, startDir: 90 }, // A9  →
    { name: 'Si Pink', color: '#ec4899', startCol: 1, startRow: 0, startDir: 0 }, // B1  ↑
    { name: 'Si Hijau', color: '#22c55e', startCol: 7, startRow: 0, startDir: 0 }, // H1  ↑
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
        if (dir === 0) return [0, -cellSize * 0.4]
        if (dir === 90) return [cellSize * 0.4, 0]
        if (dir === 180) return [0, cellSize * 0.4]
        return [-cellSize * 0.4, 0]
    }

    return (
        <Stage width={W} height={H}>
            <Layer>
                {/* Background */}
                <Rect x={0} y={0} width={W} height={H} fill="#ffffff" />

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
                                    fill={isFinish ? '#fef08a' : '#f8fafc'}
                                    stroke="#e2e8f0"
                                    strokeWidth={1}
                                />
                                {isFinish && (
                                    <Text
                                        x={sx} y={sy + cellSize * 0.25}
                                        width={cellSize} align="center"
                                        text="F" fontSize={cellSize * 0.45}
                                        fontStyle="bold" fill="#854d0e"
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
                        fontStyle="bold"
                        fill="#64748b"
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
                        fontStyle="bold"
                        fill="#64748b"
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
                                stroke={s.reached ? '#fde047' : '#ffffff'}
                                strokeWidth={s.reached ? 3 : 1.5}
                                shadowColor="rgba(0,0,0,0.15)"
                                shadowBlur={4}
                                shadowOffset={{ x: 0, y: 2 }}
                            />
                            {/* Direction arrow */}
                            <Arrow
                                points={[sx, sy, sx + ax, sy + ay]}
                                pointerLength={cellSize * 0.15}
                                pointerWidth={cellSize * 0.12}
                                fill="white" stroke="white"
                                strokeWidth={2}
                            />
                            {/* Speech bubble */}
                            {s.saying && (
                                <Group>
                                    <Rect
                                        x={sx - 22} y={sy - r - 26}
                                        width={44} height={20}
                                        fill="white" cornerRadius={6}
                                        shadowColor="rgba(0,0,0,0.1)" shadowBlur={4} shadowOffset={{ x: 0, y: 2 }}
                                    />
                                    <Text
                                        x={sx - 22} y={sy - r - 24}
                                        width={44} align="center"
                                        text={s.saying}
                                        fontSize={10} fill="#1e293b" fontStyle="bold"
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RobotManualPage() {
    const STEP_DELAY = 280 // ms per grid step

    const [activeSprite, setActiveSprite] = useState(0)
    const [sprites, setSprites] = useState<SpriteState[]>(initSprites)
    const [spriteCodes, setSpriteCodes] = useState<string[]>(['', '', '', ''])
    // Per-sprite workspace XML strings (to swap when switching sprite tabs)
    const spriteXmlRef = useRef<string[]>(['', '', '', ''])
    const workspaceCodeRef = useRef<string>('')
    const wsRef = useRef<Blockly.WorkspaceSvg | null>(null)
    const wsContainerRef = useRef<HTMLDivElement>(null)

    const [isRunning, setIsRunning] = useState(false)
    const [activeTab, setActiveTab] = useState<'editor' | 'grid'>('editor')
    const [allReached, setAllReached] = useState(false)

    const navigate = useNavigate()
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

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        const isMobile = isTouchDevice || window.innerWidth < 768

        wsRef.current = Blockly.inject(wsContainerRef.current, {
            toolbox: robotToolboxConfig,
            grid: { spacing: 20, length: 2, colour: '#cbd5e1', snap: true },
            zoom: {
                controls: true,
                wheel: true,
                pinch: true,
                startScale: isMobile ? 1.0 : 0.9,
                maxScale: 1.8,
                minScale: 0.4,
                scaleSpeed: 1.2,
            },
            move: {
                scrollbars: true,
                drag: true,
                wheel: true,
            },
            trashcan: true,
            sounds: false,
            renderer: 'zelos',
            theme: Blockly.Theme.defineTheme('robot_theme_light', {
                name: 'robot_theme_light',
                base: Blockly.Themes.Classic,
                componentStyles: {
                    workspaceBackgroundColour: '#f8fafc',
                    toolboxBackgroundColour: '#ffffff',
                    toolboxForegroundColour: '#334155',
                    flyoutBackgroundColour: '#f1f5f9',
                    flyoutForegroundColour: '#1e293b',
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
        spriteXmlRef.current[activeSprite] = Blockly.utils.xml.domToText(xml)

        // Load new
        wsRef.current.clear()
        const savedXml = spriteXmlRef.current[newIndex]
        if (savedXml) {
            const dom = Blockly.utils.xml.textToDom(savedXml)
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
                if (isWebView()) {
                    sendToNative({ type: 'ACTIVITY_COMPLETE', data: { score: 50, timeSpent: getElapsedTime() } })
                } else {
                    // Browser mode: log directly to Supabase
                    supabase.auth.getSession().then(({ data }) => {
                        if (data.session?.user?.id) {
                            logActivity(data.session.user.id, 'AP-K7-08-U', getElapsedTime(), 1, 50, true)
                        }
                    })
                }
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
    const LABEL = 20
    const availableWidth = window.innerWidth - 32
    const cellSize = Math.floor((availableWidth - LABEL * 2) / COLS)

    return (
        <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden select-none">

            {/* ── Challenge banner ─────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10 transition-all">
                <div className="flex items-start gap-4">
                    {!isWebView() && (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex-shrink-0 mt-0.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg transition-all duration-150 border border-slate-200"
                        >← Kembali</button>
                    )}
                    <div className="flex-1">
                        <p className="text-slate-800 font-bold text-base leading-tight">🤖 AP-K7-08-U: Bermain Robot Manual</p>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">Program ke-4 sprite agar mencapai titik <strong className="text-slate-700">Finish (H7)</strong>. Pilih sprite lalu susun blok.</p>
                    </div>
                </div>
            </div>

            {/* ── Sprite selector ──────────────────────────────────── */}
            <div className="flex-shrink-0 flex gap-1.5 px-4 py-3 bg-slate-100 border-b border-slate-200 overflow-x-auto no-scrollbar shadow-inner">
                {SPRITE_DEFS.map((def, i) => (
                    <button
                        key={i}
                        onClick={() => switchSpriteTab(i)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 border flex-shrink-0 shadow-sm
                            ${activeSprite === i
                                ? 'bg-white text-slate-800 border-slate-200 scale-105'
                                : 'bg-white/50 text-slate-500 border-transparent hover:bg-white hover:text-slate-700'
                            }`}
                        style={activeSprite === i ? { borderBottomColor: def.color, borderBottomWidth: 3, marginBottom: -2 } : undefined}
                    >
                        <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-white"
                            style={{ backgroundColor: def.color }}
                        />
                        {def.name}
                        {spriteCodes[i] && <span className="text-green-500 w-4 inline-block text-center ml-1">✓</span>}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ──────────────────────────────────────── */}
            <div className="flex-1 min-h-0 relative">
                {/* Editor tab — visibility:hidden bukan display:none supaya
                    Blockly tetap tau dimensi container-nya (Android WebView issue) */}
                <div
                    className="absolute inset-0 flex"
                    style={{
                        visibility: activeTab === 'editor' ? 'visible' : 'hidden',
                        pointerEvents: activeTab === 'editor' ? 'auto' : 'none',
                        zIndex: activeTab === 'editor' ? 1 : 0,
                    }}
                >
                    <div ref={wsContainerRef} className="w-full h-full" style={{ touchAction: 'none' }} />
                </div>

                {/* Grid tab */}
                <div
                    className="absolute inset-0 overflow-y-auto bg-slate-50 flex flex-col"
                    style={{
                        visibility: activeTab === 'grid' ? 'visible' : 'hidden',
                        pointerEvents: activeTab === 'grid' ? 'auto' : 'none',
                        zIndex: activeTab === 'grid' ? 1 : 0,
                    }}
                >
                    <div className="flex flex-col items-center gap-4 p-4 pb-8">
                        {/* Win banner */}
                        {allReached && (
                            <div className="w-full py-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-center shadow-sm">
                                <p className="text-yellow-800 font-black text-lg">🎉 Semua Sprite Mencapai Finish!</p>
                                {isGamified && <p className="text-yellow-600 text-sm font-bold mt-1">+50 XP didapat!</p>}
                            </div>
                        )}

                        {/* Legend */}
                        <div className="w-full flex flex-wrap gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm justify-center">
                            {SPRITE_DEFS.map((def, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: def.color }} />
                                    <span className="text-slate-600 text-[10px] font-bold">{def.name}</span>
                                    {sprites[i].reached && <span className="text-green-500 font-black text-xs">✓</span>}
                                </div>
                            ))}
                            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
                                <span className="w-3.5 h-3.5 rounded-sm bg-yellow-300 border border-yellow-400 shadow-sm" />
                                <span className="text-slate-600 text-[10px] font-bold">Finish</span>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white p-1">
                            <RobotGridStage sprites={sprites} cellSize={cellSize} labelSize={LABEL} />
                        </div>

                        {/* Reset */}
                        <button
                            onClick={handleReset}
                            disabled={isRunning}
                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl border border-slate-200
                                       disabled:opacity-40 active:scale-95 transition-all duration-150 shadow-sm mt-2"
                        >
                            🔄 Reset Posisi
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Bottom bar ───────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                {/* Action row */}
                <div className="flex items-center gap-2 px-4 pt-3 pb-1 w-full overflow-x-auto no-scrollbar">
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 min-w-[150px]
                                   bg-green-600 text-white font-black rounded-xl text-sm shadow-sm
                                   disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed active:bg-green-700 hover:bg-green-700 transition-all duration-150"
                    >
                        {isRunning ? '⏳ Menjalankan...' : '▶ Jalankan Semua'}
                    </button>
                    <button
                        onClick={() => wsRef.current?.undo(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm
                                   active:scale-95 transition-all duration-150 flex-shrink-0"
                    >↩️</button>
                    <button
                        onClick={() => wsRef.current?.clear()}
                        disabled={isRunning}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm border border-red-100
                                   disabled:opacity-40 active:scale-95 transition-all duration-150 flex-shrink-0"
                    >🗑️</button>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-3 px-4 pt-2 pb-4">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                            ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                    >📝 Editor</button>
                    <button
                        onClick={() => setActiveTab('grid')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                            ${activeTab === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                    >🗺️ Grid</button>
                </div>
            </div>
        </div>
    )
}
