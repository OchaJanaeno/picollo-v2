import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import api from '../../services/api'

const formatRupiah = (num) => {
  if (!num && num !== 0) return '-'
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`
  if (num >= 1000)    return `Rp ${(num / 1000).toFixed(0)}rb`
  return `Rp ${num.toLocaleString('id-ID')}`
}

function StatusBadge({ status }) {
  const map = {
    verified: { label: 'Verified',  cls: 'bg-green-100 text-green-700' },
    fraud:    { label: 'Fraud',     cls: 'bg-red-100 text-red-700' },
    pending:  { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' },
    success:  { label: 'Success',   cls: 'bg-green-100 text-green-700' },
    voided:   { label: 'Voided',    cls: 'bg-zinc-100 text-zinc-500' },
    aktif:    { label: 'Aktif',     cls: 'bg-green-100 text-green-700' },
    warning:  { label: 'Warning',   cls: 'bg-orange-100 text-orange-700' },
    nonaktif: { label: 'Nonaktif',  cls: 'bg-zinc-100 text-zinc-500' },
  }
  const s = map[status] || map.pending
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 shadow-xl">
        <p className="text-zinc-400 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">{formatRupiah(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/20 rounded-lg ${className}`} />
)

const STAT_ICONS = {
  omzet:     "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  transaksi: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  outlet:    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  anomali:   "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
}

