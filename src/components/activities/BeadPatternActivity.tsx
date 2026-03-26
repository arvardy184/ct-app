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
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
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
                ${beadSizeMap[size]} rounded-full ${beadColorMap[color]}
                border-[3px] border-white/90
                ${isDragging ? 'scale-110 ring-4 ring-slate-200 shadow-lg' : 'shadow-sm'}
                transition-transform duration-200
            `}
        />
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
                ${isOver ? 'border-green-400 bg-green-50 scale-110' : 'border-slate-300 bg-slate-100'}
                ${hasCorrectAnswer ? 'border-green-500 bg-green-50' : ''}
            `}
        >
            {placedColor ? (
                <Bead id="placed" color={placedColor} size="lg" />
            ) : (
                <span className="text-slate-400 font-bold text-2xl">?</span>
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

                const xpEarned = Math.max(level.xpReward - (attempts * 5), 5)
                if (isGamified) {
                    addXP(xpEarned)
                }

                setScore(prev => prev + xpEarned)
                const accumulatedScore = score + xpEarned

                if (currentLevel === 2 && isGamified) {
                    addBadge('🎯')
                }

                setTimeout(() => {
                    if (currentLevel < patternLevels.length - 1) {
                        setCurrentLevel(prev => prev + 1)
                        setPlacedColor(null)
                        setIsCorrect(null)
                        setShowHint(false)
                        setAttempts(0)
                    } else {
                        setIsComplete(true)
                        if (isGamified) {
                            addBadge('🏆')
                            addXP(100)
                        }
                        onComplete?.(accumulatedScore)
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
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="text-8xl mb-6">🎉</div>
                <h2 className="text-3xl font-black text-slate-800 mb-4">Selamat!</h2>
                <p className="text-xl text-slate-600 mb-6 font-medium">
                    Kamu telah menyelesaikan semua level!
                </p>
                <div className="bg-green-50 border border-green-200 px-8 py-4 rounded-2xl">
                    <p className="text-green-700 text-2xl font-bold">Total Score: {score} XP</p>
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
                    className="mt-8 px-8 py-4 bg-slate-800 text-white font-bold rounded-xl 
                     hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
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
            <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
                {/* Level Info */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 mb-1">
                            Level {currentLevel + 1} / {patternLevels.length}
                        </h3>
                        <p className="text-slate-500 font-medium">
                            Kesulitan: {' '}
                            <span className={`font-bold ${level.difficulty === 'easy' ? 'text-green-600' :
                                level.difficulty === 'medium' ? 'text-orange-500' : 'text-red-500'
                                }`}>
                                {level.difficulty === 'easy' ? 'Mudah' :
                                    level.difficulty === 'medium' ? 'Sedang' : 'Sulit'}
                            </span>
                        </p>
                    </div>

                    {isGamified && (
                        <div className="bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-xl shadow-sm">
                            <p className="text-yellow-700 font-bold">+{level.xpReward} XP</p>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                    <p className="text-slate-700 text-base font-medium leading-relaxed">
                        🎨 <strong className="text-slate-900">Lengkapi Pola!</strong> Perhatikan urutan warna dan tempatkan
                        manik yang tepat pada posisi yang kosong.
                    </p>
                </div>

                {/* Pattern Display */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                    <h4 className="text-slate-800 font-bold mb-8 text-center text-lg">Pola Gelang:</h4>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
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
                        <div className="mt-8 mb-[-1rem] text-center animate-fade-in bg-green-50 border border-green-200 py-3 rounded-xl">
                            <p className="text-green-700 text-base font-bold">✅ Benar! Lanjut ke level berikutnya...</p>
                        </div>
                    )}
                    {isCorrect === false && (
                        <div className="mt-8 mb-[-1rem] text-center animate-fade-in bg-red-50 border border-red-200 py-3 rounded-xl">
                            <p className="text-red-600 text-base font-bold">❌ Coba lagi!</p>
                        </div>
                    )}
                </div>

                {/* Hint */}
                {showHint && !isCorrect && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 animate-fade-in shadow-sm">
                        <p className="text-blue-800 font-medium leading-relaxed">
                            💡 <strong className="font-bold">Petunjuk:</strong> Perhatikan pola yang berulang.
                            Warna apa yang muncul setelah <span className="font-bold uppercase tracking-wider">{level.pattern[level.missingIndex - 1]}</span>?
                        </p>
                    </div>
                )}

                {/* Available Beads */}
                <div className="bg-slate-50 border border-slate-200 shadow-inner rounded-3xl p-6 mt-2 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 px-4 py-1 rounded-full shadow-sm">
                        <h4 className="text-slate-600 font-bold text-sm">Pilih Manik:</h4>
                    </div>
                    <div className="flex items-center justify-center gap-5 flex-wrap mt-4">
                        {availableColors.map((color) => (
                            <DraggableBead key={color} id={`available-${color}`} color={color} />
                        ))}
                    </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-4 mt-4 px-2">
                    <span className="text-slate-500 font-bold text-sm">Progres:</span>
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${((currentLevel) / patternLevels.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-slate-700 font-bold text-sm">
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
