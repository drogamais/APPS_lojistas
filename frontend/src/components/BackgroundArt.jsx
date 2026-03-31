// src/components/BackgroundArt.jsx
export default function BackgroundArt() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-slate-50">
      
      {/* ── ARTE VETORIAL (Curvas e Geometria) ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Curvas Superiores */}
        {/* Camada 1: Cinza muito claro */}
        <path 
          d="M0,0 L1440,0 L1440,300 C1100,450 400,100 0,350 Z" 
          className="fill-slate-200/50" 
        />
        {/* Camada 2: Cinza levemente mais escuro */}
        <path 
          d="M0,0 L1440,0 L1440,150 C1000,250 500,50 0,200 Z" 
          className="fill-slate-200" 
        />
        {/* Camada 3: Toque do vermelho da marca */}
        <path 
          d="M0,0 L1440,0 L1440,50 C1100,150 600,0 0,100 Z" 
          className="fill-drogamais-500/10" 
        />

        {/* Curvas Inferiores */}
        {/* Camada 1: Cinza muito claro */}
        <path 
          d="M0,900 L1440,900 L1440,650 C1000,500 400,850 0,600 Z" 
          className="fill-slate-200/50" 
        />
        {/* Camada 2: Cinza levemente mais escuro */}
        <path 
          d="M0,900 L1440,900 L1440,750 C900,650 400,850 0,750 Z" 
          className="fill-slate-200" 
        />
        {/* Camada 3: Toque do vermelho da marca */}
        <path 
          d="M0,900 L1440,900 L1440,850 C1000,750 500,900 0,850 Z" 
          className="fill-drogamais-500/10" 
        />

        {/* Elementos Geométricos (Anéis) */}
        {/* Topo Direito */}
        <circle cx="1250" cy="150" r="300" className="stroke-slate-200" strokeWidth="2" fill="none" />
        <circle cx="1250" cy="150" r="200" className="stroke-drogamais-500/10" strokeWidth="1" fill="none" />
        
        {/* Base Esquerda */}
        <circle cx="150" cy="750" r="250" className="stroke-slate-200" strokeWidth="2" fill="none" />
        <circle cx="150" cy="750" r="150" className="stroke-drogamais-500/10" strokeWidth="1" fill="none" />
      </svg>

      {/* ── TEXTURA ── */}
      {/* Padrão de pontinhos sutis por cima de tudo para dar um ar premium */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #111827 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />
      
    </div>
  )
}