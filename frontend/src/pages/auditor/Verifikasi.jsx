import { useState } from 'react'
import Layout from '../../components/Layout'

// Format hash yang valid: 64 karakter hex (SHA-256)
// Contoh: a3f2c8e1b4d7...
const isValidHash = (h) => /^[a-fA-F0-9]{64}$/.test(h.trim())

export default function AuditorVerifikasi() {
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('') // error validasi frontend
  const [hasil, setHasil] = useState(null) // null | { status, transaksi }

  const handleVerifikasi = async () => {
    // Reset state
    setError('')
    setHasil(null)

    // Validasi frontend SEBELUM kirim ke API
    if (!hash.trim()) {
      setError('Hash tidak boleh kosong')
      return
    }
    if (!isValidHash(hash)) {
      setError('Format hash tidak valid. Hash harus berupa 64 karakter hexadecimal (SHA-256)')
      return
    }

    setLoading(true)
    try {
      // TODO: backend siap → uncomment:
      // const res = await verifikasiService.cekHash(hash.trim())
      // setHasil(res.data.data)

      // Dummy sementara — simulasi 3 kemungkinan hasil
      await new Promise(r => setTimeout(r, 1500))

      // Simulasi berdasarkan karakter pertama hash (hanya untuk demo)
      const firstChar = hash.trim()[0].toLowerCase()
      if (firstChar < '4') {
        // Hash valid → transaksi tidak diubah
        setHasil({
          status: 'valid',
          transaksi: {
            id: 'TX-' + hash.slice(0, 6).toUpperCase(),
            nominal: 'Rp 150.000',
            kasir: 'Andi Santoso',
            outlet: 'Outlet Malang 1',
            waktu: '20 Mei 2026, 10:32',
            produk: 'Kopi Hitam x2, Croissant x1',
            hash_blockchain: hash.trim(),
          }
        })
      } else if (firstChar < '8') {
        // Hash tidak cocok → kemungkinan FRAUD
        setHasil({
          status: 'fraud',
          detail: 'Hash transaksi tidak cocok dengan yang tersimpan di blockchain. Data kemungkinan telah dimanipulasi.',
          hash_input: hash.trim(),
          hash_blockchain: 'a' + hash.slice(1).trim(),
        })
      } else {
        // Hash tidak ditemukan
        setHasil({ status: 'not_found' })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan verifikasi. Coba lagi.')
    } finally { setLoading(false) }
  }

  const handleReset = () => {
    setHash('')
    setHasil(null)
    setError('')
  }

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Verifikasi Hash</h2>
          <p className="text-zinc-500 text-sm mt-0.5">
            Masukkan hash transaksi untuk memverifikasi keaslian data
          </p>
        </div>

        {/* Form Input Hash */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <label className="text-zinc-700 text-sm font-semibold mb-2 block">
            Hash Transaksi
          </label>
          <textarea
            value={hash}
            onChange={e => {
              setHash(e.target.value)
              // Clear error saat user mulai ketik
              if (error) setError('')
              if (hasil) setHasil(null)
            }}
            placeholder="Masukkan hash SHA-256 (64 karakter hexadecimal)&#10;Contoh: a3f2c8e1b4d7f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4"
            rows={3}
            className={`w-full border rounded-xl px-4 py-3 text-sm font-mono
                        focus:outline-none transition-colors resize-none
                        ${error
                ? 'border-red-400 bg-red-50 text-red-900'
                : 'border-zinc-300 focus:border-red-800 text-zinc-900'}`} />

          {/* Error validasi frontend */}
          {error && (
            <div className="flex items-start gap-2 mt-2">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <p className="text-xs text-zinc-400 mt-2">
            Hash tersedia di detail transaksi atau laporan yang diterima dari Admin
          </p>

          <div className="flex gap-2 mt-4">
            {hasil && (
              <button onClick={handleReset}
                className="flex-1 border border-zinc-300 text-zinc-700 font-semibold
                           py-2.5 rounded-xl text-sm hover:bg-zinc-50 transition-colors">
                Verifikasi Ulang
              </button>
            )}
            <button
              onClick={handleVerifikasi}
              disabled={loading || !hash.trim()}
              className={`font-semibold py-2.5 rounded-xl text-sm transition-colors
                          flex items-center justify-center gap-2
                ${hasil ? 'flex-1' : 'w-full'}
                bg-zinc-900 hover:bg-red-900 disabled:bg-zinc-300 text-white`}>
              {loading
                ? <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memverifikasi...
                </>
                : <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verifikasi Hash
                </>
              }
            </button>
          </div>
        </div>

        {/* Hasil Verifikasi */}
        {hasil && (
          <div className={`rounded-2xl border p-6
            ${hasil.status === 'valid'
              ? 'bg-green-50 border-green-200'
              : hasil.status === 'fraud'
                ? 'bg-red-50 border-red-200'
                : 'bg-zinc-50 border-zinc-200'}`}>

            {/* VALID */}
            {hasil.status === 'valid' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center
                                  justify-center shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-800 font-bold text-lg">✅ Transaksi VALID</p>
                    <p className="text-green-600 text-sm">
                      Hash cocok dengan blockchain. Data tidak dimanipulasi.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-green-200 p-4 space-y-2.5">
                  <p className="text-zinc-700 font-semibold text-sm mb-3">
                    Detail Transaksi
                  </p>
                  {[
                    { label: 'ID Transaksi', val: hasil.transaksi.id },
                    { label: 'Nominal', val: hasil.transaksi.nominal },
                    { label: 'Produk', val: hasil.transaksi.produk },
                    { label: 'Kasir', val: hasil.transaksi.kasir },
                    { label: 'Outlet', val: hasil.transaksi.outlet },
                    { label: 'Waktu', val: hasil.transaksi.waktu },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-zinc-500">{r.label}</span>
                      <span className="text-zinc-900 font-medium text-right max-w-xs">
                        {r.val}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-zinc-100">
                    <p className="text-zinc-500 text-xs mb-1">Hash Blockchain</p>
                    <p className="text-zinc-700 font-mono text-xs break-all">
                      {hasil.transaksi.hash_blockchain}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* FRAUD */}
            {hasil.status === 'fraud' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center
                                  justify-center shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-800 font-bold text-lg">⚠️ Indikasi FRAUD</p>
                    <p className="text-red-600 text-sm">{hasil.detail}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-red-200 p-4 space-y-3">
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Hash yang Anda masukkan</p>
                    <p className="font-mono text-xs text-zinc-700 break-all">
                      {hasil.hash_input}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Hash di Blockchain</p>
                    <p className="font-mono text-xs text-red-600 break-all">
                      {hasil.hash_blockchain}
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-red-100 rounded-xl p-4">
                  <p className="text-red-800 font-semibold text-sm mb-2">
                    Tindakan yang Disarankan:
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Laporkan temuan ini kepada Admin segera',
                      'Catat waktu penemuan dan hash yang tidak cocok',
                      'Jangan ubah atau hapus data apapun sebagai bukti',
                      'Minta Admin untuk audit log aktivitas database',
                    ].map((s, i) => (
                      <li key={i} className="text-red-700 text-xs flex items-start gap-1.5">
                        <span className="shrink-0">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* NOT FOUND */}
            {hasil.status === 'not_found' && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center
                                justify-center shrink-0">
                  <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-zinc-800 font-bold text-lg">❓ Hash Tidak Ditemukan</p>
                  <p className="text-zinc-600 text-sm">
                    Hash ini tidak ada di blockchain. Pastikan hash yang dimasukkan benar.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}