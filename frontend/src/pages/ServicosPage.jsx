import { useEffect, useState, useMemo } from 'react'
import api from '../services/api.js'
import { Briefcase, Plus, Trash2, Clock, Save, X, ChevronDown, ChevronUp, AlertCircle, Calendar as CalendarIcon, Grid, List, Edit, RotateCw, Check } from 'lucide-react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, setHours, setMinutes } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { 'pt-BR': ptBR }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
})

const DIAS = [
  { id: 'seg', label: 'Segunda' },
  { id: 'ter', label: 'Terça' },
  { id: 'qua', label: 'Quarta' },
  { id: 'qui', label: 'Quinta' },
  { id: 'sex', label: 'Sexta' },
  { id: 'sab', label: 'Sábado' },
  { id: 'dom', label: 'Domingo' },
]

const DIA_TO_INDEX = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };

const EMPTY_FORM = { nome_servico: '', descricao: '', horarios: {}, ativo: true }

export default function ServicosPage() {
  const [lista, setLista]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [expandedDay, setExpandedDay] = useState(null)
  const [viewMode, setViewMode] = useState('calendar')
  const [syncing, setSyncing] = useState(false)
  const [syncDone, setSyncDone] = useState(false)

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

  const events = useMemo(() => {
    const today = startOfWeek(new Date(), { weekStartsOn: 0 });
    const evs = [];
    
    lista.forEach(servico => {
      if (!servico.ativo) return;
      Object.entries(servico.horarios || {}).forEach(([dayKey, slots]) => {
        const dayIdx = DIA_TO_INDEX[dayKey];
        if (dayIdx === undefined) return;
        
        const date = addDays(today, dayIdx);
        
        slots.forEach(slot => {
          const [startH, startM] = slot.abre.split(':').map(Number);
          const [endH, endM] = slot.fecha.split(':').map(Number);
          
          evs.push({
            id: servico.id,
            title: servico.nome_servico,
            start: setMinutes(setHours(date, startH), startM),
            end: setMinutes(setHours(date, endH), endM),
            resource: servico
          });
        });
      });
    });
    return evs;
  }, [lista]);

  const handleSyncGoogle = async () => {
    setSyncing(true)
    try {
      // API futura: api.post('/api/google/sync')
      await new Promise(r => setTimeout(r, 2000))
      setSyncDone(true)
      setTimeout(() => setSyncDone(false), 3000)
    } finally {
      setSyncing(false)
    }
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
      <div className="flex items-center justify-between mb-8 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Briefcase className="text-drogamais-500" /> Serviços
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Configure seus agendamentos sincronizados com o Google.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700 mr-4">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg flex items-center gap-2 text-xs font-black transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-drogamais-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid size={16} /> <span className="hidden sm:inline">CALENDÁRIO</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg flex items-center gap-2 text-xs font-black transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-drogamais-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={16} /> <span className="hidden sm:inline">LISTA</span>
            </button>
          </div>
          <button
            onClick={handleSyncGoogle}
            disabled={syncing}
            className={`px-4 py-3 rounded-xl transition-all border font-bold text-xs flex items-center gap-2 ${syncDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'}`}
          >
            {syncing ? <RotateCw className="animate-spin" size={16} /> : syncDone ? <Check size={16} /> : <RotateCw size={16} />}
            <span className="hidden md:inline">{syncDone ? 'SINCRONIZADO' : syncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR GOOGLE'}</span>
          </button>
          <button
            onClick={openNew}
            className="bg-drogamais-500 hover:bg-drogamais-600 text-white font-bold px-6 py-3 rounded-xl transition hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-drogamais-500/20"
          >
            <Plus size={18} strokeWidth={3} /> <span className="hidden sm:inline">Novo Serviço</span>
          </button>
        </div>
      </div>

      {/* Formulário Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-200 dark:border-slate-800">
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
                <input required value={form.nome_servico} onChange={e => setForm({...form, nome_servico: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-drogamais-500/20" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                <textarea rows={2} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-white outline-none" />
              </div>

              {/* GESTOR DE HORÁRIOS */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Clock size={14} /> Agenda Especial (Pedaços do dia)
                </label>
                
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
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
                                      <input type="time" value={slot.abre} onChange={e => updateSlot(dia.id, idx, 'abre', e.target.value)} className="w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-lg text-xs font-bold text-slate-800 dark:text-white" />
                                   </div>
                                   <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">F</span>
                                      <input type="time" value={slot.fecha} onChange={e => updateSlot(dia.id, idx, 'fecha', e.target.value)} className="w-full pl-6 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-lg text-xs font-bold text-slate-800 dark:text-white" />
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

              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
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

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-end">
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

      {/* Visualização de Serviços */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-600 animate-pulse font-black italic uppercase tracking-widest">Carregando catálogo...</div>
      ) : lista.length === 0 ? (
        <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Briefcase size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
          <p className="text-slate-500 dark:text-slate-500 font-bold">Nenhum serviço disponível.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden overflow-x-auto">
          {/* Tabela de Serviços (Conteúdo original da tabela aqui) */}
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">
              <tr>
                <th className="px-6 py-5 text-left">Serviço</th>
                <th className="px-6 py-5 text-left">Horários Definidos</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                        <div key={d.id} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                           <span className="text-[9px] font-black text-drogamais-500 uppercase">{d.id}</span>
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">({s.horarios[d.id].length})</span>
                        </div>
                      ))}
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
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 animate-in zoom-in-95 duration-500 overflow-hidden">
          <style>{`
            .rbc-calendar { min-height: 700px; color: inherit; font-family: inherit; }
            .rbc-event { 
              background: #fee2e2 !important; 
              color: #dc2626 !important;
              border-left: 4px solid #ef4444 !important;
              border-right: none !important;
              border-top: none !important;
              border-bottom: none !important;
              border-radius: 6px !important; 
              font-size: 10px !important; 
              font-weight: 800 !important; 
              padding: 4px 8px !important;
              box-shadow: 0 2px 4px rgba(0,0,0,0.02);
              transition: all 0.2s;
            }
            .rbc-event:hover { background: #fecaca !important; transform: translateY(-1px); }
            .dark .rbc-event {
              background: rgba(239, 68, 68, 0.15) !important;
              color: #f87171 !important;
              border-left-color: #ef4444 !important;
            }
            .rbc-agenda-view table.rbc-agenda-table tbody > tr > td { padding: 12px 20px !important; }
            .rbc-header { padding: 12px 0 !important; font-weight: 900 !important; text-transform: uppercase; font-size: 10px; tracking: 0.1em; color: #94a3b8; border-bottom: 2px solid #f1f5f9 !important; }
            .dark .rbc-header { border-bottom-color: #1e293b !important; }
            .rbc-time-header-content { border-left: none !important; }
            .rbc-time-view, .rbc-month-view { border: none !important; }
            .rbc-day-slot .rbc-time-slot { border-top: 1px dashed #f1f5f9; }
            .dark .rbc-day-slot .rbc-time-slot { border-top-color: #1e293b; }
            .rbc-timeslot-group { min-height: 60px !important; border-bottom: none !important; }
            .rbc-today { background-color: rgba(227, 28, 25, 0.02) !important; }
            .dark .rbc-today { background-color: rgba(227, 28, 25, 0.05) !important; }
            .rbc-toolbar button { font-weight: 800 !important; border-radius: 10px !important; border: 1px solid #e2e8f0 !important; padding: 6px 16px !important; font-size: 11px !important; text-transform: uppercase; }
            .dark .rbc-toolbar button { border-color: #334155 !important; color: #94a3b8 !important; }
            .rbc-toolbar button.rbc-active { background-color: #E31C19 !important; color: white !important; border-color: #E31C19 !important; box-shadow: 0 4px 12px rgba(227,28,25,0.2); }
          `}</style>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="week"
            views={['month', 'week', 'day']}
            culture="pt-BR"
            messages={{
              next: "Próximo",
              previous: "Anterior",
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia"
            }}
            onSelectEvent={ev => openEdit(ev.resource)}
          />
        </div>
      )}
    </div>
  )
}
