import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { transaksiService } from '../../services/transaksiService'
import { verifikasiService } from '../../services/verifikasiService'

export default function AuditorDashboard() {
  const [stats, setStats] = useState(null)
  const [recentVerifikasi, setRecentVerifikasi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [txRes, verRes] = await Promise.all([
        transaksiService.getAll(),
        verifikasiService.getHistory(),
      ])
      
      const allTx = txRes.data.data?.data || txRes.data.data || []
      const verData = verRes.data.data?.data || verRes.data.data || []
      
      const verified = allTx.filter(tx => tx.hash_verification?.status === 'verified' || tx.status === 'success').length
      const fraud = allTx.filter(tx => tx.hash_verification?.status === 'fraud_detected').length
      const pending = allTx.length - verified - fraud
      
      setStats({
        total_transaksi: allTx.length,
        total_verified: verified,
        total_fraud: fraud,
        total_pending: pending,
      })
      
      // Recent verifications
      const recent = verData.slice(0, 5).map(v => ({
        hash: v.hash_sha256 ? v.hash_sha256.substring(0, 20) + '...' : '-',
        waktu: v.created_at ? new Date(v.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-',
        status: v.status || 'pending',
      }))
      setRecentVerifikasi(recent)
    } catch (err) {
      console.error('Fetch auditor dashboard error:', err)
      setStats(null); setRecentVerifikasi([])
    }
    finally { setLoading(false) }
  }

  const statCards = [
    { label: 'Total Transaksi', value: stats?.total_transaksi ?? '-', color: 'bg-zinc-800' },
    { label: 'Verified', value: stats?.total_verified ?? '-', color: 'bg-green-700' },
    { label: 'Fraud Detected', value: stats?.total_fraud ?? '-', color: 'bg-red-800' },
    { label: 'Pending', value: stats?.total_pending ?? '-', color: 'bg-zinc-600' },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Dashboard Auditor</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Overview hasil audit dan verifikasi transaksi</p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {loading ? [...Array(4)].map((_, i) => <div key={i} className="bg-zinc-200 rounded-2xl h-32 animate-pulse" />) :
            statCards.map(card => (
              <div key={card.label} className={`${card.color} rounded-2xl p-4 sm:p-5 text-white`}>
                <p className="text-white/70 text-xs sm:text-sm font-medium mb-3">{card.label}</p>
                <p className="text-xl sm:text-2xl font-bold">{card.value}</p>
              </div>
            ))
          }
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900 text-sm">Riwayat Verifikasi Terbaru</h3>
            <a href="/auditor/verifikasi" className="text-red-800 text-xs font-semibold hover:underline">Verifikasi baru →</a>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-zinc-100 rounded-xl animate-pulse" />)}</div>
          ) : recentVerifikasi.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-sm">Belum ada riwayat verifikasi</div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {recentVerifikasi.map((v, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-semibold text-zinc-900 truncate">{v.hash}</p>
                    <p className="text-xs text-zinc-400">{v.waktu}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2
                    ${v.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}