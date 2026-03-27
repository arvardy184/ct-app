import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, upsertUserProgress } from '../../lib/supabase'
import { fetchQuestions, CHAPTER_LABELS, TYPE_LABELS, type Question } from '../../lib/questionService'
import { saveTestResult } from '../../lib/testService'
import type { QuestionType, QuestionChapter } from '../../lib/questionService'

type TestState = 'loading' | 'empty' | 'quiz' | 'submitting' | 'result'

function useTimer() {
  const startRef = useRef<number>(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    startRef.current = Date.now()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  function getElapsed() {
    return Math.floor((Date.now() - startRef.current) / 1000)
  }

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  return { elapsed, formatted, getElapsed }
}

export default function TestPage() {
  const { type, chapter } = useParams<{ type: string; chapter: string }>()
  const navigate = useNavigate()

  const [testState, setTestState] = useState<TestState>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [score, setScore] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const timer = useTimer()

  const questionType = type as QuestionType
  const questionChapter = chapter as QuestionChapter

  const isValidParams =
    (type === 'pretest' || type === 'posttest') &&
    (chapter === 'chapter2' || chapter === 'chapter7')

  useEffect(() => {
    if (!isValidParams) {
      navigate('/')
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null)
    })
    loadQuestions()
  }, [type, chapter])

  async function loadQuestions() {
    setTestState('loading')
    const data = await fetchQuestions({ type: questionType, chapter: questionChapter })
    if (data.length === 0) {
      setTestState('empty')
    } else {
      setQuestions(data)
      setTestState('quiz')
    }
  }

  function selectAnswer(questionId: string, label: string) {
    setAnswers(prev => ({ ...prev, [questionId]: label }))
  }

  async function handleSubmit() {
    setTestState('submitting')
    const finalTime = timer.getElapsed()
    setTimeSpent(finalTime)

    let correct = 0
    for (const q of questions) {
      if (answers[q.id] === q.correct_answer) correct++
    }
    setScore(correct)

    if (userId) {
      await saveTestResult({
        userId,
        chapter: questionChapter,
        type: questionType,
        score: correct,
        total: questions.length,
        answers,
        timeSpentSeconds: finalTime,
      })

      const progressId = `${questionType}_${questionChapter}`
      await upsertUserProgress(userId, progressId, 'completed', finalTime)


      if (questionType === 'pretest') {
        await upsertUserProgress(userId, questionChapter, 'unlocked')
        await upsertUserProgress(userId, `posttest_${questionChapter}`, 'unlocked')
      } else if (questionType === 'posttest') {
        await upsertUserProgress(userId, `questionnaire_${questionChapter}`, 'unlocked')
      }
    }

    setTestState('result')
  }

  const currentQuestion = questions[currentIndex]
  const totalAnswered = Object.keys(answers).length
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  const chapterLabel = CHAPTER_LABELS[questionChapter] ?? chapter
  const typeLabel = TYPE_LABELS[questionType] ?? type

  // ── Loading ──────────────────────────────────────────────────────────────
  if (testState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat soal...</p>
        </div>
      </div>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (testState === 'empty') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">📭</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Soal Belum Tersedia</h2>
          <p className="text-slate-500 mb-6">
            Soal {typeLabel} untuk {chapterLabel} belum ditambahkan oleh guru.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Result ───────────────────────────────────────────────────────────────
  if (testState === 'result') {
    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= 60

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full overflow-hidden">
          {/* Score header */}
          <div className={`p-8 text-center ${passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <div className="text-6xl mb-4">{passed ? '🎉' : '💪'}</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              {passed ? 'Bagus sekali!' : 'Tetap semangat!'}
            </h2>
            <p className="text-slate-500 text-sm">{typeLabel} • {chapterLabel} • {Math.floor(timeSpent / 60)}m {timeSpent % 60}s</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Score display */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-5">
              <div className="text-center">
                <p className="text-4xl font-bold text-indigo-600">{score}</p>
                <p className="text-slate-500 text-xs mt-1">Benar</p>
              </div>
              <div className="text-3xl text-slate-300">/</div>
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-700">{questions.length}</p>
                <p className="text-slate-500 text-xs mt-1">Total Soal</p>
              </div>
              <div className="text-3xl text-slate-300">=</div>
              <div className="text-center">
                <p className={`text-4xl font-bold ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {percentage}%
                </p>
                <p className="text-slate-500 text-xs mt-1">Skor</p>
              </div>
            </div>

            {/* Review jawaban */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Hasil Per Soal:</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {questions.map((q, i) => {
                  const userAnswer = answers[q.id]
                  const isCorrect = userAnswer === q.correct_answer
                  return (
                    <div
                      key={q.id}
                      className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                        isCorrect ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
                      }`}
                    >
                      <span className={`mt-0.5 text-base ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 font-medium mb-1 line-clamp-2">
                          {i + 1}. {q.question_text}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          {!isCorrect && userAnswer && (
                            <span className="text-red-500">Jawabanmu: {userAnswer}</span>
                          )}
                          {!isCorrect && (
                            <span className="text-emerald-600 font-medium">
                              Kunci: {q.correct_answer}
                            </span>
                          )}
                          {!userAnswer && (
                            <span className="text-slate-400 italic">Tidak dijawab</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                to="/"
                className="flex-1 text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Kembali ke Dashboard
              </Link>
              <button
                onClick={() => {
                  setAnswers({})
                  setCurrentIndex(0)
                  setScore(0)
                  setTestState('quiz')
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors"
              >
                Ulangi
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  const optionStyles: Record<string, { base: string; selected: string }> = {
    A: { base: 'border-slate-200 hover:border-sky-300 hover:bg-sky-50', selected: 'border-sky-500 bg-sky-50 text-sky-900' },
    B: { base: 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50', selected: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
    C: { base: 'border-slate-200 hover:border-amber-300 hover:bg-amber-50', selected: 'border-amber-500 bg-amber-50 text-amber-900' },
    D: { base: 'border-slate-200 hover:border-rose-300 hover:bg-rose-50', selected: 'border-rose-500 bg-rose-50 text-rose-900' },
  }

  const optionLabelColors: Record<string, string> = {
    A: 'bg-sky-100 text-sky-700',
    B: 'bg-emerald-100 text-emerald-700',
    C: 'bg-amber-100 text-amber-700',
    D: 'bg-rose-100 text-rose-700',
  }

  const isLastQuestion = currentIndex === questions.length - 1
  const currentAnswer = answers[currentQuestion?.id] ?? null
  const allAnswered = totalAnswered === questions.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{typeLabel}</p>
            <h1 className="text-slate-800 font-semibold text-sm">{chapterLabel}</h1>
          </div>
          <div className="bg-slate-100 rounded-lg px-3 py-1.5 text-center">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Waktu</p>
            <p className="text-slate-800 font-mono font-bold text-sm">{timer.formatted}</p>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Soal {currentIndex + 1} dari {questions.length}</span>
              <span>{totalAnswered} dijawab</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Question Area */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-6">
            <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {currentIndex + 1}
            </span>
            <p className="text-slate-800 text-base leading-relaxed font-medium">
              {currentQuestion.question_text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map(opt => {
              const isSelected = currentAnswer === opt.label
              const style = optionStyles[opt.label]
              return (
                <button
                  key={opt.label}
                  onClick={() => selectAnswer(currentQuestion.id, opt.label)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    isSelected ? style.selected : `${style.base} text-slate-700`
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected ? 'bg-white/80' : optionLabelColors[opt.label]
                  }`}>
                    {opt.label}
                  </span>
                  <span className="text-sm leading-snug">{opt.text}</span>
                  {isSelected && <span className="ml-auto text-lg">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick nav dots */}
        <div className="flex flex-wrap justify-center gap-2">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              title={`Soal ${i + 1}`}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                i === currentIndex
                  ? 'bg-indigo-600 text-white scale-110 shadow-md shadow-indigo-200'
                  : answers[q.id]
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Sebelumnya
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={testState === 'submitting' || !allAnswered}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-indigo-200"
            >
              {testState === 'submitting' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Kumpulkan Jawaban ✓
                  {!allAnswered && (
                    <span className="ml-1 text-indigo-200 text-xs">
                      ({questions.length - totalAnswered} belum)
                    </span>
                  )}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Selanjutnya →
            </button>
          )}
        </div>

        {/* Skip warning jika belum semua dijawab */}
        {isLastQuestion && !allAnswered && (
          <p className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg py-2 px-4">
            ⚠️ Masih ada {questions.length - totalAnswered} soal yang belum dijawab. Kamu tetap bisa mengumpulkan, tapi soal yang kosong dihitung salah.
          </p>
        )}
      </main>
    </div>
  )
}
