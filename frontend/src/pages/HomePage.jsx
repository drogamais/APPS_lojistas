// src/pages/HomePage.jsx
import { useEffect, useState, useRef, useCallback } from 'react'
import api from '../services/api.js'
import * as LucideIcons from 'lucide-react'

/* ─── Ícone dinâmico Lucide ─── */
const DynamicIcon = ({ name, size = 22, className = '' }) => {
  const Icon = LucideIcons[name]
  if (!Icon) return <LucideIcons.HelpCircle size={size} className={className} />
  return <Icon size={size} className={className} />
}

/* ─── Saudação por horário ─── */
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

/* ═══════════════════════════════════════════════════════
   MURAL DE AVISOS (Carrossel Animado - 3 por slide)
═══════════════════════════════════════════════════════ */
function AvisosCarousel({ avisos }) {
  const [manualOffset, setManualOffset] = useState(0)
  const marqueeRef = useRef(null)

  if (avisos.length === 0) {
    return <p className="text-sm text-slate-400 italic">Nenhum aviso no momento.</p>
  }

  // Duplicamos a lista para criar o loop invisível (Esteira Infinita)
  const marqueeItems = [...avisos, ...avisos, ...avisos]

  const jumpDist = 360 // Distância do "pulinho" (largura aproximada de um card + gap)

  const handlePrev = () => setManualOffset(prev => prev + jumpDist)
  const handleNext = () => setManualOffset(prev => prev - jumpDist)

  return (
    <div className="relative group w-full overflow-hidden py-4">
      
      {/* ── Efeito Névoa (Overlays Laterais) ── */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-20 pointer-events-none" />

      {/* ── Setas de Pulinhos ── */}
      <button
        onClick={handlePrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-lg 
                   opacity-0 group-hover:opacity-100 transition-all hover:text-drogamais-500 hover:scale-110 active:scale-95"
      >
        <LucideIcons.ChevronLeft size={22} />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-lg 
                   opacity-0 group-hover:opacity-100 transition-all hover:text-drogamais-500 hover:scale-110 active:scale-95"
      >
        <LucideIcons.ChevronRight size={22} />
      </button>

      {/* ── Esteira Contínua ── */}
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
        .animate-marquee-continuo {
          animation: marqueeScroll 45s linear infinite;
        }
        .group:hover .animate-marquee-continuo {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex">
        {/* Container que recebe os 'pulinhos' manuais */}
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${manualOffset}px)` }}
        >
          {/* Container da Animação de Esteira */}
          <div className="flex gap-6 animate-marquee-continuo pr-6">
            {marqueeItems.map((aviso, idx) => (
              <div
                key={`${aviso.id}-${idx}`}
                className="w-[340px] shrink-0 relative bg-gradient-to-b from-white dark:from-slate-900 to-slate-50/50 dark:to-slate-900/50 rounded-[18px] p-6
                           flex flex-col justify-between border border-slate-200 dark:border-slate-800 shadow-section
                           hover:shadow-[0_12px_24px_rgba(0,0,0,1)] hover:border-drogamais-200 hover:-translate-y-1 
                           transition-all duration-300 min-h-[150px] overflow-hidden group/card cursor-default"
              >
                {/* Faixa de Destaque no Topo */}
                <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-drogamais-400 via-drogamais-500 to-sky-400 opacity-80 group-hover/card:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-drogamais-50 dark:bg-drogamais-500/10 flex items-center justify-center shrink-0 border border-drogamais-100 dark:border-drogamais-500/20 group-hover/card:bg-drogamais-100 dark:group-hover/card:bg-drogamais-500/30 transition-colors">
                        <LucideIcons.Bell size={14} className="text-drogamais-600 dark:text-drogamais-400" />
                      </div>
                      <h3 className="text-[14.5px] font-[800] text-slate-800 dark:text-slate-100 leading-tight">
                        {aviso.titulo}
                      </h3>
                    </div>
                    <span className="shrink-0 text-[10.5px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full">
                      {new Date(aviso.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-3 whitespace-pre-wrap pl-1">
                    {aviso.descricao_ou_imagem}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CARROSSEL DE PROMOÇÕES
═══════════════════════════════════════════════════════ */
function PromocoesCarousel({ promocoes }) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)
  const total = promocoes.length

  const next = useCallback(() => setCurrent(i => (i + 1) % total), [total])
  const prev = () => {
    clearTimeout(timerRef.current)
    setCurrent(i => (i - 1 + total) % total)
  }

  useEffect(() => {
    if (total <= 1 || isPaused) return
    timerRef.current = setTimeout(next, 5500)
    return () => clearTimeout(timerRef.current)
  }, [current, next, total, isPaused])

  if (total === 0) return null

  // Para apenas 1 imagem
  if (total === 1) {
    const promo = promocoes[0]
    const Tag = promo.url_destino ? 'a' : 'div'
    const tagProps = promo.url_destino ? { href: promo.url_destino, target: '_blank', rel: 'noopener noreferrer' } : {}

    return (
      <div className="max-w-[640px] mx-auto">
        <div className="relative rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.10)] select-none aspect-video">
          <Tag {...tagProps} className="block relative w-full h-full">
            <img
              src={promo.imagem_url.startsWith('/') ? `${api.defaults.baseURL}${promo.imagem_url}` : promo.imagem_url}
              alt="Promoção"
              className="w-full h-full object-cover block"
              draggable="false"
            />
          </Tag>
        </div>
      </div>
    )
  }

  // Coverflow Interativo Dinâmico (Reduzido para 640x360 banner format)
  return (
    <div 
      className="relative w-full pt-2 pb-5 flex flex-col items-center overflow-x-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      
      {/* Container das Imagens */}
      <div className="relative w-full max-w-5xl flex items-center justify-center 
                      h-[50vw] sm:h-[40vw] xl:h-[300px] max-h-[300px]">
        {promocoes.map((promo, index) => {
          let position = 'hidden'
          if (index === current) position = 'center'
          else if (index === (current + 1) % total || (total === 2 && index !== current)) {
            position = 'right'
          } else if (index === (current - 1 + total) % total) {
            position = 'left'
          }

          let wrapperClasses = 'absolute inset-0 m-auto h-fit w-[85vw] max-w-[480px] sm:max-w-[640px] aspect-video ' +
                               'rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-slate-100 ' +
                               'transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] select-none '

          let actionHandler = undefined
          
          if (position === 'center') {
            wrapperClasses += 'z-30 opacity-100 scale-100 translate-x-0 blur-0 '
            wrapperClasses += promo.url_destino ? 'cursor-pointer' : 'cursor-default'
            actionHandler = () => {
              if (promo.url_destino) window.open(promo.url_destino, '_blank')
            }
          } else if (position === 'right') {
            wrapperClasses += 'z-20 opacity-40 scale-[0.80] translate-x-[45%] sm:translate-x-[55%] blur-[3px] cursor-pointer hover:opacity-60 hover:blur-[2px] '
            actionHandler = () => { clearTimeout(timerRef.current); next() }
          } else if (position === 'left') {
            wrapperClasses += 'z-20 opacity-40 scale-[0.80] -translate-x-[45%] sm:-translate-x-[55%] blur-[3px] cursor-pointer hover:opacity-60 hover:blur-[2px] '
            actionHandler = () => { clearTimeout(timerRef.current); prev() }
          } else {
            wrapperClasses += 'z-10 opacity-0 scale-50 translate-x-0 blur-md pointer-events-none '
          }

          return (
            <div key={promo.id || index} onClick={actionHandler} className={wrapperClasses}>
              <div className="relative w-full h-full bg-slate-100">
                <img
                  src={promo.imagem_url.startsWith('/') ? `${api.defaults.baseURL}${promo.imagem_url}` : promo.imagem_url}
                  alt="Promoção"
                  className="w-full h-full object-cover block"
                  draggable="false"
                />
                
                {/* Overlay Escuro Apenas NAS LATERAIS. O item central fica 100% puro e claro. */}
                <div className={`absolute inset-0 bg-slate-900/60 transition-opacity duration-500 pointer-events-none ${position !== 'center' ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Setas e Bolinhas Centrais */}
      <div className="flex items-center gap-5 mt-4 z-40">
        <button
          onClick={prev}
          className="p-1.5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200 hover:bg-drogamais-50 text-slate-500 hover:text-drogamais-500 transition focus:outline-none"
        >
          <LucideIcons.ChevronLeft size={18} />
        </button>
        
        <div className="flex gap-1.5">
          {promocoes.map((_, i) => (
            <button
              key={i}
              onClick={() => { clearTimeout(timerRef.current); setCurrent(i) }}
              className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none
                ${i === current ? 'bg-drogamais-500 w-6' : 'bg-slate-300 w-1.5 hover:bg-slate-400'}`}
            />
          ))}
        </div>

        <button
          onClick={() => { clearTimeout(timerRef.current); next() }}
          className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-slate-800 hover:bg-drogamais-50 dark:hover:bg-drogamais-500/10 text-slate-500 hover:text-drogamais-500 transition focus:outline-none"
        >
          <LucideIcons.ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   ACESSO RÁPIDO (Painel Lateral Bento Box - 1 Coluna c/ Expandir)
═══════════════════════════════════════════════════════ */
function QuickAccessPanel({ links }) {
  const [showAll, setShowAll] = useState(false)

  const limite = 6
  const displayLinks = showAll ? links : links.slice(0, limite)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden flex flex-col">
      <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/20 dark:bg-slate-800/20">
        <LucideIcons.Zap size={17} className="text-drogamais-500" />
        <h2 className="text-[14.5px] font-bold text-slate-800 dark:text-slate-100 tracking-wide">Acesso Rápido</h2>
      </div>

      <div className="p-4 flex-1">
        {links.length === 0 ? (
          <p className="text-[12px] text-slate-400 dark:text-slate-500 italic text-center mt-6">Nenhum atalho disponível.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {displayLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-[14px] px-3.5 py-2.5
                             hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-drogamais-100 dark:hover:border-drogamais-800 hover:bg-white dark:hover:bg-slate-800
                             transition-all duration-200 group flex items-center gap-3"
                >
                  <div className="w-9 h-9 shrink-0 rounded-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm
                                  group-hover:bg-drogamais-50 dark:group-hover:bg-drogamais-500/10 group-hover:border-drogamais-100 text-drogamais-500 
                                  flex items-center justify-center transition-all duration-300">
                    <DynamicIcon name={link.icone_nome} size={17} strokeWidth={2.2} />
                  </div>
                  <span className="font-bold text-[13px] text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight flex-1 truncate">
                    {link.titulo}
                  </span>
                  <LucideIcons.ArrowUpRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-drogamais-400 transition-colors shrink-0" />
                </a>
              ))}
            </div>

            {/* Toggle Mostrar Mais / Menos */}
            {links.length > limite && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-3 w-full py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700
                           text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex justify-center items-center gap-1.5"
              >
                {showAll ? (
                  <>Ver menos <LucideIcons.ChevronUp size={15} /></>
                ) : (
                  <>Ver mais ({links.length - limite}) <LucideIcons.ChevronDown size={15} /></>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════
   PÁGINA PRINCIPAL - BENTO BOX LAYOUT
═══════════════════════════════════════════════════════ */
export default function HomePage() {
  const [links, setLinks]         = useState([])
  const [avisos, setAvisos]       = useState([])
  const [promocoes, setPromocoes] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    api.get('/api/home')
      .then(({ data }) => {
        setLinks(data.links || [])
        setAvisos(data.avisos || [])
        setPromocoes(data.promocoes || [])
      })
      .finally(() => setLoading(false))
  }, [])

  /* ── Skeleton de carregamento ── */
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse pb-10 mt-4">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-8">
            <div className="h-[200px] w-full bg-slate-200 rounded-3xl" />
            <div className="h-[400px] w-full bg-slate-200 rounded-3xl" />
          </div>
          <div className="xl:col-span-1 h-[500px] bg-slate-200 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="pb-4 space-y-3 animate-in">

      {/* ── Saudação do topo ── */}
      <div className="flex items-center justify-between px-2">
        <h1 className="text-[22px] font-[800] text-slate-900 dark:text-white tracking-tight">
          {greeting()}, Lojista! 👋
        </h1>
      </div>

      {/* ── BENTO BOX GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-3 lg:gap-4 items-start">
        
        {/* COLUNA ESQUERDA (Principal Fluída) */}
        <div className="flex flex-col space-y-3 lg:space-y-4 min-w-0">
          
          {/* Mural de Avisos em Carrossel Minimalista */}
          {avisos.length > 0 && (
             <section className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
                <div className="p-3 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/10">
                  <div className="flex items-center gap-2">
                    <LucideIcons.Megaphone size={16} className="text-drogamais-500" />
                    <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 tracking-wide">Mural de Avisos</h2>
                  </div>
                  <span className="text-[9px] font-semibold text-drogamais-500 bg-drogamais-50 dark:bg-drogamais-500/10 px-2 py-0.5 rounded-full">
                    {avisos.length} recentes
                  </span>
                </div>
                
                <div className="p-0">
                  <AvisosCarousel avisos={avisos} />
                </div>
             </section>
          )}

          {/* Destaques e Promoções */}
          {promocoes.length > 0 && (
             <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
                <div className="pt-3 px-6 flex items-center gap-2">
                  <LucideIcons.Star size={16} className="text-drogamais-500" />
                  <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 tracking-wide">Destaques e Promoções</h2>
                </div>
                <div className="px-1 mt-0.5 pb-0">
                  <PromocoesCarousel promocoes={promocoes} />
                </div>
             </div>
          )}

          {/* Fallback Se a esquerda estiver vazia */}
          {avisos.length === 0 && promocoes.length === 0 && (
             <div className="h-64 rounded-[24px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-white shadow-sm">
                <LucideIcons.Inbox size={32} className="mb-3 opacity-50" />
                <p>Nenhuma novidade no momento</p>
             </div>
          )}
        </div>


        {/* COLUNA DIREITA (Lateral Fixa 340px) */}
        <div className="h-full w-full">
          <QuickAccessPanel links={links} />
        </div>

      </div>

    </div>
  )
}
