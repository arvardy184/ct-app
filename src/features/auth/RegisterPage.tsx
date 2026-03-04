import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUpWithEmail, createProfile } from '../../lib/supabase'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [groupType, setGroupType] = useState<"A" | "B">("A")
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError('')
        if (password.length < 6) {
            setError('Password minimal 6 karakter.')
            return
        }
        setIsLoading(true)

        const { user, error: signUpErr } = await signUpWithEmail(email, password)
        if (signUpErr || !user) {
            setError(signUpErr ?? 'Gagal mendaftar. Coba lagi.')
            setIsLoading(false)
            return
        }

        await createProfile(user.id, name, email, groupType)
        navigate('/')
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4 drop-shadow-sm">🧩</div>
                    <h1 className="text-3xl font-bold text-slate-800">Berpikir Komputasional</h1>
                    <p className="text-slate-500 mt-2 font-medium">Buat akun baru untuk mulai belajar</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Daftar</h2>

                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-slate-700 text-sm font-semibold mb-1.5">Nama Lengkap</label>
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
                            <label className="block text-slate-700 text-sm font-semibold mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="nama@email.com"
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl
                                           text-slate-800 placeholder-slate-400 focus:outline-none
                                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 text-sm font-semibold mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Minimal 6 karakter"
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl
                                           text-slate-800 placeholder-slate-400 focus:outline-none
                                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 text-sm font-semibold mb-2">Grup Penelitian</label>
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
                            <p className="mt-1.5 text-slate-400 text-xs font-medium">Sesuaikan dengan arahan dari peneliti</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 mt-2 bg-indigo-600
                                       text-white font-bold rounded-xl shadow-sm
                                       hover:bg-indigo-700
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? 'Mendaftar...' : 'Daftar'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-slate-500 text-sm font-medium">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
