import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { supabase, createProfile, getProfile, initializeUserProgress } from '../../lib/supabase'

export default function ProfileSetupPage() {
    const navigate = useNavigate()
    const { setUserSession } = useAppStore()
    const [name, setName] = useState('')
    const [className, setClassName] = useState('')
    const [groupType, setGroupType] = useState<'A' | 'B'>('A')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        async function checkExistingProfile() {
            const { data } = await supabase.auth.getSession()
            const user = data.session?.user
            if (!user) return

            const profile = await getProfile(user.id)
            if (profile) {
                setUserSession({
                    id: user.id,
                    name: profile.name,
                    email: user.email ?? '',
                    className: profile.class_name ?? undefined,
                    groupType: profile.group_type as 'A' | 'B',
                    xp: 0,
                    level: 1,
                    badges: [],
                })
                navigate('/', { replace: true })
            }
        }
        checkExistingProfile()
    }, [])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!name.trim()) {
            setError('Nama lengkap wajib diisi.')
            return
        }
        setError('')
        setIsLoading(true)

        const { data } = await supabase.auth.getSession()
        const user = data.session?.user
        if (!user) {
            setError('Sesi tidak ditemukan. Silakan login ulang.')
            setIsLoading(false)
            navigate('/login')
            return
        }

        const ok = await createProfile(
            user.id,
            name.trim(),
            user.email ?? '',
            groupType,
            className.trim() || undefined
        )

        if (!ok) {
            setError('Gagal menyimpan profil. Coba lagi.')
            setIsLoading(false)
            return
        }

        await initializeUserProgress(user.id)

        setUserSession({
            id: user.id,
            name: name.trim(),
            email: user.email ?? '',
            className: className.trim() || undefined,
            groupType,
            xp: 0,
            level: 1,
            badges: [],
        })

        setIsLoading(false)
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">👤</div>
                    <h1 className="text-3xl font-bold text-slate-800">Lengkapi Profil</h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Satu langkah lagi sebelum mulai belajar!
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-slate-700 text-sm font-semibold mb-1.5">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                placeholder="Nama kamu"
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl
                                           text-slate-800 placeholder-slate-400 focus:outline-none
                                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 text-sm font-semibold mb-1.5">Kelas</label>
                            <input
                                type="text"
                                value={className}
                                onChange={e => setClassName(e.target.value)}
                                placeholder="Contoh: VII-A"
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl
                                           text-slate-800 placeholder-slate-400 focus:outline-none
                                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 text-sm font-semibold mb-2">
                                Grup Penelitian <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['A', 'B'] as const).map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setGroupType(g)}
                                        className={`py-3 rounded-xl font-bold text-sm border transition-all duration-200
                                            ${groupType === g
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        Grup {g}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-1.5 text-slate-400 text-xs font-medium">
                                Sesuaikan dengan arahan dari peneliti
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 mt-2 bg-indigo-600 text-white font-bold rounded-xl shadow-sm
                                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? 'Menyimpan...' : 'Simpan & Mulai Belajar →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
