import { useState } from 'react'
import Layout from '../../components/Layout'
import { verifikasiService } from '../../services/verifikasiService'

export default function AdminVerifikasi() {
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!hash.trim()) return
    setLoading(true)
    setResult(null)
    try {
      // const res = await verifikasiService.verifyHash(hash)
      // setResult(res.data.data)
      setResult(null)
      alert('Verifikasi akan tersedia setelah backend terhubung')
    } catch (err) {
      setResult({ valid: false, error: err.response?.data?.message || 'Hash tidak ditemukan' })
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Verifikasi Blockchain</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Verifikasi keaslian data transaksi melalui hash blockchain</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h3 className="font-bold text-zinc-900 mb-1">Input Hash Transaksi</h3>
          <p className="text-zinc-500 text-sm mb-5">Masukkan hash SHA-256 dari transaksi yang ingin diverifikasi</p>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Hash Transaksi</label>
              <input type="text" value={hash} onChange={e => setHash(e.target.value)}
                placeholder="Contoh: abc123hash..."
                className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm font-mono
                           text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-red-800 transition-colors" />
            </div>
            <button type="submit" disabled={loading || !hash.trim()}
              className="w-full bg-red-800 hover:bg-red-900 disabled:bg-zinc-300 text-white
                         font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memverifikasi...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verifikasi Hash
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl p-6 border ${result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center
                ${result.valid ? 'bg-green-100' : 'bg-red-100'}`}>
                {result.valid
                  ? <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  : <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                }
              </div>
              <div>
                <p className={`font-bold text-lg ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
                  {result.valid ? 'Transaksi Valid' : 'Fraud Detected!'}
                </p>
                <p className={`text-sm ${result.valid ? 'text-green-600' : 'text-red-600'}`}>
                  {result.valid ? 'Data transaksi cocok dengan blockchain' : result.error || 'Hash tidak cocok dengan blockchain'}
                </p>
              </div>
            </div>
            {result.valid && result.data && (
              <div className="bg-white rounded-xl p-4 space-y-2">
                {Object.entries(result.data).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-zinc-500 capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className="text-zinc-900 font-medium font-mono">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200">
          <h4 className="font-semibold text-zinc-700 text-sm mb-3">Cara kerja verifikasi blockchain:</h4>
          <div className="space-y-2">
            {[
              'Hash transaksi dikirim ke sistem verifikasi',
              'Sistem mengambil data dari database internal',
              'Data dibandingkan dengan record di blockchain',
              'Jika cocok → Verified. Jika tidak → Fraud Detected',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-800 text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-zinc-600 text-sm">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}