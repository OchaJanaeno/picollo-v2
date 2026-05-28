import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { transaksiService } from '../../services/transaksiService'

export default function AuditorTransaksi() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try {
      // const res = await transaksiService.getAll()
      // setData(res.data.data || [])
      setData([])
    } catch { setData([]) }
    finally { setLoading(false) }
  }

  const filtered = data.filter(tx => {
    const matchSearch = tx.id?.toLowerCase().includes(search.toLowerCase()) || tx.outlet?.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filterStatus === 'semua' || tx.status === filterStatus)
  })

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Validitas Transaksi</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Pantau status validitas setiap transaksi</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
          <div className="relative">
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari ID transaksi atau outlet..."
              className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-800 transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['semua', 'verified', 'pending', 'fraud'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border
                  ${filterStatus === s ? 'bg-red-800 text-white border-red-800' : 'bg-white text-zinc-600 border-zinc-200 hover:border-red-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['ID Transaksi', 'Kasir', 'Outlet', 'Total', 'Hash', 'Waktu', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-8 bg-zinc-100 rounded-lg animate-pulse" /></td></tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-zinc-400 text-sm">Belum ada data transaksi</td></tr>
                ) : filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono font-semibold text-zinc-900">{tx.id}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{tx.kasir}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{tx.outlet}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold">{tx.total}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-zinc-400 max-w-24 truncate">{tx.hash}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{tx.waktu}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                        ${tx.status === 'verified' ? 'bg-green-100 text-green-700' :
                          tx.status === 'fraud' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {tx.status}
                      </span>
                    </td>
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