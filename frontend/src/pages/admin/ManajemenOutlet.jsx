import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api'

const formatRupiah = (num) => {
  if (!num && num !== 0) return 'Rp 0'
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`
  if (num >= 1000)    return `Rp ${(num / 1000).toFixed(0)}rb`
  return `Rp ${num.toLocaleString('id-ID')}`
}

function StatusBadge({ status }) {
  const map = {
    aktif:    { label: 'Aktif',    cls: 'bg-green-100 text-green-700' },
    warning:  { label: 'Warning',  cls: 'bg-orange-100 text-orange-700' },
    nonaktif: { label: 'Nonaktif', cls: 'bg-zinc-100 text-zinc-500' },
  }
  const s = map[status] || map.nonaktif
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
}

function SkeletonCard() {
  return <div className="bg-zinc-200 rounded-2xl h-44 animate-pulse" />
}

function EmptyState() {
  return (
    <div className="col-span-full bg-white rounded-2xl border border-zinc-200 p-16 text-center">
      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <p className="text-zinc-900 font-semibold mb-1">Belum ada outlet</p>
      <p className="text-zinc-400 text-sm">Klik "Tambah Outlet" untuk membuat outlet pertama</p>
    </div>
  )
}

function ModalTambah({ onClose, onSave }) {
  const [form, setForm]     = useState({ nama: '', alamat: '', kota: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const setField = (f, v) => {
    setForm(p => ({ ...p, [f]: v }))
    setErrors(p => ({ ...p, [f]: null }))
  }

  const handleSave = async () => {
    const e = {}
    if (!form.nama) e.nama = 'Nama outlet tidak boleh kosong'
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    try {
      // FIX: Sekarang hit API yang sesungguhnya
      const res = await api.post('/outlets', {
        nama:   form.nama,
        alamat: form.alamat || null,
        kota:   form.kota   || null,
      })
      onSave(res.data.data)
    } catch (err) {
      setErrors({ global: err.response?.data?.message || 'Gagal membuat outlet' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900">Tambah Outlet Baru</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Kasir diassign melalui menu Manajemen Kasir</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {errors.global && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {errors.global}
            </div>
          )}
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Nama Outlet *</label>
            <input type="text" value={form.nama} onChange={e => setField('nama', e.target.value)}
              placeholder="Contoh: Outlet Surabaya"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors
                ${errors.nama ? 'border-red-400 bg-red-50' : 'border-zinc-300 focus:border-red-800'}`} />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Alamat</label>
            <textarea value={form.alamat} onChange={e => setField('alamat', e.target.value)}
              placeholder="Jl. Contoh No. 1" rows={3}
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-red-800 transition-colors resize-none" />
          </div>
          <div>
            <label className="text-zinc-700 text-sm font-semibold mb-1.5 block">Kota</label>
            <input type="text" value={form.kota} onChange={e => setField('kota', e.target.value)}
              placeholder="Contoh: Surabaya"
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-red-800 transition-colors" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-2">
          <button onClick={onClose}
            className="flex-1 border border-zinc-300 text-zinc-700 font-semibold py-2.5
                       rounded-xl text-sm hover:bg-zinc-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-red-800 hover:bg-red-900 disabled:bg-red-900/50 text-white
                       font-semibold py-2.5 rounded-xl text-sm transition-colors">
            {loading ? 'Menyimpan...' : 'Simpan Outlet'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalDetail({ outlet, onClose, onToggleStatus }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      // FIX: Hit API yang sesungguhnya untuk toggle status
      const newStatus = outlet.status === 'nonaktif' ? 'aktif' : 'nonaktif'
      await api.put(`/outlets/${outlet.id}`, { status: newStatus })
      onToggleStatus(outlet.id, newStatus)
    } catch (err) {
      console.error('Gagal toggle status:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <h3 className="font-bold text-zinc-900">Detail Outlet</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="bg-zinc-50 rounded-xl p-4 space-y-2.5">
            {[
              { label: 'Kode Outlet', val: outlet.kode_outlet || '-' },
              { label: 'Nama',        val: outlet.nama },
              { label: 'Alamat',      val: outlet.alamat || '-' },
              { label: 'Kota',        val: outlet.kota   || '-' },
              { label: 'Transaksi',   val: `${outlet.total_transaksi || 0} transaksi` },
              { label: 'Omzet',       val: formatRupiah(outlet.total_omzet || 0) },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-zinc-500">{r.label}</span>
                <span className="text-zinc-900 font-medium">{r.val}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm items-center">
              <span className="text-zinc-500">Status</span>
              <StatusBadge status={outlet.status} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 flex gap-2">
          <button onClick={handleToggle} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors border
              ${outlet.status === 'nonaktif'
                ? 'border-green-300 text-green-700 hover:bg-green-50'
                : 'border-red-300 text-red-700 hover:bg-red-50'}`}>
            {loading ? '...' : outlet.status === 'nonaktif' ? 'Aktifkan' : 'Nonaktifkan'}
          </button>
          <button onClick={onClose}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold
                       py-2.5 rounded-xl text-sm transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminOutlet() {
  const [outlets, setOutlets]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilter]   = useState('semua')
  const [showTambah, setShowTambah] = useState(false)
  const [detailOutlet, setDetail]   = useState(null)

  useEffect(() => { fetchOutlets() }, [])

  const fetchOutlets = async () => {
    setLoading(true)
    try {
      // FIX: Hit API yang sesungguhnya
      const res = await api.get('/outlets')
      setOutlets(res.data.data?.data || res.data.data || [])
    } catch (err) {
      console.error('Gagal fetch outlets:', err)
      setOutlets([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (outlet) => {
    setOutlets(prev => [outlet, ...prev])
    setShowTambah(false)
  }

  // FIX: handleToggleStatus sekarang terima newStatus dari ModalDetail
  const handleToggleStatus = (id, newStatus) => {
    setOutlets(prev => prev.map(o =>
      o.id === id ? { ...o, status: newStatus } : o
    ))
    setDetail(prev => prev ? { ...prev, status: newStatus } : null)
  }

  const filtered = outlets.filter(o => {
    const matchSearch = o.nama?.toLowerCase().includes(search.toLowerCase()) ||
                        o.alamat?.toLowerCase().includes(search.toLowerCase()) ||
                        o.kota?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'semua' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total:    outlets.length,
    aktif:    outlets.filter(o => o.status === 'aktif').length,
    warning:  outlets.filter(o => o.status === 'warning').length,
    nonaktif: outlets.filter(o => o.status === 'nonaktif').length,
  }

  return (
    <Layout>
      {showTambah && (
        <ModalTambah onClose={() => setShowTambah(false)} onSave={handleSave} />
      )}
      {detailOutlet && (
        <ModalDetail
          outlet={detailOutlet}
          onClose={() => setDetail(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Multi Outlet</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Kelola semua outlet bisnis Anda</p>
          </div>
          <button onClick={() => setShowTambah(true)}
            className="flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white
                       font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors
                       self-start sm:self-auto shadow-lg shadow-red-900/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Outlet
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Outlet', val: stats.total,    color: 'bg-zinc-900' },
            { label: 'Aktif',        val: stats.aktif,    color: 'bg-green-600' },
            { label: 'Warning',      val: stats.warning,  color: 'bg-orange-500' },
            { label: 'Nonaktif',     val: stats.nonaktif, color: 'bg-zinc-400' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl px-5 py-4 text-white`}>
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama atau alamat outlet..."
                className="w-full border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-sm
                           focus:outline-none focus:border-red-800 transition-colors" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['semua', 'aktif', 'warning', 'nonaktif'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all border
                    ${filterStatus === f
                      ? 'bg-red-800 text-white border-red-800'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-red-300'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
              ? <EmptyState />
              : filtered.map(outlet => (
                <div key={outlet.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-5
                             hover:border-red-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setDetail(outlet)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-900/10 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-zinc-900 font-bold text-sm">{outlet.nama}</p>
                        <p className="text-zinc-400 text-xs">{outlet.kode_outlet}</p>
                      </div>
                    </div>
                    <StatusBadge status={outlet.status} />
                  </div>

                  <p className="text-zinc-500 text-xs mb-4 line-clamp-2">
                    {outlet.alamat || outlet.kota || 'Alamat belum diisi'}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Kasir',     val: outlet.total_kasir     || 0 },
                      { label: 'Transaksi', val: outlet.total_transaksi || 0 },
                      { label: 'Omzet',     val: formatRupiah(outlet.total_omzet || 0) },
                    ].map(s => (
                      <div key={s.label} className="bg-zinc-50 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-zinc-900 font-bold text-xs">{s.val}</p>
                        <p className="text-zinc-400 text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </Layout>
  )
}