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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4 drop-shadow-sm">🧩</div>
                    <h1 className="text-3xl font-bold text-slate-800">Berpikir Komputasional</h1>
                    <p className="text-slate-500 mt-2 font-medium">Masuk untuk melanjutkan belajar</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Masuk</h2>

                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl
                                           text-slate-800 placeholder-slate-400 focus:outline-none
                                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-indigo-600
                                       text-white font-bold rounded-xl shadow-sm
                                       hover:bg-indigo-700
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-slate-500 text-sm font-medium">
                        Belum punya akun?{' '}
                        <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                            Daftar di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
