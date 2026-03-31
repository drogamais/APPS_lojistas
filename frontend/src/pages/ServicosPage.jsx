import { useEffect, useState } from 'react'
import api from '../services/api.js'
import { Briefcase, Plus, Trash2, Clock, Save, X, ChevronDown, ChevronUp, AlertCircle, Calendar } from 'lucide-react'

const DIAS = [
  { id: 'seg', label: 'Segunda' },
  { id: 'ter', label: 'Terça' },
  { id: 'qua', label: 'Quarta' },
  { id: 'qui', label: 'Quinta' },
  { id: 'sex', label: 'Sexta' },
  { id: 'sab', label: 'Sábado' },
  { id: 'dom', label: 'Domingo' },
]

const EMPTY_FORM = { nome_servico: '', descricao: '', horarios: {}, ativo: true }

export default function ServicosPage() {
  const [lista, setLista]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [expandedDay, setExpandedDay] = useState(null) // Para o acordeão de horários

  async function fetchLista() {
    setLoading(true)
    const { data } = await api.get('/api/servicos')
    setLista(data)
    setLoading(false)
  }

  useEffect(() => { fetchLista() }, [])

  function openNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(item) {
    setEditId(item.id)
    setForm({ 
      nome_servico: item.nome_servico, 
      descricao: item.descricao ?? '', 
      horarios: item.horarios || {},
      ativo: item.ativo 
    })
    setError('')
    setShowForm(true)
  }

  const addSlot = (dayId) => {
    const currentDaySlots = form.horarios[dayId] || []
    const newHorarios = {
      ...form.horarios,
      [dayId]: [...currentDaySlots, { abre: '08:00', fecha: '09:00' }]
    }
    setForm({ ...form, horarios: newHorarios })
  }

  const removeSlot = (dayId, index) => {
    const currentDaySlots = [...(form.horarios[dayId] || [])]
    currentDaySlots.splice(index, 1)
    const newHorarios = { ...form.horarios, [dayId]: currentDaySlots }
    setForm({ ...form, horarios: newHorarios })
  }

  const updateSlot = (dayId, index, field, value) => {
    const currentDaySlots = [...(form.horarios[dayId] || [])]
    currentDaySlots[index] = { ...currentDaySlots[index], [field]: value }
    const newHorarios = { ...form.horarios, [dayId]: currentDaySlots }
    setForm({ ...form, horarios: newHorarios })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/api/servicos/${editId}`, form)
      } else {
        await api.post('/api/servicos', form)
      }
      setShowForm(false)
      fetchLista()
    } catch (err) {
      const detail = err.response?.data?.error
      setError(typeof detail === 'string' ? detail : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este serviço?')) return
    await api.delete(`/api/servicos/${id}`)
    fetchLista()
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Briefcase className="text-drogamais-500" /> Serviços
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Configuração de serviços e horários fracionados de atendimento.</p>
        </div>
        <button
          onClick={openNew}
          className="bg-drogamais-500 hover:bg-drogamais-600 text-white font-bold px-6 py-3 rounded-xl transition hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-drogamais-500/20"
        >
          <Plus size={18} strokeWidth={3} /> <span className="hidden sm:inline">Novo Serviço</span>
        </button>
      </div>

      {/* Formulário Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {editId ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button 
                type="button"
                onClick={() => setShowForm(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-bold"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome do Serviço</label>
                <input required value={form.nome_servico} onChange={e => setForm({...form, nome_servico: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-drogamais-500/20" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                <textarea rows={2} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-white outline-none" />
              </div>

              {/* GESTOR DE HORÁRIOS */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Clock size={14} /> Agenda Especial (Pedaços do dia)
                </label>
                
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
                  {DIAS.map((dia) => {
                    const slots = form.horarios[dia.id] || []
                    const isOpen = expandedDay === dia.id

                    return (
                      <div key={dia.id} className="bg-white dark:bg-slate-900/50">
                        <button 
                          type="button"
                          onClick={() => setExpandedDay(isOpen ? null : dia.id)}
                          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full ${slots.length > 0 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></span>
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{dia.label}</span>
                            {slots.length > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black">{slots.length} SLOT(S)</span>}
                          </div>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isOpen && (
                          <div className="p-5 bg-slate-50/50 dark:bg-slate-950/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            {slots.map((slot, idx) => (
                              <div key={idx} className="flex items-center gap-3 animate-in zoom-in-95 duration-150">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                   <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">A</span>
                                      <input type="time" value={slot.abre} onChange={e => updateSlot(dia.id, idx, 'abre', e.target.value)} className="w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white" />
                                   </div>
                                   <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">F</span>
                                      <input type="time" value={slot.fecha} onChange={e => updateSlot(dia.id, idx, 'fecha', e.target.value)} className="w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white" />
                                   </div>
                                </div>
                                <button type="button" onClick={() => removeSlot(dia.id, idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                              </div>
                            ))}
                            <button 
                              type="button" 
                              onClick={() => addSlot(dia.id)}
                              className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black text-slate-400 hover:text-drogamais-500 hover:border-drogamais-200 dark:hover:border-drogamais-900 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus size={14} /> ADICIONAR INTERVALO
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <input
                  id="ativo-s"
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-5 h-5 rounded accent-drogamais-500"
                />
                <label htmlFor="ativo-s" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Serviço Ativo e Disponível</label>
              </div>
            </div>

            {error && <p className="mt-6 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-3 border border-red-100 dark:border-red-900/50 font-bold flex items-center gap-2"><AlertCircle size={16}/> {error}</p>}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-drogamais-500 hover:bg-drogamais-600 text-white font-black px-10 py-3 rounded-xl transition shadow-xl shadow-drogamais-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? 'SALVANDO...' : <><Save size={18} /> SALVAR SERVIÇO</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela de Serviços */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-600 animate-pulse font-black italic uppercase tracking-widest">Carregando catálogo...</div>
      ) : lista.length === 0 ? (
        <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
          <Briefcase size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
          <p className="text-slate-500 dark:text-slate-500 font-bold">Nenhum serviço disponível.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">
              <tr>
                <th className="px-6 py-5 text-left">Serviço</th>
                <th className="px-6 py-5 text-left">Horários Definidos</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {lista.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{s.nome_servico}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs truncate mt-0.5">{s.descricao || 'Sem descrição'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      {DIAS.map(d => (s.horarios?.[d.id]?.length > 0) && (
                        <div key={d.id} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                           <span className="text-[9px] font-black text-drogamais-500 uppercase">{d.id}</span>
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">({s.horarios[d.id].length})</span>
                        </div>
                      ))}
                      {!Object.values(s.horarios || {}).some(v => v.length > 0) && <span className="text-xs italic text-slate-300">Horário livre</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      s.ativo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {s.ativo ? 'Ativo' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)} className="p-2 text-slate-400 hover:text-drogamais-500 hover:bg-drogamais-50 dark:hover:bg-drogamais-500/10 rounded-lg transition-all"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
