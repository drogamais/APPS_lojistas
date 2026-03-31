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
   CARROSSEL DE AVISOS
═══════════════════════════════════════════════════════ */
function AvisosCarousel({ avisos }) {
  const [current, setCurrent] = useState(0)
  const total = avisos.length

  const prev = () => setCurrent(i => (i - 1 + total) % total)
  const next = () => setCurrent(i => (i + 1) % total)

  if (total === 0) {
    return (
      <p className="text-sm text-slate-400 italic">Nenhum aviso no momento.</p>
    )
  }

  const aviso = avisos[current]

  return (
    <div className="relative bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden">
      <div className="p-6 min-h-[160px] flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-[15px] font-bold text-slate-800 leading-snug">
              {aviso.titulo}
            </h3>
            <span className="shrink-0 text-[11px] font-medium text-slate-400 bg-slate-100
                             px-2 py-0.5 rounded-full whitespace-nowrap">
              {new Date(aviso.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
            {aviso.descricao_ou_imagem}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Drogamais Central
          </span>
          {total > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">{current + 1}/{total}</span>
              <button
                onClick={prev}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-drogamais-50
                           hover:text-drogamais-500 transition text-slate-500"
              >
                <LucideIcons.ChevronLeft size={14} />
              </button>
              <button
                onClick={next}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-drogamais-50
                           hover:text-drogamais-500 transition text-slate-500"
              >
                <LucideIcons.ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {total > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {avisos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300
                ${i === current ? 'bg-drogamais-500 w-5' : 'bg-slate-200 w-1.5'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CARROSSEL DE PROMOÇÕES
═══════════════════════════════════════════════════════ */
function PromocoesCarousel({ promocoes }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)
  const total = promocoes.length

  const next = useCallback(() => setCurrent(i => (i + 1) % total), [total])
  const prev = () => {
    clearTimeout(timerRef.current)
    setCurrent(i => (i - 1 + total) % total)
  }

  useEffect(() => {
    if (total <= 1) return
    timerRef.current = setTimeout(next, 5500)
    return () => clearTimeout(timerRef.current)
  }, [current, next, total])

  if (total === 0) return null

  // Para apenas 1 imagem, exibe normal mantendo centralizado
  if (total === 1) {
    const promo = promocoes[0]
    const Tag = promo.url_destino ? 'a' : 'div'
    const tagProps = promo.url_destino ? { href: promo.url_destino, target: '_blank', rel: 'noopener noreferrer' } : {}

    return (
      <div className="max-w-[480px] mx-auto">
        <div className="relative rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.10)] select-none">
          <Tag {...tagProps} className="block relative w-full">
            <img
              src={promo.imagem_url.startsWith('/') ? `${api.defaults.baseURL}${promo.imagem_url}` : promo.imagem_url}
              alt={promo.titulo}
              className="w-full h-auto block"
              draggable="false"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/70 to-transparent flex items-end px-6 pb-5">
              <span className="text-white font-bold text-xl drop-shadow-lg leading-snug">{promo.titulo}</span>
            </div>
          </Tag>
        </div>
      </div>
    )
  }

  // Coverflow Interativo Dinâmico
  return (
    <div className="relative w-full py-2 pb-10 flex flex-col items-center overflow-x-hidden">
      
      {/* Container das Imagens */}
      <div className="relative w-full max-w-5xl flex items-center justify-center 
                      h-[85vw] max-h-[280px] sm:max-h-[400px] md:max-h-[480px]">
        {promocoes.map((promo, index) => {
          let position = 'hidden'
          if (index === current) position = 'center'
          else if (index === (current + 1) % total || (total === 2 && index !== current)) {
            position = 'right'
          } else if (index === (current - 1 + total) % total) {
            position = 'left'
          }

          let wrapperClasses = 'absolute inset-0 m-auto h-fit w-[85vw] max-w-[280px] sm:max-w-[400px] md:max-w-[480px] ' +
                               'rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] ' +
                               'transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] select-none '

          let actionHandler = undefined
          
          if (position === 'center') {
            wrapperClasses += 'z-30 opacity-100 scale-100 translate-x-0 blur-0 '
            wrapperClasses += promo.url_destino ? 'cursor-pointer' : 'cursor-default'
            actionHandler = () => {
              if (promo.url_destino) window.open(promo.url_destino, '_blank')
            }
          } else if (position === 'right') {
            wrapperClasses += 'z-20 opacity-40 scale-[0.80] translate-x-[55%] sm:translate-x-[65%] blur-[3px] cursor-pointer hover:opacity-60 hover:blur-[2px] '
            actionHandler = () => { clearTimeout(timerRef.current); next() }
          } else if (position === 'left') {
            wrapperClasses += 'z-20 opacity-40 scale-[0.80] -translate-x-[55%] sm:-translate-x-[65%] blur-[3px] cursor-pointer hover:opacity-60 hover:blur-[2px] '
            actionHandler = () => { clearTimeout(timerRef.current); prev() }
          } else {
            wrapperClasses += 'z-10 opacity-0 scale-50 translate-x-0 blur-md pointer-events-none '
          }

          return (
            <div key={promo.id || index} onClick={actionHandler} className={wrapperClasses}>
              <div className="relative w-full bg-slate-100">
                <img
                  src={promo.imagem_url.startsWith('/') ? `${api.defaults.baseURL}${promo.imagem_url}` : promo.imagem_url}
                  alt={promo.titulo}
                  className="w-full h-auto block"
                  draggable="false"
                />
                
                {/* Gradiente da Base + Título (Esconde nas laterais) */}
                <div className={`absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent flex items-end px-5 md:px-8 pb-5 md:pb-6 transition-opacity duration-500 ${position === 'center' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <span className="text-white font-bold text-lg md:text-xl drop-shadow-lg leading-snug">
                    {promo.titulo}
                  </span>
                </div>

                {/* Overlay Escuro Lateral (Apenas para dar profundidade quando não estiver em foco) */}
                <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/60 transition-opacity duration-500 pointer-events-none ${position !== 'center' ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Setas e Bolinhas Centrais */}
      <div className="flex items-center gap-5 mt-6 z-40">
        <button
          onClick={prev}
          className="p-1.5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-100 hover:bg-drogamais-50 text-slate-500 hover:text-drogamais-500 transition focus:outline-none focus:ring-2 focus:ring-drogamais-500/20"
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
          className="p-1.5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-100 hover:bg-drogamais-50 text-slate-500 hover:text-drogamais-500 transition focus:outline-none focus:ring-2 focus:ring-drogamais-500/20"
        >
          <LucideIcons.ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CARDS DE ACESSO RÁPIDO (grid estático)
═══════════════════════════════════════════════════════ */
function QuickAccessCards({ links, carouselRef, scrollLeft, scrollRight }) {
  return (
    <div className="relative">
      {/* Setas de scroll (aparecem só se hover na área) */}
      <div className="flex gap-2 absolute -top-10 right-0">
        <button
          onClick={scrollLeft}
          className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-500
                     hover:border-drogamais-200 hover:text-drogamais-500 transition shadow-sm"
        >
          <LucideIcons.ChevronLeft size={18} />
        </button>
        <button
          onClick={scrollRight}
          className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-500
                     hover:border-drogamais-200 hover:text-drogamais-500 transition shadow-sm"
        >
          <LucideIcons.ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 pt-0.5 px-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {links.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Nenhum link cadastrado.</p>
        ) : links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="snap-start shrink-0 w-[148px] bg-white border border-slate-100
                       rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.07)]
                       hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)]
                       hover:border-drogamais-100 hover:-translate-y-0.5
                       transition-all duration-200 group
                       flex flex-col items-center justify-center text-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-drogamais-50
                            group-hover:bg-drogamais-100 text-drogamais-500
                            flex items-center justify-center transition-colors">
              <DynamicIcon name={link.icone_nome} size={22} />
            </div>
            <span className="font-semibold text-[13px] text-slate-700
                             group-hover:text-drogamais-600 transition-colors leading-snug">
              {link.titulo}
            </span>
          </a>
        ))}
      </div>

      {/* Fade nas bordas */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-4
                      bg-gradient-to-r from-slate-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-4
                      bg-gradient-to-l from-slate-50 to-transparent" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CARDS DE AVISO (grid, sem barra vermelha no topo)
═══════════════════════════════════════════════════════ */
function AvisoCard({ aviso }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100
                    shadow-[0_2px_12px_rgba(0,0,0,0.06)]
                    hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)]
                    hover:-translate-y-0.5 transition-all duration-200
                    flex flex-col overflow-hidden">
      <div className="p-5 flex-1 flex flex-col">
        {/* Header do card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-[14.5px] font-bold text-slate-800 leading-snug flex-1">
            {aviso.titulo}
          </h3>
          <span className="shrink-0 text-[11px] font-medium text-slate-400
                           bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            {new Date(aviso.createdAt).toLocaleDateString('pt-BR')}
          </span>
        </div>

        <p className="text-[13px] text-slate-500 leading-relaxed whitespace-pre-wrap flex-1">
          {aviso.descricao_ou_imagem}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
          <LucideIcons.Building2 size={11} className="text-slate-400" />
          <span className="text-[11px] text-slate-400 font-medium">Drogamais Central</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function HomePage() {
  const [links, setLinks]         = useState([])
  const [avisos, setAvisos]       = useState([])
  const [promocoes, setPromocoes] = useState([])
  const [loading, setLoading]     = useState(true)
  const carouselRef = useRef(null)

  useEffect(() => {
    api.get('/api/home')
      .then(({ data }) => {
        setLinks(data.links || [])
        setAvisos(data.avisos || [])
        setPromocoes(data.promocoes || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const scrollLeft  = () => carouselRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  const scrollRight = () => carouselRef.current?.scrollBy({ left:  300, behavior: 'smooth' })

  /* ── Skeleton de carregamento ── */
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse pb-10">
        <div className="h-7 w-48 bg-slate-200 rounded-lg" />
        <div className="flex gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-[120px] w-[148px] bg-slate-200 rounded-2xl shrink-0" />
          ))}
        </div>
        <div className="h-7 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="h-[180px] bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-12 space-y-10">

      {/* ── Saudação do topo ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight">
            {greeting()}, Lojista! 👋
          </h1>
          <p className="text-[13px] text-slate-400 mt-0.5">
            Bem-vindo ao seu painel. Veja o que há de novo hoje.
          </p>
        </div>
      </div>

      {/* ── SEÇÃO 1: Acesso Rápido ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <LucideIcons.Zap size={17} className="text-drogamais-500" />
            <h2 className="text-[15px] font-bold text-slate-700 uppercase tracking-wider">
              Acesso Rápido
            </h2>
          </div>
        </div>
        <QuickAccessCards
          links={links}
          carouselRef={carouselRef}
          scrollLeft={scrollLeft}
          scrollRight={scrollRight}
        />
      </section>

      {/* ── SEÇÃO 2: Mural de Avisos ── */}
      {avisos.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <LucideIcons.Megaphone size={17} className="text-drogamais-500" />
            <h2 className="text-[15px] font-bold text-slate-700 uppercase tracking-wider">
              Mural de Avisos
            </h2>
            <span className="ml-1 text-[11px] font-semibold text-drogamais-500
                             bg-drogamais-50 px-2 py-0.5 rounded-full">
              {avisos.length}
            </span>
          </div>

          {/* Grid desktop / carrossel mobile */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5">
            {avisos.map(aviso => (
              <AvisoCard key={aviso.id} aviso={aviso} />
            ))}
          </div>
          <div className="md:hidden">
            <AvisosCarousel avisos={avisos} />
          </div>
        </section>
      )}

      {/* ── SEÇÃO 3: Promoções ── */}
      {promocoes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <LucideIcons.Star size={17} className="text-drogamais-500" />
            <h2 className="text-[15px] font-bold text-slate-700 uppercase tracking-wider">
              Destaques e Promoções
            </h2>
          </div>
          <PromocoesCarousel promocoes={promocoes} />
        </section>
      )}

      {/* Estado vazio geral */}
      {links.length === 0 && avisos.length === 0 && promocoes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center
                          justify-center mb-4">
            <LucideIcons.LayoutDashboard size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">Nenhum conteúdo disponível</p>
          <p className="text-sm text-slate-400 mt-1">
            O administrador ainda não configurou os itens do painel.
          </p>
        </div>
      )}

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}
