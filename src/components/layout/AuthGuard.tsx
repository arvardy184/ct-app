import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { session, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-4 animate-pulse">🧩</div>
                    <p className="text-white/60">Memuat...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
