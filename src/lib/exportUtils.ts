export function arrayToCsv<T>(
  data: T[],
  columns: { key: keyof T; label: string }[],
): string {
  const header = columns.map(c => `"${c.label}"`).join(',')
  const rows = data.map(row =>
    columns
      .map(c => {
        const val = row[c.key]
        if (val === null || val === undefined) return '""'
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
        if (Array.isArray(val)) return `"${val.join(', ')}"`
        return `"${String(val)}"`
      })
      .join(',')
  )
  return [header, ...rows].join('\n')
}

export function downloadCsv(csvContent: string, filename: string) {
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return `${hours}h ${remainMins}m`
}
