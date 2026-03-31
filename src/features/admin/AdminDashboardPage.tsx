import { useEffect, useState } from 'react'
import {
  fetchAdminDashboardData,
  fetchAllTestResults,
  fetchAllQuestionnaires,
  type StudentRow,
  type GroupComparison,
  type ActivityProgress,
  type AdminActivityLog,
  type AdminProfile,
} from '../../lib/adminService'
import { arrayToCsv, downloadCsv, formatSeconds } from '../../lib/exportUtils'

type SortKey = 'name' | 'groupType' | 'totalXp' | 'level' | 'completedActivities'
type SortDir = 'asc' | 'desc'

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [logs, setLogs] = useState<AdminActivityLog[]>([])
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [activityProgress, setActivityProgress] = useState<ActivityProgress[]>([])
  const [groupComparison, setGroupComparison] = useState<GroupComparison[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const data = await fetchAdminDashboardData()
      setStudents(data.students)
      setLogs(data.logs)
      setProfiles(data.profiles)
      setActivityProgress(data.activityProgress)
      setGroupComparison(data.groupComparison)
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedStudents = [...students]
    .filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      const valA = a[sortKey]
      const valB = b[sortKey]
      if (typeof valA === 'string' && typeof valB === 'string')
        return mul * valA.localeCompare(valB)
      return mul * (Number(valA) - Number(valB))
    })

  const groupA = students.filter(s => s.groupType === 'A')
  const groupB = students.filter(s => s.groupType === 'B')
  const activeStudents = students.filter(s => s.lastActive !== null)

  const handleExportStudents = () => {
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
    downloadCsv(csv, `students_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleExportFull = async () => {
    const profileMap = new Map(profiles.map(p => [p.id, p]))
    const [testResults, questionnaires] = await Promise.all([
      fetchAllTestResults(),
      fetchAllQuestionnaires(),
    ])

    // Sheet 1: nilai pretest & posttest
    const testRows = testResults.map(r => {
      const profile = profileMap.get(r.user_id)
      return {
        nama: profile?.name ?? '-',
        email: profile?.email ?? '-',
        grup: profile?.group_type ?? '-',
        bab: r.chapter,
        jenis: r.type,
        benar: r.score,
        total: r.total,
        persen: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
        waktuDetik: r.time_spent_seconds ?? 0,
        tanggal: new Date(r.completed_at).toLocaleString('id-ID'),
      }
    })
    downloadCsv(arrayToCsv(testRows, [
      { key: 'nama',       label: 'Nama'             },
      { key: 'email',      label: 'Email'            },
      { key: 'grup',       label: 'Grup'             },
      { key: 'bab',        label: 'Bab'              },
      { key: 'jenis',      label: 'Jenis Test'       },
      { key: 'benar',      label: 'Jawaban Benar'    },
      { key: 'total',      label: 'Total Soal'       },
      { key: 'persen',     label: 'Nilai (%)'        },
      { key: 'waktuDetik', label: 'Waktu (detik)'    },
      { key: 'tanggal',    label: 'Tanggal'          },
    ]), `nilai_test_${new Date().toISOString().slice(0, 10)}.csv`)

    // Sheet 2: kuesioner ARCS
    const qRows = questionnaires.map(q => {
      const profile = profileMap.get(q.user_id)
      const items = [q.item_1,q.item_2,q.item_3,q.item_4,q.item_5,q.item_6,q.item_7,q.item_8,q.item_9,q.item_10,q.item_11,q.item_12]
      const avgPerhatian  = ((q.item_1 + q.item_2 + q.item_3) / 3).toFixed(2)
      const avgRelevansi  = ((q.item_4 + q.item_5 + q.item_6) / 3).toFixed(2)
      const avgPercayaDiri= ((q.item_7 + q.item_8 + q.item_9) / 3).toFixed(2)
      const avgKepuasan   = ((q.item_10+ q.item_11+ q.item_12)/ 3).toFixed(2)
      const avgTotal      = (items.reduce((a,b)=>a+b,0)/items.length).toFixed(2)
      return {
        nama: profile?.name ?? '-',
        email: profile?.email ?? '-',
        grup: profile?.group_type ?? '-',
        bab: q.chapter,
        item_1:q.item_1, item_2:q.item_2, item_3:q.item_3,
        item_4:q.item_4, item_5:q.item_5, item_6:q.item_6,
        item_7:q.item_7, item_8:q.item_8, item_9:q.item_9,
        item_10:q.item_10, item_11:q.item_11, item_12:q.item_12,
        avgPerhatian, avgRelevansi, avgPercayaDiri, avgKepuasan, avgTotal,
        tanggal: new Date(q.created_at).toLocaleString('id-ID'),
      }
    })
    downloadCsv(arrayToCsv(qRows, [
      { key: 'nama',          label: 'Nama'              },
      { key: 'email',         label: 'Email'             },
      { key: 'grup',          label: 'Grup'              },
      { key: 'bab',           label: 'Bab'               },
      { key: 'item_1',        label: 'Item 1 (Perhatian)'},
      { key: 'item_2',        label: 'Item 2 (Perhatian)'},
      { key: 'item_3',        label: 'Item 3 (Perhatian)'},
      { key: 'item_4',        label: 'Item 4 (Relevansi)'},
      { key: 'item_5',        label: 'Item 5 (Relevansi)'},
      { key: 'item_6',        label: 'Item 6 (Relevansi)'},
      { key: 'item_7',        label: 'Item 7 (Percaya Diri)'},
      { key: 'item_8',        label: 'Item 8 (Percaya Diri)'},
      { key: 'item_9',        label: 'Item 9 (Percaya Diri)'},
      { key: 'item_10',       label: 'Item 10 (Kepuasan)'},
      { key: 'item_11',       label: 'Item 11 (Kepuasan)'},
      { key: 'item_12',       label: 'Item 12 (Kepuasan)'},
      { key: 'avgPerhatian',  label: 'Avg Perhatian'     },
      { key: 'avgRelevansi',  label: 'Avg Relevansi'     },
      { key: 'avgPercayaDiri',label: 'Avg Percaya Diri'  },
      { key: 'avgKepuasan',   label: 'Avg Kepuasan'      },
      { key: 'avgTotal',      label: 'Avg Total ARCS'    },
      { key: 'tanggal',       label: 'Tanggal'           },
    ]), `kuesioner_arcs_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleExportLogs = () => {
    const profileMap = new Map(profiles.map(p => [p.id, p]))
    const exportData = logs.map(l => {
      const profile = profileMap.get(l.user_id)
      return {
        studentName: profile?.name ?? '-',
        groupType: profile?.group_type ?? '-',
        activityName: l.activity_name,
        timeSpent: l.time_spent_seconds,
        attempts: l.attempt_count,
        score: l.score,
        completed: l.completed ? 'Ya' : 'Tidak',
        date: new Date(l.created_at).toLocaleString('id-ID'),
      }
    })
    const csv = arrayToCsv(exportData, [
      { key: 'studentName', label: 'Nama Siswa' },
      { key: 'groupType', label: 'Grup' },
      { key: 'activityName', label: 'Aktivitas' },
      { key: 'timeSpent', label: 'Waktu (detik)' },
      { key: 'attempts', label: 'Percobaan' },
      { key: 'score', label: 'Skor' },
      { key: 'completed', label: 'Selesai' },
      { key: 'date', label: 'Tanggal' },
    ])
    downloadCsv(csv, `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Memuat data dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-slate-400 text-sm mt-1">
            Pantau progress siswa dan data penelitian
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFull}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            📊 Export Nilai & ARCS
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon="👥"
          label="Total Siswa"
          value={students.length}
          sub={`Grup A: ${groupA.length} | Grup B: ${groupB.length}`}
          color="indigo"
        />
        <SummaryCard
          icon="✅"
          label="Siswa Aktif"
          value={activeStudents.length}
          sub={`${students.length > 0 ? Math.round((activeStudents.length / students.length) * 100) : 0}% dari total`}
          color="emerald"
        />
        <SummaryCard
          icon="📝"
          label="Total Log Aktivitas"
          value={logs.length}
          sub={`${activityProgress.length} jenis aktivitas`}
          color="amber"
        />
        <SummaryCard
          icon="🏆"
          label="Rata-rata XP"
          value={
            students.length > 0
              ? Math.round(students.reduce((s, st) => s + st.totalXp, 0) / students.length)
              : 0
          }
          sub={`Level maks: ${Math.max(...students.map(s => s.level), 1)}`}
          color="purple"
        />
      </div>

      {/* Group Comparison */}
      <Section title="Perbandingan Grup A vs Grup B" icon="⚖️">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupComparison.map(g => (
            <div
              key={g.group}
              className={`rounded-xl p-5 border ${
                g.group === 'A'
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : 'bg-orange-500/10 border-orange-500/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                    g.group === 'A'
                      ? 'bg-blue-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {g.group}
                </div>
                <div>
                  <h3 className="text-white font-semibold">Grup {g.group}</h3>
                  <p className="text-slate-400 text-xs">{g.studentCount} siswa</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricBox label="Rata-rata XP" value={g.avgXp} />
                <MetricBox label="Rata-rata Waktu/Aktivitas" value={formatSeconds(g.avgTimePerActivity)} />
                <MetricBox label="Rata-rata Percobaan" value={g.avgAttempts} />
                <MetricBox label="Total Selesai" value={g.totalCompleted} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Student Table */}
      <Section
        title="Data Per-Siswa"
        icon="👥"
        action={
          <button
            onClick={handleExportStudents}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            📥 Export CSV
          </button>
        }
      >
        <div className="mb-4">
          <input
            type="text"
            placeholder="Cari nama atau email siswa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-slate-400 text-left">
                <SortableHeader label="Nama" sortKey="name" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortableHeader label="Grup" sortKey="groupType" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortableHeader label="XP" sortKey="totalXp" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortableHeader label="Level" sortKey="level" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <th className="px-4 py-3 font-medium">Badges</th>
                <SortableHeader label="Aktivitas Selesai" sortKey="completedActivities" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <th className="px-4 py-3 font-medium">Terakhir Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {searchQuery ? 'Tidak ada siswa yang cocok' : 'Belum ada data siswa'}
                  </td>
                </tr>
              ) : (
                sortedStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{s.name}</p>
                        <p className="text-slate-500 text-xs">{s.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.groupType === 'A'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        Grup {s.groupType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-indigo-400 font-medium">{s.totalXp}</td>
                    <td className="px-4 py-3 text-white">{s.level}</td>
                    <td className="px-4 py-3">
                      {s.badgesEarned.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {s.badgesEarned.map((b, i) => (
                            <span key={i} className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white">{s.completedActivities}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {s.lastActive
                        ? new Date(s.lastActive).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Activity Progress */}
      <Section title="Progress per Aktivitas" icon="📈">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activityProgress.length === 0 ? (
            <p className="text-slate-500 col-span-full text-center py-8">Belum ada data aktivitas</p>
          ) : (
            activityProgress.map(a => {
              const pct = a.totalStudents > 0
                ? Math.round((a.completedCount / a.totalStudents) * 100)
                : 0
              return (
                <div
                  key={a.activityName}
                  className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium text-sm truncate">{a.activityName}</h4>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                      {a.completedCount}/{a.totalStudents}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Waktu: {formatSeconds(a.avgTime)}</span>
                    <span>Percobaan: {a.avgAttempts}x</span>
                    <span>Skor: {a.avgScore}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Section>

      {/* Activity Log Table */}
      <Section
        title="Log Aktivitas Detail"
        icon="📋"
        action={
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            📥 Export CSV
          </button>
        }
      >
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
                <th className="px-4 py-3 font-medium">Selesai</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Belum ada log aktivitas
                  </td>
                </tr>
              ) : (
                logs.slice(0, 100).map(l => {
                  const profile = profiles.find(p => p.id === l.user_id)
                  return (
                    <tr key={l.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-white">{profile?.name ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            profile?.group_type === 'A'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {profile?.group_type ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{l.activity_name}</td>
                      <td className="px-4 py-3 text-slate-400">{formatSeconds(l.time_spent_seconds)}</td>
                      <td className="px-4 py-3 text-slate-400">{l.attempt_count}x</td>
                      <td className="px-4 py-3 text-slate-400">{l.score}</td>
                      <td className="px-4 py-3">
                        {l.completed ? (
                          <span className="text-emerald-400">✓</span>
                        ) : (
                          <span className="text-slate-600">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(l.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
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
          {logs.length > 100 && (
            <div className="px-4 py-3 bg-slate-800 text-slate-400 text-xs text-center border-t border-slate-700">
              Menampilkan 100 dari {logs.length} log. Export CSV untuk melihat semua data.
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string
  label: string
  value: number
  sub: string
  color: 'indigo' | 'emerald' | 'amber' | 'purple'
}) {
  const colors = {
    indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/20',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-5 border`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-slate-400 text-sm font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-slate-500 text-xs">{sub}</p>
    </div>
  )
}

function MetricBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold text-lg">{value}</p>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
  action,
}: {
  title: string
  icon: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onClick,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  dir: SortDir
  onClick: (key: SortKey) => void
}) {
  const isActive = sortKey === currentKey
  return (
    <th
      className="px-4 py-3 font-medium cursor-pointer hover:text-slate-200 transition-colors select-none"
      onClick={() => onClick(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-indigo-400">{dir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  )
}
