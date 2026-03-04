import { useEffect, useState } from 'react'
import {
  fetchAdminDashboardData,
  type StudentRow,
  ADMIN_EMAIL,
} from '../../lib/adminService'
import { arrayToCsv, downloadCsv } from '../../lib/exportUtils'

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAdminDashboardData().then(data => {
      setStudents(data.students)
      setLoading(false)
    })
  }, [])

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    const csv = arrayToCsv(students, [
      { key: 'name', label: 'Nama' },
      { key: 'email', label: 'Email' },
      { key: 'groupType', label: 'Grup' },
      { key: 'totalXp', label: 'Total XP' },
      { key: 'level', label: 'Level' },
      { key: 'badgesEarned', label: 'Badges' },
      { key: 'completedActivities', label: 'Aktivitas Selesai' },
      { key: 'lastActive', label: 'Terakhir Aktif' },
    ])
    downloadCsv(csv, `users_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Siswa</h1>
          <p className="text-slate-400 text-sm mt-1">{students.length} siswa terdaftar</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          📥 Export CSV
        </button>
      </div>

      <input
        type="text"
        placeholder="Cari nama atau email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full sm:w-96 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div
            key={s.id}
            className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold">{s.name}</h3>
                <p className="text-slate-500 text-xs">{s.email}</p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  s.groupType === 'A'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-orange-500/20 text-orange-400'
                }`}
              >
                Grup {s.groupType}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/50 rounded-lg p-2">
                <p className="text-indigo-400 font-bold text-lg">{s.totalXp}</p>
                <p className="text-slate-500 text-xs">XP</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2">
                <p className="text-amber-400 font-bold text-lg">{s.level}</p>
                <p className="text-slate-500 text-xs">Level</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2">
                <p className="text-emerald-400 font-bold text-lg">{s.completedActivities}</p>
                <p className="text-slate-500 text-xs">Selesai</p>
              </div>
            </div>
            {s.badgesEarned.length > 0 && (
              <div className="mt-3 flex gap-1 flex-wrap">
                {s.badgesEarned.map((b, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                    {b}
                  </span>
                ))}
              </div>
            )}
            {s.lastActive && (
              <p className="text-slate-600 text-xs mt-3">
                Terakhir aktif:{' '}
                {new Date(s.lastActive).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-slate-500 text-center py-12">
          {search ? 'Tidak ada siswa yang cocok' : 'Belum ada data siswa'}
        </p>
      )}
    </div>
  )
}
