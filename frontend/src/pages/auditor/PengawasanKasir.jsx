import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'

export default function AuditorPengawasanKasir() {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterOutlet, setFilterOutlet] = useState('semua')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // TODO: const res = await auditorService.getPengawasanKasir()
      // setData(res.data.data || [])
      setData([
        {
          id: 1,
          nama: 'Andi Santoso',
          outlet: 'Outlet Malang 1',
          status: 'online',
          transaksiHariIni: 12,
          omzetHariIni: 1800000,
          loginTerakhir: '08:03 WIB',
          aktivitasTerakhir: '10:45 WIB - Input Transaksi',
        },
        {
          id: 2,
          nama: 'Citra Dewi',
          outlet: 'Outlet Malang 2',
          status: 'online',
          transaksiHariIni: 8,
          omzetHariIni: 1200000,
          loginTerakhir: '07:55 WIB',
          aktivitasTerakhir: '10:30 WIB - Rekap Harian',
        },
        {
          id: 3,
          nama: 'Doni Pratama',
          outlet: 'Outlet Batu',
          status: 'offline',
          transaksiHariIni: 0,
          omzetHariIni: 0,
          loginTerakhir: 'Kemarin 17:30 WIB',
          aktivitasTerakhir: 'Kemarin 17:28 WIB - Logout',
        },
      ])
    } catch { setData([]) }
    finally { setLoading(false) }
  }

  const outletList = ['semua', ...new Set(data.map(d => d.outlet))]

  const filtered = data.filter(d => {
    const matchSearch  = d.nama?.toLowerCase().includes(search.toLowerCase())
    const matchOutlet  = filterOutlet === 'semua' || d.outlet === filterOutlet
    return matchSearch && matchOutlet
  })

  const totalTransaksi = data.reduce((s, d) => s + d.transaksiHariIni, 0)
  const totalOmzet     = data.reduce((s, d) => s + d.omzetHariIni, 0)
  const online         = data.filter(d => d.status === 'online').length

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header — READ ONLY, tidak ada tombol tambah */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Pengawasan Kasir</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Monitor aktivitas kasir secara real-time</p>
          </div>
          {/* Badge read-only — tidak ada tombol aksi */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200
                          text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Read Only
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Kasir',   val: data.length,  color: 'bg-zinc-900' },
            { label: 'Online',        val: online,        color: 'bg-green-700' },
            { label: 'Transaksi',     val: totalTransaksi, color: 'bg-zinc-700' },
            { label: 'Omzet Hari Ini', val: `Rp ${(totalOmzet/1000000).toFixed(1)}jt`, color: 'bg-red-800' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl px-5 py-4 text-white`}>
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-xl font-bold mt-1">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
          <div className="relative">
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama kasir..."
              className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                         focus:outline-none focus:border-red-800 transition-colors"/>
          </div>
          <div className="flex gap-2 flex-wrap">
            {outletList.map(o => (
              <button key={o} onClick={() => setFilterOutlet(o)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize
                            transition-all border
                  ${filterOutlet === o
                    ? 'bg-red-800 text-white border-red-800'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-red-300'}`}>
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Kasir */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-200 rounded-2xl h-44 animate-pulse"/>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(k => (
              <div key={k.id}
                className="bg-white rounded-2xl border border-zinc-200 p-5
                           hover:border-zinc-300 transition-all">
                {/* Header card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-900/10 rounded-full flex items-center
                                    justify-center shrink-0">
                      <span className="text-red-800 text-sm font-bold">
                        {k.nama?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">{k.nama}</p>
                      <p className="text-zinc-400 text-xs">{k.outlet}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                    ${k.status === 'online'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-zinc-100 text-zinc-500'}`}>
                    {k.status}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
                    <p className="text-zinc-400 text-xs">Transaksi</p>
                    <p className="text-zinc-900 font-bold">{k.transaksiHariIni}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl px-3 py-2.5">
                    <p className="text-zinc-400 text-xs">Omzet</p>
                    <p className="text-zinc-900 font-bold text-sm">
                      Rp {(k.omzetHariIni/1000).toFixed(0)}rb
                    </p>
                  </div>
                </div>

                {/* Aktivitas */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Login</span>
                    <span className="text-zinc-700 font-medium">{k.loginTerakhir}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Aktivitas</span>
                    <span className="text-zinc-700 font-medium text-right max-w-[140px] truncate">
                      {k.aktivitasTerakhir}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}