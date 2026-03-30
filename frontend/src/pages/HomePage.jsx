import { useEffect, useState, useRef } from 'react'
import api from '../services/api.js'
import * as LucideIcons from 'lucide-react'

// Renderizador Dinâmico de Ícones do Lucide
const DynamicIcon = ({ name, size = 24, className = "" }) => {
  const IconComponent = LucideIcons[name]
  if (!IconComponent) return <LucideIcons.HelpCircle size={size} className={className} />
  return <IconComponent size={size} className={className} />
}

export default function HomePage() {
  const [links, setLinks] = useState([])
  const [avisos, setAvisos] = useState([])
  const [loading, setLoading] = useState(true)

  const carouselRef = useRef(null)

  useEffect(() => {
    api.get('/api/home').then(({ data }) => {
      setLinks(data.links || [])
      setAvisos(data.avisos || [])
    }).finally(() => setLoading(false))
  }, [])

  const scrollLeft = () => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' })
  }

  if (loading) return <p className="text-gray-500 text-sm">A carregar Home...</p>

  return (
    <div className="pb-10 space-y-10 animate-in fade-in duration-500">
      
      {/* SEÇÃO 1: CARROSSEL DE LINKS IMPORTANTES */}
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
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Esconde barra de rolagem (Firefox/IE)
          >
            {links.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum link cadastrado.</p>
            ) : (
              links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="snap-start shrink-0 w-44 md:w-56 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-drogamais-200 transition-all group flex flex-col items-center justify-center text-center gap-3 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-drogamais-50 group-hover:bg-drogamais-100 text-drogamais-500 flex items-center justify-center transition-colors">
                    <DynamicIcon name={link.icone_nome} size={28} />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-drogamais-600 transition-colors">
                    {link.titulo}
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: AVISOS E COMUNICADOS */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <LucideIcons.Megaphone className="text-drogamais-500" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Mural de Avisos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {avisos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum aviso no momento.</p>
          ) : (
            avisos.map((aviso) => (
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
            ))
          )}
        </div>
      </section>
      
      {/* Adicionamos uma tag style oculta local para garantir que a classe scrollbar-hide funcione no Chrome */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
