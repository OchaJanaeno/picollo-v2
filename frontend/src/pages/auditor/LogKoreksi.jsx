import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { logKoreksiService } from '../../services/logKoreksiService'
import useAuthStore from '../../store/authStore'

export default function AuditorLogKoreksi() {
  const { activeOutletId } = useAuthStore()
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterTipe, setFilterTipe] = useState('semua')

  useEffect(() => { fetchData() }, [activeOutletId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await logKoreksiService.getAll({ all: true, outlet_id: activeOutletId })
      const raw = res.data.data?.data || res.data.data || []
      const mapped = raw.map(l => ({
        id: l.id,
        waktu: l.created_at ? new Date(l.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
        kasir: l.corrected_by?.name || l.correctedBy?.name || '-',
        outlet: l.outlet?.nama || '-',
        tipe: l.correction_type === 'void' ? 'hapus' : l.correction_type || '-',
        transaksiId: l.transaction?.transaction_code || '-',
        perubahan: l.correction_type === 'void' ? 'Transaksi di-void' : 
          `Hash: ${l.hash_sebelum ? l.hash_sebelum.substring(0, 8) + '...' : '-'} → ${l.hash_sesudah ? l.hash_sesudah.substring(0, 8) + '...' : '-'}`,
        alasan: l.alasan || '-',
        disetujui: l.status === 'approved',
        status: l.status,
      }))
      setData(mapped)
    } catch (err) {
      console.error('Fetch log koreksi error:', err)
      setData([])
    }
    finally { setLoading(false) }
  }

  const tipeColor = {
    edit:  'bg-blue-100 text-blue-700',
    hapus: 'bg-red-100 text-red-700',
    tambah: 'bg-green-100 text-green-700',
  }

  const filtered = data.filter(d => {
    const matchSearch = d.kasir?.toLowerCase().includes(search.toLowerCase()) ||
                        d.transaksiId?.toLowerCase().includes(search.toLowerCase())
    const matchTipe   = filterTipe === 'semua' || d.tipe === filterTipe
    return matchSearch && matchTipe
  })

  return (
    <Layout>
      <div className="space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Log Koreksi</h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Riwayat semua perubahan data transaksi
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200
                          text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Read Only
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-blue-700 text-xs">
            🔍 <strong>Audit Trail</strong> — Setiap perubahan transaksi tercatat di sini lengkap
            dengan waktu, pelaku, dan alasannya. Data ini digunakan untuk mendeteksi potensi
            manipulasi data.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Log',     val: data.length,                             color: 'bg-zinc-900' },
            { label: 'Edit',          val: data.filter(d => d.tipe === 'edit').length,  color: 'bg-blue-700' },
            { label: 'Hapus',         val: data.filter(d => d.tipe === 'hapus').length, color: 'bg-red-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl px-5 py-4 text-white`}>
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
          <div className="relative">
            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari kasir atau ID transaksi..."
              className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                         focus:outline-none focus:border-yellow-400 transition-colors"/>
          </div>
          <div className="flex gap-2">
            {['semua', 'edit', 'hapus', 'tambah'].map(t => (
              <button key={t} onClick={() => setFilterTipe(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize
                            transition-all border
                  ${filterTipe === t
                    ? 'bg-yellow-400 text-zinc-900 border-yellow-400'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-yellow-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['Waktu', 'Kasir', 'Outlet', 'Tipe', 'ID Transaksi', 'Perubahan', 'Alasan', 'Status'].map(h => (
                    <th key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500
                                 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-5 py-3">
                        <div className="h-8 bg-zinc-100 rounded-lg animate-pulse"/>
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <p className="text-zinc-500 text-sm">Belum ada log koreksi</p>
                    </td>
                  </tr>
                ) : filtered.map(d => (
                  <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-zinc-500 whitespace-nowrap">
                      {d.waktu}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900">
                      {d.kasir}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{d.outlet}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                        ${tipeColor[d.tipe] || 'bg-zinc-100 text-zinc-600'}`}>
                        {d.tipe}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-700">
                      {d.transaksiId}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-700 max-w-xs">
                      {d.perubahan}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500 max-w-xs">
                      {d.alasan}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                        ${d.disetujui
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'}`}>
                        {d.disetujui ? 'Disetujui' : 'Pending'}
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