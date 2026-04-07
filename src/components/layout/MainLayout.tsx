import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import GamificationHeader from './GamificationHeader'

export default function MainLayout() {
    const { isGamified, userSession, setGamificationMode } = useAppStore()
    const location = useLocation()

    
    useEffect(() => {
        if (!userSession) return
        const path = location.pathname
        const group = userSession.groupType

        if (path.startsWith('/chapter2')) {
            setGamificationMode(group === 'A')
        } else if (path.startsWith('/chapter7')) {
            setGamificationMode(group === 'B')
        }
    }, [location.pathname, userSession?.groupType])

    const navLinks = [
        { path: '/', label: 'Dashboard', icon: '🏠' },
        { path: '/profile', label: 'Profil', icon: '👤' },
        { path: '/chapter2', label: 'Bab 2: Pola & Pattern', icon: '🎨' },
        { path: '/chapter7', label: 'Bab 7: Scratch Visual', icon: '🧩' },
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            {isGamified && userSession && <GamificationHeader />}

            {!isGamified && (
                <header className="bg-white border-b border-slate-200 px-6 py-4">
                    <div className="container mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                📚
                            </div>
                            <h1 className="text-xl font-semibold text-slate-800">
                                Pembelajaran Algoritma & Berpikir Komputasional
                            </h1>
                        </div>
                        {userSession && (
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500">Halo,</span>
                                <span className="text-slate-800 font-medium">{userSession.name}</span>
                            </div>
                        )}
                    </div>
                </header>
            )}

  
            <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${location.pathname === link.path
                                        ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50'
                                        : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
                                        }`}
                                >
                                    <span>{link.icon}</span>
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                            isGamified
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-white border border-slate-300 text-slate-700'
                        }`}>
                            {isGamified ? '🎮 Gamified' : '📝 Standard'}
                            <span className="text-xs opacity-70">Grup {userSession?.groupType}</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-8">
                <Outlet />
            </main>


            <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-slate-500 text-sm">
                        © 2026 Computational Thinking App - Thesis Research Project by Dani Adrian
                    </p>
                </div>
            </footer>
        </div>
    )
}
