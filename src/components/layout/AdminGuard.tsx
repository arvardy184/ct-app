import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ADMIN_EMAIL } from '../../lib/adminService'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (session?.user?.email === ADMIN_EMAIL) {
      setIsAdmin(true)
    }
    setChecking(false)
  }, [session, isLoading])

  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="emoji-hero-sm mb-4 animate-pulse mx-auto" aria-hidden>
            🔒
          </div>
          <p className="text-slate-400 font-medium">Memverifikasi akses admin...</p>
        </div>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
