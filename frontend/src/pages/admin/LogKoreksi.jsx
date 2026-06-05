import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { logKoreksiService } from '../../services/logKoreksiService'
import DateFilter from '../../components/DateFilter'

export default function AdminLogKoreksi() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDateRange, setFilterDateRange] = useState({ start_date: '', end_date: '', date: '' })

  useEffect(() => { fetchData() }, [filterDateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { all: true }
      if (filterDateRange.start_date && filterDateRange.end_date) {
        params.start_date = filterDateRange.start_date
        params.end_date = filterDateRange.end_date
      } else if (filterDateRange.date) {
        params.date = filterDateRange.date
      }
      const res = await logKoreksiService.getAll(params)
      const raw = res.data.data?.data || res.data.data || []
      const mapped = raw.map(l => ({
        id: l.id,
        id_transaksi: l.transaction?.transaction_code || '-',
        kasir: l.corrected_by?.name || l.correctedBy?.name || '-',
        outlet: l.outlet?.nama || '-',
        tipe: l.correction_type || '-',
        nilai_lama: l.hash_sebelum ? l.hash_sebelum.substring(0, 12) + '...' : '-',
        nilai_baru: l.hash_sesudah ? l.hash_sesudah.substring(0, 12) + '...' : '-',
        waktu: l.created_at ? new Date(l.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
        keterangan: l.alasan || '-',
        status: l.status,
      }))
      setData(mapped)
    } catch (err) {
      console.error('Fetch log koreksi error:', err)
      setData([])
    }
    finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menyetujui koreksi ini?')) return
    try {
      await logKoreksiService.approve(id)
      fetchData()
    } catch (err) {
      alert('Gagal menyetujui koreksi: ' + (err.response?.data?.message || err.message))
    }
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
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari ID transaksi, kasir, atau keterangan..."
                className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
            <DateFilter onChange={setFilterDateRange} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['ID Transaksi', 'Kasir', 'Outlet', 'Tipe Koreksi', 'Nilai Lama', 'Nilai Baru', 'Waktu', 'Keterangan', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}><td colSpan={10} className="px-5 py-3"><div className="h-8 bg-zinc-100 rounded-lg animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-5 py-16 text-center text-zinc-400 text-sm">Belum ada log koreksi</td></tr>
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
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                        ${l.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'}`}>
                        {l.status === 'approved' ? 'Disetujui' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {l.status === 'flagged' && (
                        <button onClick={() => handleApprove(l.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors">
                          Setujui
                        </button>
                      )}
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