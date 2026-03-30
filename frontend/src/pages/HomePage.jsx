import { useEffect, useState, useRef, useCallback } from 'react'
import api from '../services/api.js'
import * as LucideIcons from 'lucide-react'

// Ícone dinâmico do Lucide
const DynamicIcon = ({ name, size = 24, className = "" }) => {
  const IconComponent = LucideIcons[name]
  if (!IconComponent) return <LucideIcons.HelpCircle size={size} className={className} />
  return <IconComponent size={size} className={className} />
}

// ─── CARROSSEL DE AVISOS (slide único com setas) ───────────────────────────
function AvisosCarousel({ avisos }) {
  const [current, setCurrent] = useState(0)
  const total = avisos.length

  const prev = () => setCurrent(i => (i - 1 + total) % total)
  const next = () => setCurrent(i => (i + 1) % total)

  if (total === 0) return <p className="text-sm text-gray-500">Nenhum aviso no momento.</p>

  const aviso = avisos[current]

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Barra decorativa */}
      <div className="h-2 bg-drogamais-400 w-full" />

      <div className="p-6 min-h-[160px] flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight">{aviso.titulo}</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {aviso.descricao_ou_imagem}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
          <span>Drogamais Central · {new Date(aviso.createdAt).toLocaleDateString()}</span>

          {/* Controles de navegação */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400">{current + 1} / {total}</span>
            <button onClick={prev} className="p-1.5 rounded-full bg-gray-100 hover:bg-drogamais-50 hover:text-drogamais-500 transition">
              <LucideIcons.ChevronLeft size={16} />
            </button>
            <button onClick={next} className="p-1.5 rounded-full bg-gray-100 hover:bg-drogamais-50 hover:text-drogamais-500 transition">
              <LucideIcons.ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Indicadores (bolinhas) */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {avisos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-drogamais-500 w-4' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CARROSSEL DE PROMOÇÕES (banner com imagem fixa) ──────────────────────
function PromocoesCarousel({ promocoes }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)
  const total = promocoes.length

  const next = useCallback(() => setCurrent(i => (i + 1) % total), [total])
  const prev = () => {
    clearTimeout(timerRef.current)
    setCurrent(i => (i - 1 + total) % total)
  }

  // Auto-avanço
  useEffect(() => {
    if (total <= 1) return
    timerRef.current = setTimeout(next, 5000)
    return () => clearTimeout(timerRef.current)
  }, [current, next, total])

  if (total === 0) return null

  const promo = promocoes[current]

  const Tag = promo.url_destino ? 'a' : 'div'
  const tagProps = promo.url_destino
    ? { href: promo.url_destino, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-md select-none group">
      {/* Imagem fixa em proporção 3:1 */}
      <Tag {...tagProps} className="block">
        <div className="w-full" style={{ paddingBottom: '33.33%', position: 'relative' }}>
          <img
            src={promo.imagem_url.startsWith('/') ? `${api.defaults.baseURL}${promo.imagem_url}` : promo.imagem_url}
            alt={promo.titulo}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            draggable="false"
          />
          {/* Gradiente inferior com título */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-5">
            <span className="text-white font-bold text-lg drop-shadow">{promo.titulo}</span>
          </div>
        </div>
      </Tag>

      {/* Setas laterais (aparecem no hover) */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-gray-700 rounded-full shadow transition opacity-0 group-hover:opacity-100"
          >
            <LucideIcons.ChevronLeft size={20} />
          </button>
          <button
            onClick={() => { clearTimeout(timerRef.current); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-gray-700 rounded-full shadow transition opacity-0 group-hover:opacity-100"
          >
            <LucideIcons.ChevronRight size={20} />
          </button>

          {/* Bolinhas indicadoras */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {promocoes.map((_, i) => (
              <button
                key={i}
                onClick={() => { clearTimeout(timerRef.current); setCurrent(i) }}
                className={`h-2 rounded-full transition-all ${i === current ? 'bg-white w-5' : 'bg-white/50 w-2'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── PÁGINA HOME ──────────────────────────────────────────────────────────
export default function HomePage() {
  const [links, setLinks] = useState([])
  const [avisos, setAvisos] = useState([])
  const [promocoes, setPromocoes] = useState([])
  const [loading, setLoading] = useState(true)
  const carouselRef = useRef(null)

  useEffect(() => {
    api.get('/api/home').then(({ data }) => {
      setLinks(data.links || [])
      setAvisos(data.avisos || [])
      setPromocoes(data.promocoes || [])
    }).finally(() => setLoading(false))
  }, [])

  const scrollLeft = () => carouselRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  const scrollRight = () => carouselRef.current?.scrollBy({ left: 300, behavior: 'smooth' })

  if (loading) return <p className="text-gray-500 text-sm">A carregar Home...</p>

  return (
    <div className="pb-10 space-y-10 animate-in fade-in duration-500">

      {/* ── 1. ACESSO RÁPIDO (links de sistemas) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Acesso Rápido</h2>
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-drogamais-500 transition shadow-sm"
            >
              <LucideIcons.ChevronLeft size={20} />
            </button>
            <button
              onClick={scrollRight}
              className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-drogamais-500 transition shadow-sm"
            >
              <LucideIcons.ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-1 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {links.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum link cadastrado.</p>
            ) : links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="snap-start shrink-0 w-40 md:w-48 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-drogamais-200 transition-all group flex flex-col items-center justify-center text-center gap-3 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-drogamais-50 group-hover:bg-drogamais-100 text-drogamais-500 flex items-center justify-center transition-colors">
                  <DynamicIcon name={link.icone_nome} size={24} />
                </div>
                <span className="font-semibold text-sm text-gray-700 group-hover:text-drogamais-600 transition-colors leading-tight">
                  {link.titulo}
                </span>
              </a>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-gray-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-gray-50 to-transparent" />
        </div>
      </section>

      {/* ── 2. MURAL DE AVISOS (cartões estáticos) ── */}
      {avisos.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <LucideIcons.Megaphone className="text-drogamais-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Mural de Avisos</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avisos.map((aviso) => (
              <div 
                key={aviso.id} 
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="h-2 bg-drogamais-400 w-full" />
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight">{aviso.titulo}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap flex-1">
                    {aviso.descricao_ou_imagem}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
                    <span>
                      Drogamais Central
                    </span>
                    <span>
                      {new Date(aviso.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. CARROSSEL DE PROMOÇÕES (banner na base) ── */}
      {promocoes.length > 0 && (
        <section className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <LucideIcons.Star className="text-drogamais-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider">Destaques e Promoções</h2>
          </div>
          <PromocoesCarousel promocoes={promocoes} />
        </section>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}


