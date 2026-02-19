import { useState, useCallback } from 'react'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    useDraggable,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { useAppStore } from '../../stores/useAppStore'
import type { BeadColor, PatternLevel } from '../../types'

// Bead component
interface BeadProps {
    color: BeadColor
    id: string
    isDragging?: boolean
    size?: 'sm' | 'md' | 'lg'
}

const beadColorMap: Record<BeadColor, string> = {
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-400 to-yellow-500',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
}

const beadSizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
}

function Bead({ color, isDragging, size = 'md' }: BeadProps) {
    return (
        <div
            className={`
        ${beadSizeMap[size]} rounded-full bg-gradient-to-br ${beadColorMap[color]}
        shadow-lg border-4 border-white/30
        ${isDragging ? 'scale-110 shadow-2xl ring-4 ring-white/50' : ''}
        transition-all duration-200
      `}
            style={{
                boxShadow: isDragging
                    ? '0 20px 40px rgba(0,0,0,0.3)'
                    : 'inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)',
            }}
        >
            {/* Glass effect */}
            <div className="w-1/3 h-1/3 bg-white/40 rounded-full ml-2 mt-1" />
        </div>
    )
}

// Draggable bead
function DraggableBead({ id, color }: { id: string; color: BeadColor }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id,
        data: { color },
    })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
        >
            <Bead id={id} color={color} />
        </div>
    )
}

// Droppable slot
function DroppableSlot({
    id,
    isOver,
    hasCorrectAnswer,
    placedColor
}: {
    id: string
    isOver: boolean
    hasCorrectAnswer: boolean
    placedColor: BeadColor | null
}) {
    const { setNodeRef } = useDroppable({ id })

    return (
        <div
            ref={setNodeRef}
            className={`
        w-16 h-16 rounded-full border-4 border-dashed
        flex items-center justify-center
        transition-all duration-300
        ${isOver ? 'border-green-400 bg-green-400/20 scale-110' : 'border-white/30 bg-white/5'}
        ${hasCorrectAnswer ? 'border-green-500 bg-green-500/20' : ''}
      `}
        >
            {placedColor ? (
                <Bead id="placed" color={placedColor} size="lg" />
            ) : (
                <span className="text-white/30 text-2xl">?</span>
            )}
        </div>
    )
}

// Pattern levels
const patternLevels: PatternLevel[] = [
    { id: 1, pattern: ['red', 'blue', 'red', 'blue', 'red'], missingIndex: 4, difficulty: 'easy', xpReward: 10 },
    { id: 2, pattern: ['green', 'yellow', 'green', 'yellow', 'green'], missingIndex: 4, difficulty: 'easy', xpReward: 10 },
    { id: 3, pattern: ['red', 'red', 'blue', 'red', 'red', 'blue'], missingIndex: 5, difficulty: 'easy', xpReward: 15 },
    { id: 4, pattern: ['purple', 'orange', 'purple', 'orange', 'purple'], missingIndex: 2, difficulty: 'medium', xpReward: 20 },
    { id: 5, pattern: ['red', 'blue', 'green', 'red', 'blue', 'green'], missingIndex: 3, difficulty: 'medium', xpReward: 20 },
    { id: 6, pattern: ['yellow', 'yellow', 'red', 'yellow', 'yellow', 'red'], missingIndex: 2, difficulty: 'medium', xpReward: 25 },
    { id: 7, pattern: ['blue', 'green', 'red', 'blue', 'green', 'red', 'blue'], missingIndex: 6, difficulty: 'hard', xpReward: 30 },
    { id: 8, pattern: ['purple', 'orange', 'purple', 'purple', 'orange', 'purple'], missingIndex: 3, difficulty: 'hard', xpReward: 35 },
]

// Available bead colors for dragging
const availableColors: BeadColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']

interface BeadPatternActivityProps {
    onComplete?: (score: number) => void
}

