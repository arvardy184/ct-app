import { useEffect, useState } from 'react'
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  emptyQuestionInput,
  CHAPTER_LABELS,
  TYPE_LABELS,
  type Question,
  type QuestionInput,
  type QuestionType,
  type QuestionChapter,
} from '../../lib/questionService'

type FilterType = QuestionType | 'all'
type FilterChapter = QuestionChapter | 'all'

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterChapter, setFilterChapter] = useState<FilterChapter>('all')
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [formData, setFormData] = useState<QuestionInput>(emptyQuestionInput())
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  async function loadQuestions() {
    setLoading(true)
    const data = await fetchQuestions()
    setQuestions(data)
    setLoading(false)
  }

  const filtered = questions.filter(q => {
    if (filterType !== 'all' && q.type !== filterType) return false
    if (filterChapter !== 'all' && q.chapter !== filterChapter) return false
    return true
  })

  const grouped = filtered.reduce<Record<string, Question[]>>((acc, q) => {
    const key = `${q.chapter}__${q.type}`
    if (!acc[key]) acc[key] = []
    acc[key].push(q)
    return acc
  }, {})

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function openNewForm() {
    const defaultType: QuestionType = filterType !== 'all' ? filterType : 'pretest'
    const defaultChapter: QuestionChapter = filterChapter !== 'all' ? filterChapter : 'chapter2'
    const orderIndex = questions.filter(
      q => q.type === defaultType && q.chapter === defaultChapter
    ).length + 1
    setFormData(emptyQuestionInput(defaultType, defaultChapter, orderIndex))
    setEditingId('new')
    setError(null)
  }

  function openEditForm(q: Question) {
    setFormData({
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      type: q.type,
      chapter: q.chapter,
      order_index: q.order_index,
    })
    setEditingId(q.id)
    setError(null)
  }

  function closeForm() {
    setEditingId(null)
    setError(null)
  }

  function validateForm(): string | null {
    if (!formData.question_text.trim()) return 'Teks soal tidak boleh kosong.'
    for (const opt of formData.options) {
      if (!opt.text.trim()) return `Opsi ${opt.label} tidak boleh kosong.`
    }
    return null
  }

  async function handleSave() {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError(null)

    if (editingId === 'new') {
      const result = await createQuestion(formData)
      if (!result) {
        setError('Gagal menyimpan soal. Coba lagi.')
      } else {
        setQuestions(prev => [...prev, result].sort((a, b) => a.order_index - b.order_index))
        closeForm()
        showSuccess('Soal berhasil ditambahkan!')
      }
    } else if (editingId) {
      const result = await updateQuestion(editingId, formData)
      if (!result) {
        setError('Gagal memperbarui soal. Coba lagi.')
      } else {
        setQuestions(prev => prev.map(q => (q.id === editingId ? result : q)))
        closeForm()
        showSuccess('Soal berhasil diperbarui!')
      }
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const ok = await deleteQuestion(id)
    if (ok) {
      setQuestions(prev => prev.filter(q => q.id !== id))
      showSuccess('Soal berhasil dihapus.')
    }
    setDeletingId(null)
  }

  const groupKeys = Object.keys(grouped).sort()

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Soal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Kelola soal Pretest & Post-test untuk aplikasi mobile
          </p>
        </div>
        <button
          onClick={openNewForm}
          disabled={editingId !== null}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          ＋ Tambah Soal
        </button>
      </div>

      {/* Toast */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
          ✓ {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterChapter}
          onChange={e => setFilterChapter(e.target.value as FilterChapter)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Semua Bab</option>
          <option value="chapter2">Bab 2: Pola & Pattern</option>
          <option value="chapter7">Bab 7: Scratch Visual</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as FilterType)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Semua Tipe</option>
          <option value="pretest">Pre-test</option>
          <option value="posttest">Post-test</option>
        </select>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400">
          Total: <span className="text-white font-medium">{filtered.length} soal</span>
        </div>
      </div>

      {/* Form Tambah / Edit */}
      {editingId !== null && (
        <QuestionForm
          data={formData}
          isNew={editingId === 'new'}
          saving={saving}
          error={error}
          onChange={setFormData}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}

      {/* Daftar Soal */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-3">📝</p>
          <p>Belum ada soal. Klik "Tambah Soal" untuk mulai.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupKeys.map(key => {
            const [chapter, type] = key.split('__') as [QuestionChapter, QuestionType]
            const groupQuestions = grouped[key]
            return (
              <div key={key} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                {/* Group header */}
                <div className="px-5 py-3 bg-slate-800 border-b border-slate-700 flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      type === 'pretest'
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-violet-500/20 text-violet-400'
                    }`}
                  >
                    {TYPE_LABELS[type]}
                  </span>
                  <span className="text-slate-300 text-sm font-medium">
                    {CHAPTER_LABELS[chapter]}
                  </span>
                  <span className="ml-auto text-slate-500 text-xs">
                    {groupQuestions.length} soal
                  </span>
                </div>

                {/* Question list */}
                <div className="divide-y divide-slate-700/50">
                  {groupQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      number={idx + 1}
                      isEditing={editingId === q.id}
                      isDeleting={deletingId === q.id}
                      onEdit={() => openEditForm(q)}
                      onDelete={() => handleDelete(q.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface QuestionFormProps {
  data: QuestionInput
  isNew: boolean
  saving: boolean
  error: string | null
  onChange: (data: QuestionInput) => void
  onSave: () => void
  onCancel: () => void
}

function QuestionForm({ data, isNew, saving, error, onChange, onSave, onCancel }: QuestionFormProps) {
  const updateOption = (label: string, text: string) => {
    onChange({
      ...data,
      options: data.options.map(o => (o.label === label ? { ...o, text } : o)),
    })
  }

  const optionColors: Record<string, string> = {
    A: 'text-sky-400',
    B: 'text-emerald-400',
    C: 'text-amber-400',
    D: 'text-rose-400',
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-indigo-500/40 shadow-lg shadow-indigo-500/5 p-6 space-y-5">
      <h3 className="text-white font-semibold text-base flex items-center gap-2">
        <span className="text-lg">{isNew ? '➕' : '✏️'}</span>
        {isNew ? 'Tambah Soal Baru' : 'Edit Soal'}
      </h3>

      {/* Meta: chapter & type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-slate-400 text-xs font-medium mb-1.5">Bab</label>
          <select
            value={data.chapter}
            onChange={e => onChange({ ...data, chapter: e.target.value as QuestionChapter })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="chapter2">Bab 2: Pola & Pattern</option>
            <option value="chapter7">Bab 7: Scratch Visual</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-medium mb-1.5">Tipe</label>
          <select
            value={data.type}
            onChange={e => onChange({ ...data, type: e.target.value as QuestionType })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pretest">Pre-test</option>
            <option value="posttest">Post-test</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-medium mb-1.5">Nomor Urut</label>
          <input
            type="number"
            min={1}
            value={data.order_index}
            onChange={e => onChange({ ...data, order_index: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Teks Soal */}
      <div>
        <label className="block text-slate-400 text-xs font-medium mb-1.5">
          Teks Soal <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={3}
          value={data.question_text}
          onChange={e => onChange({ ...data, question_text: e.target.value })}
          placeholder="Tuliskan pertanyaan di sini..."
          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Opsi Jawaban */}
      <div>
        <label className="block text-slate-400 text-xs font-medium mb-2">
          Pilihan Jawaban <span className="text-red-400">*</span>
        </label>
        <div className="space-y-2">
          {data.options.map(opt => (
            <div key={opt.label} className="flex items-center gap-3">
              <span className={`w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 font-bold text-sm shrink-0 ${optionColors[opt.label]}`}>
                {opt.label}
              </span>
              <input
                type="text"
                value={opt.text}
                onChange={e => updateOption(opt.label, e.target.value)}
                placeholder={`Opsi ${opt.label}`}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="radio"
                name="correct_answer"
                checked={data.correct_answer === opt.label}
                onChange={() => onChange({ ...data, correct_answer: opt.label as 'A' | 'B' | 'C' | 'D' })}
                className="w-4 h-4 accent-indigo-500 cursor-pointer shrink-0"
                title={`Jadikan opsi ${opt.label} sebagai kunci jawaban`}
              />
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-2">
          🔘 Pilih radio button di kanan untuk menentukan kunci jawaban.
          Kunci saat ini: <span className="text-indigo-400 font-bold">{data.correct_answer}</span>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            '💾 Simpan Soal'
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          Batal
        </button>
      </div>
    </div>
  )
}


interface QuestionCardProps {
  question: Question
  number: number
  isEditing: boolean
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
}

function QuestionCard({ question, number, isEditing, isDeleting, onEdit, onDelete }: QuestionCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const optionBg: Record<string, string> = {
    A: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    B: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    C: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    D: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }

  return (
    <div className={`px-5 py-4 transition-colors ${isEditing ? 'bg-indigo-500/5' : 'hover:bg-slate-700/20'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Nomor & Teks soal */}
          <div className="flex items-start gap-3 mb-3">
            <span className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold shrink-0 mt-0.5">
              {number}
            </span>
            <p className="text-white text-sm leading-relaxed">{question.question_text}</p>
          </div>

          {/* Opsi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-10">
            {question.options.map(opt => (
              <div
                key={opt.label}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm ${
                  opt.label === question.correct_answer
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    : optionBg[opt.label]
                }`}
              >
                <span className="font-bold shrink-0">{opt.label}.</span>
                <span className="truncate">{opt.text || <em className="opacity-50">kosong</em>}</span>
                {opt.label === question.correct_answer && (
                  <span className="ml-auto text-indigo-400 shrink-0">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40"
            title="Edit soal"
          >
            ✏️
          </button>
          {showConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setShowConfirm(false); onDelete() }}
                disabled={isDeleting}
                className="px-2.5 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-40"
              >
                {isDeleting ? '...' : 'Hapus'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isDeleting}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40"
              title="Hapus soal"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
