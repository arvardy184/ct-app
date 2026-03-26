import { useState } from 'react'
 import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from '../../lib/supabase'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Siswa', icon: '👥' },
  { path: '/admin/logs', label: 'Activity Logs', icon: '📋' },
  { path: '/admin/questions', label: 'Manajemen Soal', icon: '📝' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside
        className={`
          flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col
          transition-all duration-300
          ${collapsed ? 'w-16' : 'w-56 lg:w-64'}
        `}
      >
        {/* Logo + Toggle */}
        <div className="p-3 border-b border-slate-700 flex items-center justify-between min-h-[64px]">
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 flex-shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-semibold text-sm truncate">Admin Panel</h1>
                <p className="text-slate-400 text-xs truncate">CT Research</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 mx-auto bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="mx-2 mt-2 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all duration-200"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '← Collapse'}
        </button>

        <nav className="flex-1 p-2 space-y-1 mt-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-700 space-y-1">
          <Link
            to="/"
            title={collapsed ? 'Ke Halaman Utama' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <span className="text-lg flex-shrink-0">🏠</span>
            {!collapsed && <span className="truncate">Ke Halaman Utama</span>}
          </Link>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            {!collapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
