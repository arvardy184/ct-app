import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect, Group, Text, Line, Circle } from 'react-konva'
import type { ExecutionCommand } from '../../types'
import { useAppStore } from '../../stores/useAppStore'

// Cat sprite as a simple shape group
const CatSprite = ({ x, y, rotation }: { x: number; y: number; rotation: number }) => {
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
            {/* Eyes */}
            <Circle x={14} y={5} radius={4} fill="white" />
            <Circle x={26} y={5} radius={4} fill="white" />
            <Circle x={14} y={5} radius={2} fill="black" />
            <Circle x={26} y={5} radius={2} fill="black" />
            {/* Nose */}
            <Circle x={20} y={12} radius={2} fill="#FF6B6B" />
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
    const { sprite, setSpritePosition, setSpriteRotation, resetSprite, setAnimating, isGamified, addXP } = useAppStore()
    const [consoleOutput, setConsoleOutput] = useState<string[]>([])
    const [isExecuting, setIsExecuting] = useState(false)
    const animationRef = useRef<number | null>(null)

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
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span>🎬</span> Visual Stage
                </h3>
                <button
                    onClick={reset}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm 
                     rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-colors"
                >
                    🔄 Reset Posisi
                </button>
            </div>

            {/* Canvas Stage */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border-4 border-purple-200">
                <Stage width={width} height={height}>
                    <Layer>
                        {/* Background */}
                        <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />

                        {/* Grid */}
                        <GridBackground width={width} height={height} />

                        {/* Cat Sprite */}
                        <CatSprite x={sprite.x} y={sprite.y} rotation={sprite.rotation} />

                        {/* Position indicator */}
                        <Text
                            x={10}
                            y={height - 25}
                            text={`X: ${Math.round(sprite.x)} Y: ${Math.round(sprite.y)} ∠${Math.round(sprite.rotation)}°`}
                            fontSize={12}
                            fontFamily="monospace"
                            fill="#6b7280"
                        />
                    </Layer>
                </Stage>
            </div>

            {/* Console Output */}
            <div className="bg-slate-900 rounded-xl p-4 shadow-lg">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                    <span>💻</span> Output Konsol
                </h3>
                <div className="bg-slate-800 rounded-lg p-3 h-32 overflow-y-auto font-mono text-sm">
                    {consoleOutput.length === 0 ? (
                        <p className="text-slate-500 italic">
                            Klik "Jalankan" untuk melihat hasil eksekusi...
                        </p>
                    ) : (
                        consoleOutput.map((line, i) => (
                            <p key={i} className="text-green-400 mb-1">{line}</p>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
})

VisualStage.displayName = 'VisualStage'

export default VisualStage
