import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import GamificationHeader from './GamificationHeader'

export default function MainLayout() {
    const { isGamified, userSession, toggleGamificationMode } = useAppStore()
    const location = useLocation()

    const navLinks = [
        { path: '/', label: 'Dashboard', icon: '🏠' },
        { path: '/chapter2', label: 'Bab 2: Pola & Pattern', icon: '🎨' },
        { path: '/chapter7', label: 'Bab 7: Scratch Visual', icon: '🧩' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
            {/* Conditional Gamification Header */}
            {isGamified && userSession && <GamificationHeader />}

            {/* Non-Gamified Simple Header */}
            {!isGamified && (
                <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4">
                    <div className="container mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                📚
                            </div>
                            <h1 className="text-xl font-semibold text-white">
                                Pembelajaran Algoritma & Berpikir Komputasional
                            </h1>
                        </div>
                        {userSession && (
                            <div className="flex items-center gap-3">
                                <span className="text-slate-400">Halo,</span>
                                <span className="text-white font-medium">{userSession.name}</span>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* Navigation */}
            <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/30">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${location.pathname === link.path
                                            ? 'text-white border-purple-500 bg-purple-500/10'
                                            : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <span>{link.icon}</span>
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Mode Toggle (for testing/research) */}
                        <button
                            onClick={toggleGamificationMode}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isGamified
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {isGamified ? '🎮 Gamified Mode' : '📝 Standard Mode'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-slate-900/80 border-t border-slate-800 py-6 mt-auto">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-slate-500 text-sm">
                        © 2026 Computational Thinking App - Thesis Research Project
                    </p>
                </div>
            </footer>
        </div>
    )
}
