import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { laporanService } from '../../services/laporanService'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length)
    return (
      <div className="bg-zinc-900 rounded-xl px-4 py-2.5 shadow-xl">
        <p className="text-zinc-400 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">{payload[0].value}</p>
      </div>
    )
  return null
}

export default function AdminLaporan() {
  const [data, setData] = useState({ revenue: [], byOutlet: [], byProduct: [] })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('bulanan')
  const [exportLoading, setExportLoading] = useState(false)

  const getDateRange = (p) => {
    const end = new Date()
    const start = new Date()
    if (p === 'harian') start.setDate(end.getDate() - 7)
    else if (p === 'bulanan') start.setMonth(end.getMonth() - 1)
    else start.setFullYear(end.getFullYear() - 1)
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    }
  }

  useEffect(() => { fetchData() }, [period])

  const fetchData = async () => {
    setLoading(true)
    try {
      const range = getDateRange(period)
      const res = await laporanService.getKeuangan(range)
      const d = res.data.data || {}
      setData({
        revenue: (d.per_hari || []).map(h => ({ label: h.tanggal, value: Number(h.total) || 0 })),
        byOutlet: (d.per_outlet || []).map(o => ({ nama: o.outlet_nama || '-', omzet: Number(o.total) || 0 })),
        byProduct: [],
        ringkasan: d.ringkasan || {},
      })
    } catch (err) {
      console.error('Fetch laporan error:', err)
      setData({ revenue: [], byOutlet: [], byProduct: [] })
    }
    finally { setLoading(false) }
  }

  const handleExport = async (type) => {
    setExportLoading(true)
    try {
      const range = getDateRange(period)
      if (type === 'pdf') {
        const res = await laporanService.exportPdf(range)
        const url = URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a'); a.href = url
        a.download = `laporan-${range.start_date}-ke-${range.end_date}.pdf`; a.click()
        URL.revokeObjectURL(url)
      } else {
        alert('Export Excel belum tersedia di backend')
      }
    } catch (err) {
      console.error('Export error:', err)
      alert('Export gagal: ' + (err.response?.data?.message || err.message))
    }
    finally { setExportLoading(false) }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Laporan Keuangan</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Ringkasan performa keuangan bisnis</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['harian', 'bulanan', 'tahunan'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border
                  ${period === p ? 'bg-red-800 text-white border-red-800' : 'bg-white text-zinc-600 border-zinc-200 hover:border-red-300'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => handleExport('pdf')} disabled={exportLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors border border-zinc-900">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
            <button onClick={() => handleExport('xlsx')} disabled={exportLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors border border-green-700">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-zinc-200">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">Tren Omzet</h3>
            <p className="text-zinc-400 text-xs mb-5">Periode: {period}</p>
            {loading ? <div className="h-52 bg-zinc-100 rounded-xl animate-pulse" /> :
              data.revenue.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-zinc-400 text-sm">
                  Belum ada data laporan
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.revenue} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#991b1b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#991b1b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#991b1b" strokeWidth={2.5} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </div>

          <div className="bg-white rounded-2xl p-5 border border-zinc-200">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">Omzet per Outlet</h3>
            <p className="text-zinc-400 text-xs mb-5">Periode: {period}</p>
            {loading ? <div className="h-52 bg-zinc-100 rounded-xl animate-pulse" /> :
              data.byOutlet.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-zinc-400 text-sm">
                  Belum ada data outlet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.byOutlet} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis dataKey="nama" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="omzet" fill="#991b1b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>

        {/* Tabel produk terlaris */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900 text-sm">Produk Terlaris</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['Produk', 'Total Terjual', 'Omzet', 'Outlet'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}><td colSpan={4} className="px-5 py-3"><div className="h-8 bg-zinc-100 rounded-lg animate-pulse" /></td></tr>
                  ))
                ) : data.byProduct.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-zinc-400 text-sm">Belum ada data produk</td></tr>
                ) : data.byProduct.map((p, i) => (
                  <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900">{p.nama}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{p.terjual}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900">{p.omzet}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{p.outlet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}