export default function BeadPatternActivity({ onComplete }: BeadPatternActivityProps) {
    const { isGamified, addXP, addBadge } = useAppStore()
    const [currentLevel, setCurrentLevel] = useState(0)
    const [placedColor, setPlacedColor] = useState<BeadColor | null>(null)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [showHint, setShowHint] = useState(false)
    const [attempts, setAttempts] = useState(0)
    const [score, setScore] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    const level = patternLevels[currentLevel]

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }, [])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null)

        if (event.over?.id === 'drop-slot') {
            const color = event.active.data.current?.color as BeadColor
            setPlacedColor(color)
            setAttempts(prev => prev + 1)

            // Check if correct
            const correctColor = level.pattern[level.missingIndex]
            if (color === correctColor) {
                setIsCorrect(true)
                setShowHint(false)

                // Calculate XP
                const xpEarned = Math.max(level.xpReward - (attempts * 5), 5)
                if (isGamified) {
                    addXP(xpEarned)
                }

                setScore(prev => prev + xpEarned)

                // Award badge for completing all easy levels
                if (currentLevel === 2 && isGamified) {
                    addBadge('🎯')
                }

                // Move to next level after delay
                setTimeout(() => {
                    if (currentLevel < patternLevels.length - 1) {
                        setCurrentLevel(prev => prev + 1)
                        setPlacedColor(null)
                        setIsCorrect(null)
                        setShowHint(false)
                        setAttempts(0)
                    } else {
                        // Completed all levels!
                        setIsComplete(true)
                        if (isGamified) {
                            addBadge('🏆')
                            addXP(100) // Bonus XP
                        }
                        onComplete?.(score)
                    }
                }, 1500)
            } else {
                setIsCorrect(false)
                // Show hint after 2 wrong attempts
                if (attempts >= 1) {
                    setShowHint(true)
                }

                // Reset after showing wrong
                setTimeout(() => {
                    setPlacedColor(null)
                    setIsCorrect(null)
                }, 1000)
            }
        }
    }, [level, currentLevel, attempts, isGamified, addXP, addBadge, score, onComplete])

    if (isComplete) {
        return (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <div className="text-8xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-4">Selamat!</h2>
                <p className="text-xl text-white/70 mb-6">
                    Kamu telah menyelesaikan semua level!
                </p>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-2xl">
                    <p className="text-white text-2xl font-bold">Total Score: {score} XP</p>
                </div>
                <button
                    onClick={() => {
                        setCurrentLevel(0)
                        setScore(0)
                        setIsComplete(false)
                        setPlacedColor(null)
                        setIsCorrect(null)
                        setAttempts(0)
                    }}
                    className="mt-8 px-6 py-3 bg-white text-purple-600 font-bold rounded-xl 
                     hover:scale-105 transition-transform"
                >
                    Main Lagi
                </button>
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col gap-8">
                {/* Level Info */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                            Level {currentLevel + 1} / {patternLevels.length}
                        </h3>
                        <p className="text-white/60">
                            Kesulitan: {' '}
                            <span className={`font-medium ${level.difficulty === 'easy' ? 'text-green-400' :
                                    level.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                {level.difficulty === 'easy' ? 'Mudah' :
                                    level.difficulty === 'medium' ? 'Sedang' : 'Sulit'}
                            </span>
                        </p>
                    </div>

                    {isGamified && (
                        <div className="bg-yellow-500/20 px-4 py-2 rounded-lg">
                            <p className="text-yellow-400 font-bold">+{level.xpReward} XP</p>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-white text-lg">
                        🎨 <strong>Lengkapi Pola!</strong> Perhatikan urutan warna dan tempatkan
                        manik yang tepat pada posisi yang kosong.
                    </p>
                </div>

                {/* Pattern Display */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-xl">
                    <h4 className="text-white font-bold mb-6 text-center">Pola Gelang:</h4>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {level.pattern.map((color, index) => (
                            index === level.missingIndex ? (
                                <DroppableSlot
                                    key={index}
                                    id="drop-slot"
                                    isOver={activeId !== null}
                                    hasCorrectAnswer={isCorrect === true}
                                    placedColor={placedColor}
                                />
                            ) : (
                                <Bead key={index} id={`pattern-${index}`} color={color} size="lg" />
                            )
                        ))}
                    </div>

                    {/* Feedback */}
                    {isCorrect === true && (
                        <div className="mt-6 text-center animate-fade-in">
                            <p className="text-green-400 text-xl font-bold">✅ Benar! Lanjut ke level berikutnya...</p>
                        </div>
                    )}
                    {isCorrect === false && (
                        <div className="mt-6 text-center animate-fade-in">
                            <p className="text-red-400 text-xl font-bold">❌ Coba lagi!</p>
                        </div>
                    )}
                </div>

                {/* Hint */}
                {showHint && !isCorrect && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 animate-fade-in">
                        <p className="text-blue-300">
                            💡 <strong>Petunjuk:</strong> Perhatikan pola yang berulang.
                            Warna apa yang muncul setelah {level.pattern[level.missingIndex - 1]}?
                        </p>
                    </div>
                )}

                {/* Available Beads */}
                <div className="bg-slate-800/50 rounded-2xl p-6">
                    <h4 className="text-white font-bold mb-4">Pilih Manik:</h4>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        {availableColors.map((color) => (
                            <DraggableBead key={color} id={`available-${color}`} color={color} />
                        ))}
                    </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-4">
                    <span className="text-white/60">Progress:</span>
                    <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${((currentLevel) / patternLevels.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-white font-medium">
                        {currentLevel}/{patternLevels.length}
                    </span>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeId && (
                    <Bead
                        id={activeId}
                        color={activeId.replace('available-', '') as BeadColor}
                        isDragging
                    />
                )}
            </DragOverlay>
        </DndContext>
    )
}
