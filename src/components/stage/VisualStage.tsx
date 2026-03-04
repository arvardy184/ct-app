import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect, Group, Text, Line, Circle } from 'react-konva'
import type { ExecutionCommand } from '../../types'
import { useAppStore } from '../../stores/useAppStore'

// Play cat meow sound via Web Audio API (no file needed)
function playCatSound() {
    try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(900, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.12)
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.35)
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
    } catch { /* audio not available */ }
}

// Cat sprite as a simple shape group
// costume 0 = normal, costume 1 = singing (open mouth + squinting eyes)
const CatSprite = ({ x, y, rotation, costume = 0 }: { x: number; y: number; rotation: number; costume?: number }) => {
    const mouthOpen = costume === 1
    return (
        <Group x={x} y={y} rotation={rotation} offsetX={20} offsetY={20}>
            {/* Body */}
            <Rect
                x={0}
                y={10}
                width={40}
                height={30}
                fill="#FF9500"
                cornerRadius={8}
                shadowColor="black"
                shadowBlur={5}
                shadowOpacity={0.3}
            />
            {/* Head */}
            <Circle
                x={20}
                y={8}
                radius={15}
                fill="#FF9500"
            />
            {/* Ears */}
            <Line
                points={[8, 0, 12, -12, 18, 2]}
                fill="#FF9500"
                closed
            />
            <Line
                points={[32, 0, 28, -12, 22, 2]}
                fill="#FF9500"
                closed
            />
            {/* Eyes — squint when singing */}
            {mouthOpen ? (
                <>
                    <Line points={[10, 4, 18, 7]} stroke="black" strokeWidth={2} lineCap="round" />
                    <Line points={[22, 7, 30, 4]} stroke="black" strokeWidth={2} lineCap="round" />
                </>
            ) : (
                <>
                    <Circle x={14} y={5} radius={4} fill="white" />
                    <Circle x={26} y={5} radius={4} fill="white" />
                    <Circle x={14} y={5} radius={2} fill="black" />
                    <Circle x={26} y={5} radius={2} fill="black" />
                </>
            )}
            {/* Nose */}
            <Circle x={20} y={12} radius={2} fill="#FF6B6B" />
            {/* Mouth — open when singing */}
            {mouthOpen && (
                <Line points={[15, 15, 20, 20, 25, 15]} stroke="#FF6B6B" strokeWidth={2} lineCap="round" lineJoin="round" />
            )}
            {/* Direction indicator (arrow) */}
            <Line
                points={[40, 25, 55, 25, 50, 20, 55, 25, 50, 30]}
                stroke="#4CAF50"
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
            />
        </Group>
    )
}

// Grid background
const GridBackground = ({ width, height }: { width: number; height: number }) => {
    const gridLines = []
    const gridSize = 40

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
        gridLines.push(
            <Line
                key={`v-${x}`}
                points={[x, 0, x, height]}
                stroke="#e5e7eb"
                strokeWidth={1}
            />
        )
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
        gridLines.push(
            <Line
                key={`h-${y}`}
                points={[0, y, width, y]}
                stroke="#e5e7eb"
                strokeWidth={1}
            />
        )
    }

    // Center crosshair
    gridLines.push(
        <Line
            key="center-h"
            points={[0, height / 2, width, height / 2]}
            stroke="#d1d5db"
            strokeWidth={2}
            dash={[10, 5]}
        />,
        <Line
            key="center-v"
            points={[width / 2, 0, width / 2, height]}
            stroke="#d1d5db"
            strokeWidth={2}
            dash={[10, 5]}
        />
    )

    return <>{gridLines}</>
}

export interface VisualStageRef {
    executeCommands: (commands: ExecutionCommand[]) => Promise<void>
    reset: () => void
}

interface VisualStageProps {
    width?: number
    height?: number
    onExecutionComplete?: () => void
    onExecutionStart?: () => void
}

