import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, saveQuestionnaire, upsertUserProgress } from '../../lib/supabase'

const RIMMS_ITEMS = [
  { key: 'item_1', dimension: 'Perhatian (Attention)', text: 'Materi pembelajaran ini menarik perhatian saya sejak awal.' },
  { key: 'item_2', dimension: 'Perhatian (Attention)', text: 'Ada sesuatu yang menarik dalam materi ini yang membuat saya ingin terus belajar.' },
  { key: 'item_3', dimension: 'Perhatian (Attention)', text: 'Variasi aktivitas dalam pembelajaran ini membantu saya tetap fokus.' },
  { key: 'item_4', dimension: 'Relevansi (Relevance)', text: 'Materi ini berhubungan dengan hal-hal yang sudah saya ketahui sebelumnya.' },
  { key: 'item_5', dimension: 'Relevansi (Relevance)', text: 'Saya bisa melihat manfaat materi ini untuk kehidupan sehari-hari.' },
  { key: 'item_6', dimension: 'Relevansi (Relevance)', text: 'Isi materi ini sesuai dengan kebutuhan belajar saya.' },
  { key: 'item_7', dimension: 'Percaya Diri (Confidence)', text: 'Setelah membaca petunjuk, saya yakin bisa menyelesaikan tugas-tugas dalam pembelajaran ini.' },
  { key: 'item_8', dimension: 'Percaya Diri (Confidence)', text: 'Aktivitas dalam pembelajaran ini tidak terlalu sulit bagi saya.' },
  { key: 'item_9', dimension: 'Percaya Diri (Confidence)', text: 'Saya merasa mampu menguasai materi dalam pembelajaran ini.' },
  { key: 'item_10', dimension: 'Kepuasan (Satisfaction)', text: 'Menyelesaikan tugas dalam pembelajaran ini membuat saya merasa puas.' },
  { key: 'item_11', dimension: 'Kepuasan (Satisfaction)', text: 'Saya menikmati proses belajar menggunakan aplikasi ini.' },
  { key: 'item_12', dimension: 'Kepuasan (Satisfaction)', text: 'Saya ingin terus belajar menggunakan cara seperti ini.' },
]

const LIKERT_OPTIONS = [
  { value: 1, label: 'Sangat Tidak Setuju' },
  { value: 2, label: 'Tidak Setuju' },
  { value: 3, label: 'Netral' },
  { value: 4, label: 'Setuju' },
  { value: 5, label: 'Sangat Setuju' },
]

const CHAPTER_LABELS: Record<string, string> = {
  chapter2: 'Bab 2: Pengenalan Pola',
  chapter7: 'Bab 7: Visual Programming',
}

type PageState = 'form' | 'submitting' | 'done'

export default function QuestionnairePage() {
  const { chapter } = useParams<{ chapter: string }>()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [pageState, setPageState] = useState<PageState>('form')

  const questionChapter = chapter as 'chapter2' | 'chapter7'
  const isValid = chapter === 'chapter2' || chapter === 'chapter7'

  if (!isValid) {
    navigate('/')
    return null
  }

  function setAnswer(key: string, value: number) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  const allAnswered = RIMMS_ITEMS.every(item => answers[item.key] !== undefined)

  async function handleSubmit() {
    if (!allAnswered) return
    setPageState('submitting')

    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user?.id
    if (uid) {
      await saveQuestionnaire(uid, questionChapter, answers)
      await upsertUserProgress(uid, `questionnaire_${questionChapter}`, 'completed')

      // Unlock next chapter flow if chapter2 is done
      if (questionChapter === 'chapter2') {
        await upsertUserProgress(uid, 'pretest_chapter7', 'unlocked')
      }
    }

    setPageState('done')
  }

  if (pageState === 'done') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md w-full p-8 text-center">
          <div className="emoji-hero mb-4" aria-hidden>
            🎉
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Terima Kasih!</h2>
          <p className="text-slate-500 mb-6">
            Jawaban kuesioner kamu untuk {CHAPTER_LABELS[questionChapter]} sudah tersimpan.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  let currentDimension = ''

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Kuesioner RIMMS</p>
            <h1 className="text-slate-800 font-semibold text-sm">{CHAPTER_LABELS[questionChapter]}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">
              {Object.keys(answers).length}/{RIMMS_ITEMS.length} dijawab
            </p>
            <div className="w-32 bg-slate-100 rounded-full h-2 mt-1">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Object.keys(answers).length / RIMMS_ITEMS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-800 text-sm font-medium">
            Berikan penilaian kamu terhadap pengalaman belajar pada {CHAPTER_LABELS[questionChapter]}.
            Pilih angka 1 (Sangat Tidak Setuju) sampai 5 (Sangat Setuju).
          </p>
        </div>

        {RIMMS_ITEMS.map((item, idx) => {
          const showDimensionHeader = item.dimension !== currentDimension
          if (showDimensionHeader) currentDimension = item.dimension

          return (
            <div key={item.key}>
              {showDimensionHeader && (
                <div className="pt-4 pb-2">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
                    {item.dimension}
                  </h3>
                </div>
              )}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-slate-800 text-sm font-medium leading-relaxed">{item.text}</p>
                </div>

                <div className="flex gap-2">
                  {LIKERT_OPTIONS.map(opt => {
                    const isSelected = answers[item.key] === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAnswer(item.key, opt.value)}
                        className={`flex-1 py-2.5 rounded-lg text-center transition-all duration-150 border-2 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <p className="text-lg font-bold">{opt.value}</p>
                        <p className="text-[9px] font-medium leading-tight mt-0.5 opacity-80">{opt.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}

        <div className="pt-6 pb-10 flex items-center gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            ← Batal
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || pageState === 'submitting'}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            {pageState === 'submitting' ? 'Menyimpan...' : `Kirim Jawaban (${Object.keys(answers).length}/${RIMMS_ITEMS.length})`}
          </button>
        </div>
      </main>
    </div>
  )
}

