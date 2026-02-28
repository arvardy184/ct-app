import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmail } from '../../lib/supabase'

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        const { error: err } = await signInWithEmail(email, password)
        if (err) {
            setError('Email atau password salah. Coba lagi.')
        } else {
            navigate('/')
        }
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🧩</div>
                    <h1 className="text-3xl font-bold text-white">Berpikir Komputasional</h1>
                    <p className="text-white/60 mt-2">Masuk untuk melanjutkan belajar</p>
                </div>

                {/* Card */}
                <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Masuk</h2>

                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl
                                           text-white placeholder-slate-500 focus:outline-none
                                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
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
                            {isLoading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-white/50 text-sm">
                        Belum punya akun?{' '}
                        <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            Daftar di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
