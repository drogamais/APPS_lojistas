import { useEffect, useState, useMemo } from 'react'
import api from '../services/api.js'
import {
  BarChart2, Trophy, Award, TrendingUp,
  Filter, ChevronDown, Package, X, AlertCircle,
} from 'lucide-react'

// ─── Dicionário de Temas (White Label) ────────────────────────────────────
const TEMAS = [
  { chave: 'kenvue',    corPrimaria: '#16a34a', corSecundaria: '#bbf7d0', corTexto: '#14532d' },
  { chave: 'eurofarma', corPrimaria: '#0369a1', corSecundaria: '#bae6fd', corTexto: '#0c4a6e' },
  { chave: 'sanofi',    corPrimaria: '#7c3aed', corSecundaria: '#ede9fe', corTexto: '#4c1d95' },
  { chave: 'pfizer',    corPrimaria: '#1d4ed8', corSecundaria: '#dbeafe', corTexto: '#1e3a8a' },
  { chave: 'reckitt',   corPrimaria: '#b91c1c', corSecundaria: '#fee2e2', corTexto: '#7f1d1d' },
]
const TEMA_PADRAO = { corPrimaria: '#e8001c', corSecundaria: '#fee2e2', corTexto: '#7f1d1d' }

function resolverTema(nomeCampanha) {
  if (!nomeCampanha) return TEMA_PADRAO
  const lower = nomeCampanha.toLowerCase()
  return TEMAS.find(t => lower.includes(t.chave)) ?? TEMA_PADRAO
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function formatarData(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatarPontos(valor) {
  if (valor == null) return '—'
  return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

// Extrai "YYYY-MM" de um valor de data
function extrairMes(valor) {
  if (!valor) return null
  const d = new Date(valor)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Converte "YYYY-MM" ou "YYYY-MM-DD" para label legível "Mar/2026"
function labelMes(ym) {
  if (!ym) return ym
  const [ano, mes] = ym.split('-')
  return new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    .replace('. de ', '/')
    .replace(' de ', '/')
}

// ─── Medalhas ─────────────────────────────────────────────────────────────
const MEDALHAS = [
  { cor: '#FFD700', label: '1º LUGAR', Icon: Trophy },
  { cor: '#C0C0C0', label: '2º LUGAR', Icon: Award  },
  { cor: '#CD7F32', label: '3º LUGAR', Icon: Award  },
]

// ─── Subcomponentes ────────────────────────────────────────────────────────
function SelectField({ label, value, onChange, options, placeholder = 'Todos' }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                   rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200
                   outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function ThemedThead({ cor, colunas }) {
  return (
    <thead>
      <tr style={{ backgroundColor: cor ?? '#64748b' }}>
        {colunas.map((col, i) => (
          <th
            key={i}
            className={`px-4 py-3 text-[11px] font-black text-white uppercase tracking-widest whitespace-nowrap
                        ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function EstadoVazio({ mensagem }) {
  return (
    <div className="text-center py-14 text-slate-400 text-sm font-bold select-none">
      {mensagem}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      <div className="flex gap-4">
        <div className="w-48 h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
        <div className="flex-1 h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  )
}

// ─── Página Principal ──────────────────────────────────────────────────────
export default function CampanhasPage() {
  // ── Estado principal ──
  const [campanhas,        setCampanhas]        = useState([])
  const [campanhaAtiva,    setCampanhaAtiva]    = useState(null)
  const [abaAtiva,         setAbaAtiva]         = useState('principal')
  const [rankingData,      setRankingData]      = useState({ catFiltro: null, cnpjLogado: null, ranking: [] })
  const [vendas,           setVendas]           = useState([])
  const [produtos,         setProdutos]         = useState([])
  const [loadingCampanhas, setLoadingCampanhas] = useState(true)
  const [loadingDados,     setLoadingDados]     = useState(false)
  const [error,            setError]            = useState(null)

  // ── Filtros: aba Principal ──
  const [filtroLoja,         setFiltroLoja]         = useState('')
  const [filtroColaborador,  setFiltroColaborador]  = useState('')
  const [filtroMes,          setFiltroMes]          = useState('')

  // ── Filtros: aba Vendas Detalhadas ──
  const [filtroVendasMes,         setFiltroVendasMes]         = useState('')
  const [filtroVendasData,        setFiltroVendasData]        = useState('')
  const [filtroVendasColaborador, setFiltroVendasColaborador] = useState('')
  const [filtroVendasLoja,        setFiltroVendasLoja]        = useState('')
  const [filtroVendasProduto,     setFiltroVendasProduto]     = useState('')

  // ── Tema resolvido a partir do nome da campanha ──
  const tema = useMemo(() => resolverTema(campanhaAtiva?.nome), [campanhaAtiva?.nome])
  const cor  = tema.corPrimaria

  // ── Buscar lista de campanhas ao montar ──
  useEffect(() => {
    setLoadingCampanhas(true)
    api.get('/api/campanhas')
      .then(({ data }) => {
        const lista = data.campanhas ?? []
        setCampanhas(lista)
        if (lista.length > 0) setCampanhaAtiva(lista[0])
      })
      .catch(() => setError('Erro ao carregar a lista de campanhas.'))
      .finally(() => setLoadingCampanhas(false))
  }, [])

  // ── Buscar dados ao trocar campanha (reset de todos os filtros) ──
  useEffect(() => {
    if (!campanhaAtiva) return
    setLoadingDados(true)
    setError(null)
    // Reset todos os filtros
    setFiltroLoja(''); setFiltroColaborador(''); setFiltroMes('')
    setFiltroVendasMes(''); setFiltroVendasData(''); setFiltroVendasColaborador('')
    setFiltroVendasLoja(''); setFiltroVendasProduto('')

    Promise.all([
      api.get(`/api/campanhas/${campanhaAtiva.id}/ranking`),
      api.get(`/api/campanhas/${campanhaAtiva.id}/vendas`),
      api.get(`/api/campanhas/${campanhaAtiva.id}/produtos`),
    ])
      .then(([r, v, p]) => {
        setRankingData(r.data)
        setVendas(v.data.vendas ?? [])
        setProdutos(p.data.produtos ?? [])
      })
      .catch(() => setError('Erro ao carregar os dados da campanha.'))
      .finally(() => setLoadingDados(false))
  }, [campanhaAtiva?.id])

  // ── Opções de filtros: Aba Principal ──
  const lojaOptions = useMemo(() => {
    const vals = [...new Set(rankingData.ranking.map(r => r.loja_completo).filter(Boolean))].sort()
    return vals.map(v => ({ value: v, label: v }))
  }, [rankingData.ranking])

  const colaboradorOptions = useMemo(() => {
    const vals = [...new Set(rankingData.ranking.map(r => r.nome_colaborador).filter(Boolean))].sort()
    return vals.map(v => ({ value: v, label: v }))
  }, [rankingData.ranking])

  const mesRankingOptions = useMemo(() => {
    const vals = [...new Set(rankingData.ranking.map(r => r.ano_mes_referencia).filter(Boolean))].sort()
    return vals.map(v => ({ value: v, label: labelMes(v) }))
  }, [rankingData.ranking])

  // ── Opções de filtros: Aba Vendas ──
  const vendasMesOptions = useMemo(() => {
    const vals = [...new Set(vendas.map(v => extrairMes(v.data_venda)).filter(Boolean))].sort()
    return vals.map(v => ({ value: v, label: labelMes(v) }))
  }, [vendas])

  const vendasDataOptions = useMemo(() => {
    const vals = [...new Set(vendas.map(v => formatarData(v.data_venda)).filter(s => s !== '—'))].sort()
    return vals.map(v => ({ value: v, label: v }))
  }, [vendas])

  const vendasColaboradorOptions = useMemo(() => {
    const vals = [...new Set(vendas.map(v => v.nome_colaborador).filter(Boolean))].sort()
    return vals.map(v => ({ value: v, label: v }))
  }, [vendas])

  const vendasLojaOptions = useMemo(() => {
    const vals = [...new Set(vendas.map(v => v.nome_fantasia).filter(Boolean))].sort()
    return vals.map(v => ({ value: v, label: v }))
  }, [vendas])

  const vendasProdutoOptions = useMemo(() => {
    const vals = [...new Set(vendas.map(v => v.descricao_produto_campanha).filter(Boolean))].sort()
    return vals.map(v => ({ value: v, label: v }))
  }, [vendas])

  // ── Filtragem in-memory: Ranking (top 10) ──
  const rankingFiltrado = useMemo(() => {
    return (rankingData.ranking ?? [])
      .filter(r => !filtroLoja        || r.loja_completo    === filtroLoja)
      .filter(r => !filtroColaborador || r.nome_colaborador === filtroColaborador)
      .filter(r => !filtroMes         || r.ano_mes_referencia === filtroMes)
      .slice(0, 10)
  }, [rankingData.ranking, filtroLoja, filtroColaborador, filtroMes])

  // ── Filtragem in-memory: Vendas Detalhadas (top 10) ──
  const vendasFiltradas = useMemo(() => {
    return vendas
      .filter(v => !filtroVendasMes         || extrairMes(v.data_venda) === filtroVendasMes)
      .filter(v => !filtroVendasData        || formatarData(v.data_venda) === filtroVendasData)
      .filter(v => !filtroVendasColaborador || v.nome_colaborador === filtroVendasColaborador)
      .filter(v => !filtroVendasLoja        || v.nome_fantasia === filtroVendasLoja)
      .filter(v => !filtroVendasProduto     || v.descricao_produto_campanha === filtroVendasProduto)
      .slice(0, 10)
  }, [vendas, filtroVendasMes, filtroVendasData, filtroVendasColaborador, filtroVendasLoja, filtroVendasProduto])

  const temFiltrosPrincipal = filtroLoja || filtroColaborador || filtroMes
  const temFiltrosVendas    = filtroVendasMes || filtroVendasData || filtroVendasColaborador || filtroVendasLoja || filtroVendasProduto

  function limparFiltrosPrincipal() {
    setFiltroLoja(''); setFiltroColaborador(''); setFiltroMes('')
  }
  function limparFiltrosVendas() {
    setFiltroVendasMes(''); setFiltroVendasData(''); setFiltroVendasColaborador('')
    setFiltroVendasLoja(''); setFiltroVendasProduto('')
  }

  // ── Renderização ──
  if (loadingCampanhas) return (
    <div className="max-w-7xl mx-auto pb-12 pt-2"><LoadingSkeleton /></div>
  )

  if (!loadingCampanhas && campanhas.length === 0) return (
    <div className="max-w-7xl mx-auto pb-12 flex flex-col items-center justify-center py-24 gap-4">
      <BarChart2 size={48} className="text-slate-300 dark:text-slate-700" />
      <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
        Nenhuma campanha ativa no momento.
      </p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4
                      bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800
                      shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: cor }} />
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart2 size={22} style={{ color: cor }} />
              Dashboard de Campanhas
            </h1>
            {campanhaAtiva && (
              <p className="text-xs font-bold mt-0.5" style={{ color: cor }}>
                {campanhaAtiva.nome} •{' '}
                <span className="text-slate-400 font-medium">
                  {formatarData(campanhaAtiva.data_inicio)} – {formatarData(campanhaAtiva.data_fim)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Seletor de Campanha */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
            Campanha Ativa
          </label>
          <div className="relative">
            <select
              value={campanhaAtiva?.id ?? ''}
              onChange={e => {
                const found = campanhas.find(c => c.id === Number(e.target.value))
                if (found) { setCampanhaAtiva(found); setAbaAtiva('principal') }
              }}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                         text-slate-800 dark:text-white font-bold text-sm rounded-xl px-4 pr-8 py-2.5
                         shadow-sm focus:outline-none cursor-pointer min-w-[200px]"
            >
              {campanhas.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <span
            className="w-3 h-3 rounded-full shrink-0 border-2 border-white dark:border-slate-800 shadow"
            style={{ backgroundColor: cor }}
          />
        </div>
      </div>

      {/* Erro de carregamento */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                        rounded-2xl text-red-700 dark:text-red-400 text-sm font-bold">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Corpo: Sidebar + Conteúdo ── */}
      <div className="flex flex-col xl:flex-row gap-4 items-start">

        {/* ── Sidebar de Filtros ── */}
        <aside className="w-full xl:w-[220px] shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800
                          shadow-card p-5 space-y-5 xl:sticky xl:top-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Filter size={13} /> Filtros
            </h2>

            {/* ─ Filtros da aba Principal ─ */}
            {abaAtiva === 'principal' && (
              <>
                <SelectField label="Loja" value={filtroLoja} onChange={setFiltroLoja} options={lojaOptions} />
                <SelectField label="Colaborador" value={filtroColaborador} onChange={setFiltroColaborador} options={colaboradorOptions} />
                <SelectField label="Mês" value={filtroMes} onChange={setFiltroMes} options={mesRankingOptions} />

                {temFiltrosPrincipal && (
                  <button
                    onClick={limparFiltrosPrincipal}
                    className="w-full py-2 text-[11px] font-black uppercase text-slate-400
                               hover:text-red-500 dark:hover:text-red-400 transition-colors
                               flex items-center justify-center gap-1.5"
                  >
                    <X size={12} /> Limpar filtros
                  </button>
                )}

                {/* CAT da loja logada */}
                {rankingData.catFiltro && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Categoria (CAT)</p>
                    <p
                      className="text-xs font-black px-2 py-1 rounded-lg inline-block"
                      style={{ backgroundColor: tema.corSecundaria, color: tema.corTexto }}
                    >
                      {rankingData.catFiltro}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Apenas lojas desta categoria são exibidas no ranking.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ─ Filtros da aba Vendas Detalhadas ─ */}
            {abaAtiva === 'vendas' && (
              <>
                <SelectField label="Mês" value={filtroVendasMes} onChange={setFiltroVendasMes} options={vendasMesOptions} />
                <SelectField label="Data" value={filtroVendasData} onChange={setFiltroVendasData} options={vendasDataOptions} />
                <SelectField label="Colaborador" value={filtroVendasColaborador} onChange={setFiltroVendasColaborador} options={vendasColaboradorOptions} />
                <SelectField label="Loja" value={filtroVendasLoja} onChange={setFiltroVendasLoja} options={vendasLojaOptions} />
                <SelectField label="Produto" value={filtroVendasProduto} onChange={setFiltroVendasProduto} options={vendasProdutoOptions} />

                {temFiltrosVendas && (
                  <button
                    onClick={limparFiltrosVendas}
                    className="w-full py-2 text-[11px] font-black uppercase text-slate-400
                               hover:text-red-500 dark:hover:text-red-400 transition-colors
                               flex items-center justify-center gap-1.5"
                  >
                    <X size={12} /> Limpar filtros
                  </button>
                )}
              </>
            )}

            {/* ─ Aba Produtos: sem filtros ─ */}
            {abaAtiva === 'produtos' && (
              <p className="text-[11px] text-slate-400 text-center py-2">
                Nenhum filtro disponível.
              </p>
            )}
          </div>
        </aside>

        {/* ── Área Principal ── */}
        <div className="flex-1 min-w-0">

          {/* ── Tab Bar ── */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5
                          bg-white dark:bg-slate-900 rounded-t-2xl overflow-hidden">
            {[
              { id: 'principal', label: 'Principal',          Icon: Trophy     },
              { id: 'vendas',    label: 'Vendas Detalhadas',   Icon: TrendingUp },
              { id: 'produtos',  label: 'Produtos Pontuáveis', Icon: Package    },
            ].map(tab => {
              const isActive = abaAtiva === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  style={{ color: isActive ? cor : undefined }}
                  className={`relative flex items-center gap-2 px-4 py-3.5 text-[13px] font-bold
                              transition-colors select-none
                              ${isActive
                                ? ''
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <tab.Icon size={15} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t"
                      style={{ backgroundColor: cor }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Conteúdo das Abas ── */}
          {loadingDados ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div
                className="w-8 h-8 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-transparent animate-spin"
                style={{ borderTopColor: cor }}
              />
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                Carregando dados...
              </p>
            </div>
          ) : (
            <>
              {/* ─── ABA: Principal (Ranking Top 10) ─── */}
              {abaAtiva === 'principal' && (
                <div className="space-y-4">
                  {/* Podium top 3 */}
                  {rankingFiltrado.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {rankingFiltrado.slice(0, 3).map((entry, i) => {
                        const medalha = MEDALHAS[i]
                        if (!medalha) return null
                        return (
                          <div
                            key={i}
                            style={{
                              borderTopColor: medalha.cor,
                              outline: entry.e_minha_loja ? `2px solid ${cor}` : 'none',
                              outlineOffset: '2px',
                            }}
                            className="border-t-4 bg-white dark:bg-slate-900 rounded-2xl p-5
                                       border border-slate-200 dark:border-slate-800 shadow-card"
                          >
                            <div className="flex items-start justify-between">
                              <medalha.Icon size={22} style={{ color: medalha.cor }} />
                              <span className="text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: medalha.cor }}>
                                {medalha.label}
                              </span>
                            </div>
                            <p className="text-[22px] font-black text-slate-800 dark:text-white mt-3 tabular-nums">
                              {formatarPontos(entry.total_pontos)}
                              <span className="text-xs font-semibold text-slate-400 ml-1">pts</span>
                            </p>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate mt-1">
                              {entry.nome_colaborador || '—'}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[130px]">
                                {entry.nome_fantasia || entry.cnpj_loja || '—'}
                              </span>
                              {entry.e_minha_loja && (
                                <span
                                  style={{ backgroundColor: cor }}
                                  className="text-[9px] font-black text-white px-2 py-0.5 rounded-full shrink-0"
                                >
                                  SUA LOJA
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Tabela posições 4–10 */}
                  {rankingFiltrado.length === 0 ? (
                    <EstadoVazio mensagem="Nenhum resultado encontrado para os filtros aplicados." />
                  ) : rankingFiltrado.length <= 3 ? null : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
                      <table className="w-full text-sm">
                        <ThemedThead cor={cor} colunas={[
                          { label: 'Pos.',        align: 'center' },
                          { label: 'Colaborador', align: 'left'   },
                          { label: 'Loja',        align: 'left'   },
                          { label: 'Pontos',      align: 'right'  },
                          { label: 'Período',     align: 'center' },
                        ]} />
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {rankingFiltrado.slice(3).map((entry, i) => (
                            <tr
                              key={i}
                              className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30
                                          ${entry.e_minha_loja ? 'bg-slate-50 dark:bg-slate-800/20' : ''}`}
                            >
                              <td className="px-4 py-3 text-center tabular-nums font-black text-slate-500 w-12">
                                {entry.posicao}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                                {entry.nome_colaborador || '—'}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                                <span title={entry.loja_completo ?? entry.nome_fantasia ?? entry.cnpj_loja}>
                                  {entry.nome_fantasia || entry.cnpj_loja || '—'}
                                </span>
                                {entry.e_minha_loja && (
                                  <span
                                    style={{ backgroundColor: cor }}
                                    className="ml-2 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full"
                                  >
                                    SUA LOJA
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-black tabular-nums text-slate-800 dark:text-slate-100">
                                {formatarPontos(entry.total_pontos)}
                                <span className="text-[10px] font-normal text-slate-400 ml-1">pts</span>
                              </td>
                              <td className="px-4 py-3 text-center text-xs text-slate-400">
                                {entry.ano_mes_referencia ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ─── ABA: Vendas Detalhadas ─── */}
              {abaAtiva === 'vendas' && (
                vendasFiltradas.length === 0 ? (
                  <EstadoVazio mensagem="Nenhuma venda encontrada para os filtros aplicados." />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
                    <table className="w-full text-sm">
                      <ThemedThead cor={cor} colunas={[
                        { label: 'Data',         align: 'left'   },
                        { label: 'Colaborador',  align: 'left'   },
                        { label: 'Loja',         align: 'left'   },
                        { label: 'Produto',      align: 'left'   },
                        { label: 'Qtd.',         align: 'right'  },
                        { label: 'Pontos',       align: 'right'  },
                      ]} />
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {vendasFiltradas.map((v, i) => (
                          <tr key={i} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                              {formatarData(v.data_venda)}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                              {v.nome_colaborador || '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                              {v.nome_fantasia || '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-[220px] truncate">
                              {v.descricao_produto_campanha || '—'}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {v.qtd_de_produtos ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800 dark:text-slate-100">
                              {formatarPontos(v.pontos_campanha)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* ─── ABA: Produtos Pontuáveis ─── */}
              {abaAtiva === 'produtos' && (
                produtos.length === 0 ? (
                  <EstadoVazio mensagem="Nenhum produto cadastrado nesta campanha." />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
                    <table className="w-full text-sm">
                      <ThemedThead cor={cor} colunas={[
                        { label: 'Cód. Barras',    align: 'left'   },
                        { label: 'Descrição',      align: 'left'   },
                        { label: 'Pontuação',      align: 'right'  },
                        { label: 'Preço Normal',   align: 'right'  },
                        { label: 'Preço c/ Desc.', align: 'right'  },
                        { label: 'Rebaixe',        align: 'right'  },
                        { label: 'Qtd. Limite',    align: 'right'  },
                      ]} />
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {produtos.map((p, i) => (
                          <tr key={i} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">
                              {p.codigo_barras_normalizado || p.codigo_barras || '—'}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100 max-w-[240px] truncate">
                              {p.descricao || '—'}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-black text-slate-800 dark:text-slate-100">
                              <span
                                className="px-2 py-0.5 rounded-full text-[11px]"
                                style={{ backgroundColor: tema.corSecundaria, color: tema.corTexto }}
                              >
                                {formatarPontos(p.pontuacao)} pts
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {p.preco_normal != null ? Number(p.preco_normal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-bold whitespace-nowrap">
                              {p.preco_desconto != null ? Number(p.preco_desconto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {p.rebaixe != null ? Number(p.rebaixe).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {p.qtd_limite ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
