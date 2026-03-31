import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { session, isLoading, needsProfileSetup } = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="emoji-hero-sm mb-4 animate-pulse mx-auto" aria-hidden>
                        🧩
                    </div>
                    <p className="text-slate-600 font-medium">Memuat...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    if (needsProfileSetup) {
        return <Navigate to="/profile-setup" replace />
    }

    return <>{children}</>
}
