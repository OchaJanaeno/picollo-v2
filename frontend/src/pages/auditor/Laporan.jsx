import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { laporanService } from '../../services/laporanService'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length)
    return <div className="bg-zinc-900 rounded-xl px-4 py-2.5"><p className="text-zinc-400 text-xs mb-1">{label}</p><p className="text-white font-bold text-sm">{payload[0].value}</p></div>
  return null
}

export default function AuditorLaporan() {
  const [data, setData] = useState({ revenue: [] })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('bulanan')

  useEffect(() => { fetchData() }, [period])
  const fetchData = async () => {
    setLoading(true)
    try {
      // const res = await laporanService.getKeuangan({ period })
      // setData(res.data.data)
      setData({ revenue: [] })
    } catch { setData({ revenue: [] }) }
    finally { setLoading(false) }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Laporan Keuangan</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Laporan keuangan (read-only)</p>
          </div>
          <div className="flex gap-2">
            {['harian', 'bulanan', 'tahunan'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border
                  ${period === p ? 'bg-red-800 text-white border-red-800' : 'bg-white text-zinc-600 border-zinc-200 hover:border-red-300'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-zinc-200">
          <h3 className="font-bold text-zinc-900 text-sm mb-1">Tren Omzet</h3>
          <p className="text-zinc-400 text-xs mb-5">Periode: {period}</p>
          {loading ? <div className="h-52 bg-zinc-100 rounded-xl animate-pulse" /> :
            data.revenue.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-zinc-400 text-sm">Belum ada data laporan</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.revenue} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#991b1b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#991b1b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#991b1b" strokeWidth={2.5} fill="url(#grad2)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>
    </Layout>
  )
}