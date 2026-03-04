import { useEffect, useState } from 'react'
import {
  fetchAllActivityLogs,
  fetchAllProfiles,
  type AdminActivityLog,
  type AdminProfile,
  ADMIN_EMAIL,
} from '../../lib/adminService'
import { arrayToCsv, downloadCsv, formatSeconds } from '../../lib/exportUtils'

export default function AdminLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AdminActivityLog[]>([])
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [filterActivity, setFilterActivity] = useState<string>('')
  const [filterGroup, setFilterGroup] = useState<string>('')

  useEffect(() => {
    Promise.all([fetchAllActivityLogs(), fetchAllProfiles()]).then(
      ([logsData, profilesData]) => {
        setLogs(logsData)
        setProfiles(profilesData.filter(p => p.email !== ADMIN_EMAIL))
        setLoading(false)
      }
    )
  }, [])

  const profileMap = new Map(profiles.map(p => [p.id, p]))
  const activityNames = [...new Set(logs.map(l => l.activity_name))].sort()

  const filtered = logs.filter(l => {
    const profile = profileMap.get(l.user_id)
    if (!profile) return false
    if (filterActivity && l.activity_name !== filterActivity) return false
    if (filterGroup && profile.group_type !== filterGroup) return false
    return true
  })

  const handleExport = () => {
    const exportData = filtered.map(l => {
      const profile = profileMap.get(l.user_id)
      return {
        nama: profile?.name ?? '-',
        grup: profile?.group_type ?? '-',
        aktivitas: l.activity_name,
        waktuDetik: l.time_spent_seconds,
        percobaan: l.attempt_count,
        skor: l.score,
        selesai: l.completed ? 'Ya' : 'Tidak',
        tanggal: new Date(l.created_at).toLocaleString('id-ID'),
      }
    })
    const csv = arrayToCsv(exportData, [
      { key: 'nama', label: 'Nama' },
      { key: 'grup', label: 'Grup' },
      { key: 'aktivitas', label: 'Aktivitas' },
      { key: 'waktuDetik', label: 'Waktu (detik)' },
      { key: 'percobaan', label: 'Percobaan' },
      { key: 'skor', label: 'Skor' },
      { key: 'selesai', label: 'Selesai' },
      { key: 'tanggal', label: 'Tanggal' },
    ])
    downloadCsv(csv, `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`)
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
          <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} log ditampilkan</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterActivity}
          onChange={e => setFilterActivity(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Aktivitas</option>
          {activityNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Grup</option>
          <option value="A">Grup A</option>
          <option value="B">Grup B</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-left">
              <th className="px-4 py-3 font-medium">Siswa</th>
              <th className="px-4 py-3 font-medium">Grup</th>
              <th className="px-4 py-3 font-medium">Aktivitas</th>
              <th className="px-4 py-3 font-medium">Waktu</th>
              <th className="px-4 py-3 font-medium">Percobaan</th>
              <th className="px-4 py-3 font-medium">Skor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  Tidak ada log yang cocok dengan filter
                </td>
              </tr>
            ) : (
              filtered.slice(0, 200).map(l => {
                const profile = profileMap.get(l.user_id)
                return (
                  <tr key={l.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{profile?.name ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          profile?.group_type === 'A'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {profile?.group_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{l.activity_name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {formatSeconds(l.time_spent_seconds)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{l.attempt_count}x</td>
                    <td className="px-4 py-3 text-slate-400">{l.score}</td>
                    <td className="px-4 py-3">
                      {l.completed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                          ✓ Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-600/30 text-slate-500 rounded-full text-xs font-medium">
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(l.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {filtered.length > 200 && (
          <div className="px-4 py-3 bg-slate-800 text-slate-400 text-xs text-center border-t border-slate-700">
            Menampilkan 200 dari {filtered.length} log. Export CSV untuk data lengkap.
          </div>
        )}
      </div>
    </div>
  )
}