export default function AdminDashboard() {
  const [period, setPeriod]         = useState('6bln')
  const [loading, setLoading]       = useState(true)
  const [stats, setStats]           = useState(null)
  const [transactions, setTransactions] = useState([])
  const [outlets, setOutlets]       = useState([])
  const [chartData, setChartData]   = useState([])

  useEffect(() => { fetchDashboard() }, [period])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      // FIX: route yang benar sesuai routes/api.php
      const [statsRes, txRes, outletRes] = await Promise.all([
        api.get('/dashboard/admin'),
        api.get('/transactions?per_page=5'),
        api.get('/outlets'),
      ])

      const statData = statsRes.data.data?.stat_cards || statsRes.data.data || null
      setStats(statData)

      setTransactions(txRes.data.data?.data || txRes.data.data || [])
      setOutlets(outletRes.data.data?.data || outletRes.data.data || [])

      // Chart dari grafik_pendapatan di response dashboard
      const grafik = statsRes.data.data?.grafik_pendapatan || []
      const mapped = grafik.map(g => ({
        label: g.tanggal,
        total: parseFloat(g.total) || 0,
        jumlah: g.jumlah_transaksi || 0,
      }))
      setChartData(mapped)
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      key:    'omzet',
      label:  'Pendapatan Hari Ini',
      value:  loading ? null : formatRupiah(stats?.pendapatan_hari_ini || 0),
      change: stats?.total_pendapatan ? `Total: ${formatRupiah(stats.total_pendapatan)}` : '-',
      up:     null,
      color:  'bg-red-800',
      icon:   STAT_ICONS.omzet,
    },
    {
      key:    'transaksi',
      label:  'Transaksi Hari Ini',
      value:  loading ? null : (stats?.transaksi_hari_ini ?? '-'),
      change: '-',
      up:     null,
      color:  'bg-zinc-800',
      icon:   STAT_ICONS.transaksi,
    },
    {
      key:    'outlet',
      label:  'Outlet Aktif',
      value:  loading ? null : (stats?.total_outlet_aktif ?? '-'),
      change: stats?.total_produk_aktif ? `${stats.total_produk_aktif} produk aktif` : '-',
      up:     null,
      color:  'bg-zinc-700',
      icon:   STAT_ICONS.outlet,
    },
    {
      key:    'keuntungan',
      label:  'Est. Keuntungan Stok',
      value:  loading ? null : formatRupiah(stats?.estimasi_keuntungan || 0),
      change: '-',
      up:     null,
      color:  'bg-red-900',
      icon:   STAT_ICONS.anomali,
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Dashboard</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Selamat datang, Owner</p>
          </div>
          <div className="flex items-center gap-2">
            {['7hr', '30hr', '6bln'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${period === p
                    ? 'bg-red-800 text-white'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:border-red-300'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card) => (
            <div key={card.key} className={`${card.color} rounded-2xl p-4 sm:p-5 text-white`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-white/70 text-xs sm:text-sm font-medium leading-tight">
                  {card.label}
                </p>
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                  </svg>
                </div>
              </div>
              {loading
                ? <Skeleton className="h-8 w-24 mb-2" />
                : <p className="text-xl sm:text-2xl font-bold mb-1">{card.value}</p>
              }
              <p className="text-xs font-medium text-white/50">{card.change}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-zinc-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm sm:text-base">Tren Omzet</h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {period === '7hr' ? '7 hari' : period === '30hr' ? '30 hari' : '6 bulan'} terakhir
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="omzetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#991b1b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#991b1b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#991b1b" strokeWidth={2.5}
                  fill="url(#omzetGrad)" dot={{ fill: '#991b1b', r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
            {!loading && chartData.length === 0 && (
              <p className="text-center text-zinc-400 text-xs mt-4">Belum ada data transaksi</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-zinc-200">
            <div className="mb-5">
              <h3 className="font-bold text-zinc-900 text-sm sm:text-base">Omzet per Outlet</h3>
              <p className="text-zinc-400 text-xs mt-0.5">Bulan ini</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={outlets.map(o => ({
                  nama:  o.nama?.split(' ')[0] || '-',
                  omzet: parseFloat(o.total_omzet || 0),
                }))}
                margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="nama" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="omzet" fill="#991b1b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {!loading && outlets.length === 0 && (
              <p className="text-center text-zinc-400 text-xs mt-4">Belum ada outlet</p>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-sm">Transaksi Terbaru</h3>
              <a href="/admin/transaksi" className="text-red-800 text-xs font-semibold hover:underline">
                Lihat semua
              </a>
            </div>
            <div className="divide-y divide-zinc-50">
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="animate-pulse bg-zinc-100 rounded-lg w-8 h-8 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="animate-pulse bg-zinc-100 rounded h-3 w-32" />
                      <div className="animate-pulse bg-zinc-100 rounded h-2 w-20" />
                    </div>
                  </div>
                ))
              ) : transactions.length === 0 ? (
                <p className="text-center text-zinc-400 text-xs py-8">Belum ada transaksi hari ini</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-zinc-500 text-xs font-mono font-bold">
                          {tx.metode_pembayaran === 'qris' ? 'QR' : tx.metode_pembayaran === 'transfer' ? 'TF' : 'TN'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-zinc-900 text-xs font-semibold truncate">
                          {tx.transaction_code} · {tx.kasir?.name || '-'}
                        </p>
                        <p className="text-zinc-400 text-xs">
                          {tx.outlet?.nama || '-'} · {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-zinc-900 text-xs font-semibold hidden sm:block">
                        {formatRupiah(tx.total_amount)}
                      </span>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Outlet Status */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-sm">Status Outlet</h3>
              <a href="/admin/outlet" className="text-red-800 text-xs font-semibold hover:underline">
                Kelola →
              </a>
            </div>
            <div className="divide-y divide-zinc-50">
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="animate-pulse bg-zinc-100 rounded-lg w-8 h-8 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="animate-pulse bg-zinc-100 rounded h-3 w-28" />
                      <div className="animate-pulse bg-zinc-100 rounded h-2 w-20" />
                    </div>
                  </div>
                ))
              ) : outlets.length === 0 ? (
                <p className="text-center text-zinc-400 text-xs py-8">Belum ada outlet</p>
              ) : (
                outlets.map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-red-900/10 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-zinc-900 text-xs font-semibold truncate">{o.nama}</p>
                        <p className="text-zinc-400 text-xs">{o.kode_outlet} · {o.total_transaksi || 0} transaksi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-zinc-700 text-xs font-semibold hidden sm:block">
                        {formatRupiah(o.total_omzet || 0)}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  )
}