export default function PicolloLogo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { img: 'w-8 h-8',   text: 'text-sm',  sub: 'text-xs' },
    md: { img: 'w-10 h-10', text: 'text-base', sub: 'text-xs' },
    lg: { img: 'w-14 h-14', text: 'text-xl',  sub: 'text-xs' },
    xl: { img: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative shrink-0">
        {/* Glow */}
        <div className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10"
          style={{
            background: 'radial-gradient(circle, #ef4444 0%, #991b1b 60%, transparent 100%)',
            transform: 'scale(1.4)',
          }}
        />
        <img
          src="/logo.png"
          alt="Picollo"
          className={`${s.img} rounded-xl object-cover relative z-10`}
          style={{ boxShadow: '0 0 16px rgba(239,68,68,0.5), 0 0 32px rgba(153,27,27,0.3)' }}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextElementSibling.style.display = 'flex'
          }}
        />
        {/* Fallback — muncul kalau gambar gagal */}
        <div
          className={`${s.img} rounded-xl bg-red-800 items-center justify-center z-10 relative`}
          style={{
            display: 'none',
            boxShadow: '0 0 16px rgba(239,68,68,0.5)',
          }}
        >
          <span className="text-white font-black" style={{ fontSize: size === 'sm' ? 14 : 18 }}>P</span>
        </div>
      </div>

      {showText && (
        <div>
          <p className={`text-white font-bold leading-none ${s.text}`}
            style={{ textShadow: '0 0 16px rgba(239,68,68,0.4)' }}>
            Picollo
          </p>
          <p className={`text-zinc-500 tracking-widest ${s.sub}`}>
            BLOCKCHAIN-POWERED
          </p>
        </div>
      )}
    </div>
  )
}