import { useEffect, useState, useMemo } from 'react'
import api from '../services/api.js'
import {
  BarChart2, Trophy, Award, TrendingUp, TrendingDown,
  Minus, Filter, ChevronDown, Package, X, AlertCircle,
} from 'lucide-react'

// ─── Cores das medalhas ────────────────────────────────────────────────────
const MEDALHAS = [
  { cor: '#FFD700', label: '1º LUGAR', Icon: Trophy },
  { cor: '#C0C0C0', label: '2º LUGAR', Icon: Award  },
  { cor: '#CD7F32', label: '3º LUGAR', Icon: Award  },
]

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

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
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
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
  // ── Estado ──
  const [campanhas, setCampanhas]             = useState([])
  const [campanhaAtiva, setCampanhaAtiva]     = useState(null)
  const [abaAtiva, setAbaAtiva]               = useState('principal')
  const [ranking, setRanking]                 = useState({ catFiltro: null, lojaAtualNumero: null, ranking: [] })
  const [vendas, setVendas]                   = useState([])
  const [produtos, setProdutos]               = useState([])
  const [loadingCampanhas, setLoadingCampanhas] = useState(true)
  const [loadingDados, setLoadingDados]       = useState(false)
  const [error, setError]                     = useState(null)
  const [filtroLoja, setFiltroLoja]           = useState('')
  const [filtroMes, setFiltroMes]             = useState('')
  const [filtroBalconista, setFiltroBalconista] = useState('')

  // ── Buscar lista de campanhas ao montar ──
  useEffect(() => {
    setLoadingCampanhas(true)
    api.get('/api/campanhas')
      .then(({ data }) => {
        setCampanhas(data.campanhas ?? [])
        if (data.campanhas?.length > 0) setCampanhaAtiva(data.campanhas[0])
      })
      .catch(() => setError('Erro ao carregar a lista de campanhas.'))
      .finally(() => setLoadingCampanhas(false))
  }, [])

  // ── Buscar dados ao trocar campanha ──
  useEffect(() => {
    if (!campanhaAtiva) return
    setLoadingDados(true)
    setError(null)
    setFiltroLoja('')
    setFiltroMes('')
    setFiltroBalconista('')

    Promise.all([
      api.get(`/api/campanhas/${campanhaAtiva.id}/ranking`),
      api.get(`/api/campanhas/${campanhaAtiva.id}/vendas`),
      api.get(`/api/campanhas/${campanhaAtiva.id}/produtos`),
    ])
      .then(([r, v, p]) => {
        setRanking(r.data)
        setVendas(v.data.vendas ?? [])
        setProdutos(p.data.produtos ?? [])
      })
      .catch(() => setError('Erro ao carregar os dados da campanha.'))
      .finally(() => setLoadingDados(false))
  }, [campanhaAtiva?.id])

  // ── Opções de filtros derivadas dos dados ──
  const lojaOptions = useMemo(() => {
    const rows = ranking.ranking ?? []
    return [...new Set(rows.map(r => r.loja_numero))].sort()
  }, [ranking])

  const balconistaOptions = useMemo(() => {
    return [...new Set(vendas.map(v => v.nomeFantasia))].sort()
  }, [vendas])

  const mesOptions = useMemo(() => {
    const presentes = new Set(vendas.map(v => v.mes))
    return MESES.filter(m => presentes.has(m))
  }, [vendas])

  // ── Filtragem in-memory ──
  const rankingFiltrado = useMemo(() => {
    const rows = ranking.ranking ?? []
    if (!filtroLoja) return rows
    return rows.filter(r => r.loja_numero === filtroLoja)
  }, [ranking, filtroLoja])

  const vendasFiltradas = useMemo(() => {
    return vendas.filter(v => {
      if (filtroLoja && v.lojaNumero !== filtroLoja) return false
      if (filtroMes  && v.mes       !== filtroMes)  return false
      return true
    })
  }, [vendas, filtroLoja, filtroMes])

  const produtosFiltrados = useMemo(() => {
    // TODO (mock): filtros de loja/balconista não têm dimensão em produtos
    return produtos
  }, [produtos])

  const temFiltros = filtroLoja || filtroMes || filtroBalconista
  const cor = campanhaAtiva?.corPrimaria

  // ── Renderização ──
  if (loadingCampanhas) return (
    <div className="max-w-7xl mx-auto pb-12 pt-2">
      <LoadingSkeleton />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4
                      bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800
                      shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <BarChart2 size={24} className="text-drogamais-500" />
            Dashboard de Campanhas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
            Acompanhe seu desempenho nas campanhas ativas da rede.
          </p>
        </div>

        {/* ── Seletor de Campanha ── */}
        {campanhas.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Campanha Ativa
            </label>
            <div className="relative">
              <select
                value={campanhaAtiva?.id ?? ''}
                onChange={e => {
                  const found = campanhas.find(c => c.id === Number(e.target.value))
                  if (found) setCampanhaAtiva(found)
                }}
                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                           text-slate-800 dark:text-white font-bold text-sm rounded-xl px-4 pr-8 py-2.5
                           shadow-sm focus:outline-none cursor-pointer"
              >
                {campanhas.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} — {c.periodo}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {cor && (
              <span
                className="w-3 h-3 rounded-full shrink-0 border-2 border-white dark:border-slate-800 shadow"
                style={{ backgroundColor: cor }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm font-bold">
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

            <SelectField
              label="Loja"
              value={filtroLoja}
              onChange={setFiltroLoja}
              options={lojaOptions.map(l => ({ value: l, label: l }))}
              placeholder="Todas"
            />

            <SelectField
              label="Balconista / Fantasia"
              value={filtroBalconista}
              onChange={setFiltroBalconista}
              options={balconistaOptions.map(b => ({ value: b, label: b }))}
              placeholder="Todos"
            />

            <SelectField
              label="Mês"
              value={filtroMes}
              onChange={setFiltroMes}
              options={mesOptions.map(m => ({ value: m, label: m }))}
              placeholder="Todos"
            />

            {temFiltros && (
              <button
                onClick={() => { setFiltroLoja(''); setFiltroMes(''); setFiltroBalconista('') }}
                className="w-full py-2 text-[11px] font-black uppercase text-slate-400
                           hover:text-red-500 dark:hover:text-red-400 transition-colors
                           flex items-center justify-center gap-1.5"
              >
                <X size={12} /> Limpar filtros
              </button>
            )}

            {ranking.catFiltro && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sua categoria</p>
                <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">{ranking.catFiltro}</p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Área Principal ── */}
        <div className="flex-1 min-w-0">

          {/* ── Tab Bar ── */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 bg-white dark:bg-slate-900 rounded-t-2xl overflow-hidden">
            {[
              { id: 'principal', label: 'Principal',          Icon: Trophy    },
              { id: 'vendas',    label: 'Vendas Gerais',       Icon: TrendingUp },
              { id: 'produtos',  label: 'Pontuação Produtos',  Icon: Package   },
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
                                ? 'text-slate-900 dark:text-white'
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
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-transparent animate-spin"
                   style={{ borderTopColor: cor ?? '#64748b' }} />
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                Carregando dados da campanha...
              </p>
            </div>
          ) : (
            <>
              {/* ─── ABA: Principal (Ranking) ─── */}
              {abaAtiva === 'principal' && (
                <div className="space-y-4">
                  {/* Podium top 3 */}
                  {rankingFiltrado.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {rankingFiltrado.slice(0, 3).map((entry, i) => {
                        const medalha = MEDALHAS[i]
                        if (!medalha) return null
                        const isMinha = entry.loja_numero === ranking.lojaAtualNumero
                        return (
                          <div
                            key={entry.posicao}
                            style={{
                              borderTopColor: medalha.cor,
                              outline: isMinha ? `2px solid ${cor}` : 'none',
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
                            <p className="text-[22px] font-black text-slate-800 dark:text-white mt-3">
                              {entry.pontuacao.toLocaleString('pt-BR')}
                              <span className="text-xs font-semibold text-slate-400 ml-1">pts</span>
                            </p>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate mt-1">
                              {entry.nome_fantasia}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[11px] text-slate-400">{entry.loja_numero}</span>
                              {isMinha && (
                                <span
                                  style={{ backgroundColor: cor }}
                                  className="text-[9px] font-black text-white px-2 py-0.5 rounded-full"
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

                  {/* Tabela restante */}
                  {rankingFiltrado.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm font-bold">
                      Nenhuma loja encontrada para os filtros aplicados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
                      <table className="w-full text-sm">
                        <ThemedThead cor={cor} colunas={[
                          { label: 'Pos.',      align: 'center' },
                          { label: 'Loja',      align: 'left'   },
                          { label: 'Pontuação', align: 'right'  },
                          { label: 'Var.',      align: 'center' },
                        ]} />
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {rankingFiltrado.slice(3).map(entry => {
                            const isMinha = entry.loja_numero === ranking.lojaAtualNumero
                            return (
                              <tr
                                key={entry.posicao}
                                className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30
                                            ${isMinha ? 'bg-slate-50 dark:bg-slate-800/20' : ''}`}
                              >
                                <td className="px-4 py-3 text-center tabular-nums font-black text-slate-500 w-12">
                                  {entry.posicao}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className={`font-bold text-slate-800 dark:text-slate-100 ${isMinha ? 'font-black' : ''}`}>
                                      {entry.nome_fantasia}
                                    </span>
                                    <span className="text-[11px] text-slate-400">{entry.loja_numero}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right font-black tabular-nums text-slate-800 dark:text-slate-100">
                                  {entry.pontuacao.toLocaleString('pt-BR')}
                                  <span className="text-[10px] font-normal text-slate-400 ml-1">pts</span>
                                </td>
                                <td className="px-4 py-3 text-center w-16">
                                  {entry.variacao > 0 && <TrendingUp   size={14} className="text-emerald-500 mx-auto" />}
                                  {entry.variacao < 0 && <TrendingDown  size={14} className="text-red-400 mx-auto"     />}
                                  {entry.variacao === 0 && <Minus       size={14} className="text-slate-300 mx-auto"    />}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ─── ABA: Vendas Gerais ─── */}
              {abaAtiva === 'vendas' && (
                vendasFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm font-bold">
                    Nenhuma venda encontrada para os filtros aplicados.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
                    <table className="w-full text-sm">
                      <ThemedThead cor={cor} colunas={[
                        { label: 'Mês',          align: 'left'   },
                        { label: 'Loja',         align: 'left'   },
                        { label: 'Fantasia',     align: 'left'   },
                        { label: 'Total (R$)',   align: 'right'  },
                        { label: 'Transações',   align: 'right'  },
                        { label: 'Ticket Médio', align: 'right'  },
                      ]} />
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {vendasFiltradas.map((v, i) => (
                          <tr key={i} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{v.mes}</td>
                            <td className="px-4 py-3 text-slate-500 tabular-nums">{v.lojaNumero}</td>
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{v.nomeFantasia}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                              {v.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {v.qtdTransacoes.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {v.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* ─── ABA: Pontuação Produtos ─── */}
              {abaAtiva === 'produtos' && (
                produtosFiltrados.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm font-bold">
                    Nenhum produto encontrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
                    <table className="w-full text-sm">
                      <ThemedThead cor={cor} colunas={[
                        { label: 'EAN',          align: 'left'   },
                        { label: 'Descrição',    align: 'left'   },
                        { label: 'Categoria',    align: 'left'   },
                        { label: 'Pts/Unit.',    align: 'right'  },
                        { label: 'Qtd. Vendida', align: 'right'  },
                        { label: 'Total Pontos', align: 'right'  },
                      ]} />
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {produtosFiltrados.map((p, i) => (
                          <tr key={i} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3 tabular-nums text-slate-400 font-mono text-xs">{p.ean}</td>
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{p.descricao}</td>
                            <td className="px-4 py-3">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full
                                               bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {p.categoria}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-600 dark:text-slate-300">{p.pontosUnitario}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {p.qtdVendida.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-black text-slate-800 dark:text-slate-100">
                              {p.totalPontos.toLocaleString('pt-BR')}
                              <span className="text-[10px] font-normal text-slate-400 ml-1">pts</span>
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
