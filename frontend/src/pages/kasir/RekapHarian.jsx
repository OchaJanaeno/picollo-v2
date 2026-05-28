import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { rekapService } from '../../services/rekapService'

export default function KasirRekapHarian() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // const res = await rekapService.getHarian()
      // setData(res.data.data)
      setData(null)
    } catch { setData(null) }
    finally { setLoading(false) }
  }

  const handleKirim = async () => {
    setSending(true)
    try {
      // await rekapService.kirimKeAdmin({ date: new Date().toISOString().split('T')[0] })
      setSent(true)
    } catch {} finally { setSending(false) }
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Rekap Harian</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Rekap transaksi hari ini</p>
          </div>
          <button onClick={handleKirim} disabled={sending || sent || !data}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors
              ${sent ? 'bg-green-600 text-white' : 'bg-red-800 hover:bg-red-900 disabled:bg-zinc-300 text-white'}`}>
            {sent ? '✓ Terkirim ke Admin' : sending ? 'Mengirim...' : 'Kirim ke Admin'}
          </button>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-zinc-200 rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : !data ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-400 text-sm">
            Belum ada data rekap. Data akan muncul setelah backend terhubung.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Transaksi', val: data.total_transaksi, color: 'bg-zinc-900' },
                { label: 'Total Omzet',     val: data.total_omzet,     color: 'bg-red-800' },
                { label: 'QRIS',            val: data.total_qris,      color: 'bg-zinc-700' },
                { label: 'Tunai',           val: data.total_tunai,     color: 'bg-zinc-600' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-2xl px-4 py-4 text-white`}>
                  <p className="text-white/70 text-xs mb-1">{s.label}</p>
                  <p className="text-xl font-bold">{s.val}</p>
                </div>
              ))}
            </div>

            {/* Tabel transaksi hari ini */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h3 className="font-bold text-zinc-900 text-sm">Detail Transaksi</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      {['ID', 'Produk', 'Qty', 'Total', 'Metode', 'Waktu', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {(data.transaksi || []).length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-zinc-400 text-sm">Belum ada transaksi</td></tr>
                    ) : (data.transaksi || []).map(tx => (
                      <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3 text-xs font-mono font-semibold text-zinc-900">{tx.id}</td>
                        <td className="px-5 py-3 text-sm text-zinc-700">{tx.produk}</td>
                        <td className="px-5 py-3 text-sm text-zinc-700">{tx.qty}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-zinc-900">{tx.total}</td>
                        <td className="px-5 py-3"><span className="text-xs bg-zinc-100 text-zinc-700 font-semibold px-2.5 py-1 rounded-full">{tx.metode}</span></td>
                        <td className="px-5 py-3 text-sm text-zinc-500">{tx.waktu}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                            ${tx.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}