const VisualStage = forwardRef<VisualStageRef, VisualStageProps>(({
    width = 480,
    height = 400,
    onExecutionComplete,
    onExecutionStart
}, ref) => {
    const { sprite, setSpritePosition, setSpriteRotation, setAnimating, isGamified, addXP } = useAppStore()
    const [consoleOutput, setConsoleOutput] = useState<string[]>([])
    const [isExecuting, setIsExecuting] = useState(false)
    const animationRef = useRef<number | null>(null)
    const [costume, setCostume] = useState(0)
    const costumeRef = useRef(0)

    // Initialize sprite position
    useEffect(() => {
        setSpritePosition(width / 2, height / 2)
        setSpriteRotation(0)
    }, [width, height, setSpritePosition, setSpriteRotation])

    // Animation helper
    const animateValue = useCallback((
        start: number,
        end: number,
        duration: number,
        onUpdate: (value: number) => void
    ): Promise<void> => {
        return new Promise((resolve) => {
            const startTime = performance.now()

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime
                const progress = Math.min(elapsed / duration, 1)

                // Easing function (ease-out)
                const eased = 1 - Math.pow(1 - progress, 3)
                const currentValue = start + (end - start) * eased

                onUpdate(currentValue)

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate)
                } else {
                    resolve()
                }
            }

            animationRef.current = requestAnimationFrame(animate)
        })
    }, [])

    // Execute a single command
    const executeCommand = useCallback(async (command: ExecutionCommand): Promise<void> => {
        const currentSprite = useAppStore.getState().sprite
        const ANIMATION_DURATION = 300 // ms

        switch (command.type) {
            case 'move': {
                const radians = (currentSprite.rotation - 90) * (Math.PI / 180)
                const targetX = currentSprite.x + Math.cos(radians) * command.value * 3
                const targetY = currentSprite.y + Math.sin(radians) * command.value * 3

                // Clamp to stage bounds
                const clampedX = Math.max(20, Math.min(width - 20, targetX))
                const clampedY = Math.max(20, Math.min(height - 20, targetY))

                const startX = currentSprite.x
                const startY = currentSprite.y

                await animateValue(0, 1, ANIMATION_DURATION, (progress) => {
                    setSpritePosition(
                        startX + (clampedX - startX) * progress,
                        startY + (clampedY - startY) * progress
                    )
                })

                setConsoleOutput(prev => [...prev, `🚀 Bergerak ${command.value} langkah`])
                break
            }

            case 'turnRight': {
                const startRotation = currentSprite.rotation
                const targetRotation = startRotation + command.value

                await animateValue(startRotation, targetRotation, ANIMATION_DURATION, (value) => {
                    setSpriteRotation(value)
                })

                setConsoleOutput(prev => [...prev, `↪️ Putar kanan ${command.value}°`])
                break
            }

            case 'turnLeft': {
                const startRotation = currentSprite.rotation
                const targetRotation = startRotation - command.value

                await animateValue(startRotation, targetRotation, ANIMATION_DURATION, (value) => {
                    setSpriteRotation(value)
                })

                setConsoleOutput(prev => [...prev, `↩️ Putar kiri ${command.value}°`])
                break
            }

            case 'wait': {
                setConsoleOutput(prev => [...prev, `⏱️ Menunggu ${command.value} detik...`])
                await new Promise(resolve => setTimeout(resolve, command.value * 1000))
                break
            }

            case 'changeX': {
                const newX = Math.max(20, Math.min(width - 20, currentSprite.x + command.value))
                await animateValue(currentSprite.x, newX, ANIMATION_DURATION, (val) => {
                    setSpritePosition(val, useAppStore.getState().sprite.y)
                })
                setConsoleOutput(prev => [...prev, `↔️ Ubah X sebesar ${command.value}`])
                break
            }

            case 'changeY': {
                const newY = Math.max(20, Math.min(height - 20, currentSprite.y - command.value))
                await animateValue(currentSprite.y, newY, ANIMATION_DURATION, (val) => {
                    setSpritePosition(useAppStore.getState().sprite.x, val)
                })
                setConsoleOutput(prev => [...prev, `↕️ Ubah Y sebesar ${command.value}`])
                break
            }

            case 'goTo': {
                const targetX = Math.max(20, Math.min(width - 20, width / 2 + command.x))
                const targetY = Math.max(20, Math.min(height - 20, height / 2 - command.y))
                const startX = currentSprite.x
                const startY = currentSprite.y
                await animateValue(0, 1, ANIMATION_DURATION, (progress) => {
                    setSpritePosition(
                        startX + (targetX - startX) * progress,
                        startY + (targetY - startY) * progress
                    )
                })
                setConsoleOutput(prev => [...prev, `📍 Pergi ke (${command.x}, ${command.y})`])
                break
            }

            case 'nextCostume': {
                costumeRef.current = (costumeRef.current + 1) % 2
                setCostume(costumeRef.current)
                setConsoleOutput(prev => [...prev, `🎭 Ganti kostum`])
                break
            }

            case 'playSound': {
                playCatSound()
                setConsoleOutput(prev => [...prev, `🔊 Meow!`])
                await new Promise(resolve => setTimeout(resolve, 450))
                break
            }
        }
    }, [width, height, animateValue, setSpritePosition, setSpriteRotation])

    // Execute all commands
    const executeCommands = useCallback(async (commands: ExecutionCommand[]) => {
        if (commands.length === 0) return

        setIsExecuting(true)
        setAnimating(true)
        setConsoleOutput(['▶️ Memulai eksekusi...'])
        onExecutionStart?.()

        try {
            for (const command of commands) {
                await executeCommand(command)
            }

            setConsoleOutput(prev => [...prev, '✅ Program selesai!'])

            // Award XP in gamified mode
            if (isGamified) {
                const xpEarned = Math.min(commands.length * 5, 50)
                addXP(xpEarned)
                setConsoleOutput(prev => [...prev, `🎉 +${xpEarned} XP!`])
            }
        } catch (error) {
            setConsoleOutput(prev => [...prev, `❌ Error: ${(error as Error).message}`])
        } finally {
            setIsExecuting(false)
            setAnimating(false)
            onExecutionComplete?.()
        }
    }, [executeCommand, isGamified, addXP, setAnimating, onExecutionStart, onExecutionComplete])

    // Reset stage
    const reset = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        setSpritePosition(width / 2, height / 2)
        setSpriteRotation(0)
        costumeRef.current = 0
        setCostume(0)
        setConsoleOutput([])
        setIsExecuting(false)
        setAnimating(false)
    }, [width, height, setSpritePosition, setSpriteRotation, setAnimating])

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        executeCommands,
        reset
    }), [executeCommands, reset])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [])

    return (
        <div className="flex flex-col gap-4">
            {/* Stage Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-slate-800 font-bold flex items-center gap-2 text-lg">
                    <span>🎬</span> Visual Stage
                </h3>
                <button
                    onClick={reset}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-semibold 
                     rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                    🔄 Reset Posisi
                </button>
            </div>

            {/* Canvas Stage */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative">
                <Stage width={width} height={height}>
                    <Layer>
                        {/* Background */}
                        <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />

                        {/* Grid */}
                        <GridBackground width={width} height={height} />

                        {/* Cat Sprite */}
                        <CatSprite x={sprite.x} y={sprite.y} rotation={sprite.rotation} costume={costume} />

                        {/* Position indicator */}
                        <Text
                            x={10}
                            y={height - 25}
                            text={`X: ${Math.round(sprite.x)} Y: ${Math.round(sprite.y)} ∠${Math.round(sprite.rotation)}°`}
                            fontSize={12}
                            fontFamily="monospace"
                            fill="#64748b"
                            fontStyle="bold"
                        />
                    </Layer>
                </Stage>
            </div>

            {/* Console Output */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                <h3 className="text-slate-800 font-bold mb-3 flex items-center gap-2">
                    <span>💻</span> Output Konsol
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 h-32 overflow-y-auto font-mono text-sm border border-slate-200 shadow-inner">
                    {consoleOutput.length === 0 ? (
                        <p className="text-slate-500 italic">
                            Klik "Jalankan" untuk melihat hasil eksekusi...
                        </p>
                    ) : (
                        consoleOutput.map((line, i) => (
                            <p key={i} className="text-indigo-600 font-bold mb-1.5">{line}</p>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
})

VisualStage.displayName = 'VisualStage'

export default VisualStage
