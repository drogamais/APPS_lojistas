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
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 3
  
  if (avisos.length === 0) {
    return <p className="text-sm text-slate-400 italic">Nenhum aviso no momento.</p>
  }

  const totalPages = Math.ceil(avisos.length / itemsPerPage)
  
  // Agrupando os avisos em páginas
  const pages = Array.from({ length: totalPages }, (_, i) =>
    avisos.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
  )

  const prevPage = () => setCurrentPage((p) => Math.max(0, p - 1))
  const nextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))

  return (
    <div className="relative group px-10 sm:px-14 pb-1">
      {/* Setas Laterais Flutuantes (com espaço próprio) */}
      {totalPages > 1 && (
        <>
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10
                       p-2 rounded-full bg-white border border-slate-100 text-slate-500 shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                       opacity-0 group-hover:opacity-100 transition-all hover:text-drogamais-500 hover:border-drogamais-200 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none"
          >
            <LucideIcons.ChevronLeft size={20} />
          </button>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10
                       p-2 rounded-full bg-white border border-slate-100 text-slate-500 shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                       opacity-0 group-hover:opacity-100 transition-all hover:text-drogamais-500 hover:border-drogamais-200 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none"
          >
            <LucideIcons.ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Container de Animação Horizontal */}
      <div className="w-full overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] py-1"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((pageGrp, pageIndex) => (
            <div key={pageIndex} className="w-full shrink-0 flex flex-wrap sm:flex-nowrap justify-center gap-4">
              {pageGrp.map((aviso) => (
                <div
                  key={aviso.id}
                  className="w-full sm:flex-1 max-w-[340px] shrink-0 bg-slate-50 rounded-[16px] border border-slate-100 p-5 
                             flex flex-col justify-between hover:bg-white
                             hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-drogamais-100 hover:-translate-y-0.5
                             transition-all min-h-[140px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-[13.5px] font-bold text-slate-800 leading-snug truncate">
                        {aviso.titulo}
                      </h3>
                      <span className="shrink-0 text-[10px] font-bold text-slate-400 bg-white border border-slate-200
                                       px-2 py-0.5 rounded-full whitespace-nowrap">
                        {new Date(aviso.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                      {aviso.descricao_ou_imagem}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Totalizador de Páginas Sutil */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end mt-4 px-1">
          <span className="text-[12px] font-semibold text-slate-400 tracking-wide">
            Página {currentPage + 1} de {totalPages}
          </span>
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
    <div className="relative w-full py-2 pb-10 flex flex-col items-center overflow-x-hidden">
      
      {/* Container das Imagens */}
      <div className="relative w-full max-w-5xl flex items-center justify-center 
                      h-[50vw] sm:h-[40vw] xl:h-[360px] max-h-[360px]">
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
      <div className="flex items-center gap-5 mt-6 z-40">
        <button
          onClick={prev}
          className="p-1.5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-100 hover:bg-drogamais-50 text-slate-500 hover:text-drogamais-500 transition focus:outline-none"
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
          className="p-1.5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-100 hover:bg-drogamais-50 text-slate-500 hover:text-drogamais-500 transition focus:outline-none"
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
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
      <div className="p-6 pb-4 border-b border-slate-50 flex items-center gap-2 bg-slate-50/30">
        <LucideIcons.Zap size={18} className="text-drogamais-500" />
        <h2 className="text-[15px] font-bold text-slate-800 tracking-wide">Acesso Rápido</h2>
      </div>

      <div className="p-4 md:p-5 flex-1 overflow-y-auto">
        {links.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center mt-6">Nenhum atalho disponível.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {displayLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-50/60 border border-slate-100 rounded-[14px] px-4 py-3
                             hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-drogamais-100 hover:bg-white
                             transition-all duration-200 group flex items-center gap-3"
                >
                  <div className="w-10 h-10 shrink-0 rounded-[10px] bg-white border border-slate-100 shadow-sm
                                  group-hover:bg-drogamais-50 group-hover:border-drogamais-100 text-drogamais-500 
                                  flex items-center justify-center transition-all duration-300">
                    <DynamicIcon name={link.icone_nome} size={18} strokeWidth={2.2} />
                  </div>
                  <span className="font-bold text-[13.5px] text-slate-700 group-hover:text-slate-900 transition-colors leading-tight flex-1 truncate">
                    {link.titulo}
                  </span>
                  <LucideIcons.ArrowUpRight size={16} className="text-slate-300 group-hover:text-drogamais-400 transition-colors shrink-0" />
                </a>
              ))}
            </div>

            {/* Toggle Mostrar Mais / Menos */}
            {links.length > limite && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-4 w-full py-3 rounded-[12px] bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200
                           text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors flex justify-center items-center gap-1.5"
              >
                {showAll ? (
                  <>Ver menos atalhos <LucideIcons.ChevronUp size={16} /></>
                ) : (
                  <>Ver mais ({links.length - limite}) <LucideIcons.ChevronDown size={16} /></>
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
    <div className="pb-12 space-y-8 animate-in mt-4">

      {/* ── Saudação do topo ── */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-[26px] font-[800] text-slate-900 tracking-tight">
            {greeting()}, Lojista! 👋
          </h1>
          <p className="text-[14px] font-medium text-slate-500 mt-1">
            Aqui está o resumo e as ferramentas do seu dia.
          </p>
        </div>
        
        {/* Usando um avatar genérico clean para B2B */}
        <div className="w-11 h-11 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-400">
           <LucideIcons.User size={20} />
        </div>
      </div>

      {/* ── BENTO BOX GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8 items-start">
        
        {/* COLUNA ESQUERDA (Principal 3/4) */}
        <div className="xl:col-span-3 flex flex-col space-y-6 lg:space-y-8 min-w-0">
          
          {/* Mural de Avisos em Carrossel Minimalista */}
          {avisos.length > 0 && (
             <section className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <LucideIcons.Megaphone size={18} className="text-drogamais-500" />
                    <h2 className="text-[15px] font-bold text-slate-800 tracking-wide">Mural de Avisos</h2>
                  </div>
                  <span className="text-[11px] font-semibold text-drogamais-500 bg-drogamais-50 px-2.5 py-1 rounded-full">
                    {avisos.length} recentes
                  </span>
                </div>
                
                {/* Reutilizando a lógica do carrossel antigo, mas num container sem bordas */}
                <div className="p-2 sm:p-5">
                  <AvisosCarousel avisos={avisos} />
                </div>
             </section>
          )}

          {/* Destaques e Promoções */}
          {promocoes.length > 0 && (
             <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="pt-6 px-6 flex items-center gap-2">
                  <LucideIcons.Star size={18} className="text-drogamais-500" />
                  <h2 className="text-[15px] font-bold text-slate-800 tracking-wide">Destaques e Promoções</h2>
                </div>
                <div className="px-2 mt-6 pb-2">
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


        {/* COLUNA DIREITA (Lateral 1/3) */}
        <div className="xl:col-span-1 h-full">
          <QuickAccessPanel links={links} />
        </div>

      </div>

    </div>
  )
}
