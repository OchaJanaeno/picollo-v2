import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { logKoreksiService } from '../../services/logKoreksiService'

export default function AdminLogKoreksi() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // const res = await logKoreksiService.getAll()
      // setData(res.data.data || [])
      setData([])
    } catch { setData([]) }
    finally { setLoading(false) }
  }

  const filtered = data.filter(l =>
    l.id_transaksi?.toLowerCase().includes(search.toLowerCase()) ||
    l.kasir?.toLowerCase().includes(search.toLowerCase()) ||
    l.keterangan?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Log Koreksi</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Riwayat perubahan dan koreksi data transaksi</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <div className="relative">
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari ID transaksi, kasir, atau keterangan..."
              className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-800 transition-colors" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['ID Transaksi', 'Kasir', 'Outlet', 'Tipe Koreksi', 'Nilai Lama', 'Nilai Baru', 'Waktu', 'Keterangan'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-5 py-3"><div className="h-8 bg-zinc-100 rounded-lg animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-zinc-400 text-sm">Belum ada log koreksi</td></tr>
                ) : filtered.map((l, i) => (
                  <tr key={i} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono font-semibold text-zinc-900">{l.id_transaksi}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{l.kasir}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{l.outlet}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2.5 py-1 rounded-full">{l.tipe}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-red-600 line-through">{l.nilai_lama}</td>
                    <td className="px-5 py-3.5 text-sm text-green-600 font-semibold">{l.nilai_baru}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{l.waktu}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500 max-w-xs truncate">{l.keterangan}</td>
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