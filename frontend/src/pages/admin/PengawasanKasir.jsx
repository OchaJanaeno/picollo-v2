import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { kasirService } from '../../services/kasirService'

export default function AdminPengawasanKasir() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [activities, setActivities] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // const res = await kasirService.getAll()
      // setData(res.data.data || [])
      setData([])
    } catch { setData([]) }
    finally { setLoading(false) }
  }

  const fetchActivity = async (kasir) => {
    setSelected(kasir)
    setLoadingActivity(true)
    setActivities([])
    try {
      // const res = await kasirService.getActivity(kasir.id)
      // setActivities(res.data.data || [])
      setActivities([])
    } catch { setActivities([]) }
    finally { setLoadingActivity(false) }
  }

  const filtered = data.filter(k =>
    k.nama?.toLowerCase().includes(search.toLowerCase()) ||
    k.outlet?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Pengawasan Kasir</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Monitor aktivitas dan transaksi setiap kasir secara real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daftar Kasir */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-100">
              <div className="relative">
                <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari kasir..."
                  className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-800 transition-colors" />
              </div>
            </div>
            <div className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="p-4"><div className="h-10 bg-zinc-100 rounded-xl animate-pulse" /></div>
                ))
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-sm">Belum ada kasir</div>
              ) : filtered.map(k => (
                <button key={k.id} onClick={() => fetchActivity(k)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 transition-colors
                    ${selected?.id === k.id ? 'bg-red-50 border-l-2 border-red-800' : ''}`}>
                  <div className="w-9 h-9 bg-red-900/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-red-800 text-sm font-bold">{k.nama?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{k.nama}</p>
                    <p className="text-xs text-zinc-500">{k.outlet} · {k.total_transaksi} tx hari ini</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0
                    ${k.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {k.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detail Aktivitas */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm">Pilih kasir untuk melihat aktivitasnya</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900">Aktivitas: {selected.nama}</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">{selected.outlet}</p>
                  </div>
                </div>
                <div className="divide-y divide-zinc-50">
                  {loadingActivity ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="p-4"><div className="h-8 bg-zinc-100 rounded-xl animate-pulse" /></div>
                    ))
                  ) : activities.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400 text-sm">Belum ada aktivitas tercatat</div>
                  ) : activities.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-xs font-mono font-bold text-zinc-600">{a.metode === 'QRIS' ? 'QR' : 'TN'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{a.id_transaksi}</p>
                          <p className="text-xs text-zinc-500">{a.waktu}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900">{a.total}</span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                          ${a.status === 'verified' ? 'bg-green-100 text-green-700' :
                            a.status === 'fraud' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}