import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUpWithEmail, createProfile } from '../../lib/supabase'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [groupType, setGroupType] = useState<'A' | 'B'>('A')
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🧩</div>
                    <h1 className="text-3xl font-bold text-white">Berpikir Komputasional</h1>
                    <p className="text-white/60 mt-2">Buat akun baru untuk mulai belajar</p>
                </div>

                {/* Card */}
                <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Daftar</h2>

                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-1.5">Nama Lengkap</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                placeholder="Nama kamu"
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl
                                           text-white placeholder-slate-500 focus:outline-none
                                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="nama@email.com"
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl
                                           text-white placeholder-slate-500 focus:outline-none
                                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Minimal 6 karakter"
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl
                                           text-white placeholder-slate-500 focus:outline-none
                                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-white/70 text-sm font-medium mb-2">Grup Penelitian</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['A', 'B'] as const).map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setGroupType(g)}
                                        className={`py-3 rounded-xl font-bold text-sm border-2 transition-all duration-200
                                            ${groupType === g
                                                ? 'border-indigo-500 bg-indigo-600/30 text-indigo-300'
                                                : 'border-slate-600/50 bg-slate-700/30 text-slate-400 hover:border-slate-500'
                                            }`}
                                    >
                                        Grup {g}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-1.5 text-white/40 text-xs">Sesuaikan dengan arahan dari peneliti</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600
                                       text-white font-bold rounded-xl shadow-lg
                                       hover:from-indigo-500 hover:to-purple-500
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? 'Mendaftar...' : 'Daftar'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-white/50 text-sm">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            Masuk di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
