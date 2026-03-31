import { useEffect, useState } from 'react'
import api from '../services/api.js'
import { Users, UserPlus, Edit, Trash2, X, Save, Calendar, User, Phone, Mail, Fingerprint } from 'lucide-react'

const EMPTY_FORM = { 
  nome: '', 
  cpf: '', 
  email: '', 
  telefone: '', 
  sexo: '', 
  idade: '', 
  data_ingresso: '', 
  data_egresso: '', 
  ativo: true 
}

export default function BalconistasPage() {
  const [lista, setLista]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editId, setEditId]       = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function fetchLista() {
    setLoading(true)
    const { data } = await api.get('/api/balconistas')
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
      nome: item.nome, 
      cpf: item.cpf ?? '', 
      email: item.email ?? '', 
      telefone: item.telefone ?? '', 
      sexo: item.sexo ?? '',
      idade: item.idade ?? '',
      data_ingresso: item.data_ingresso ? new Date(item.data_ingresso).toISOString().split('T')[0] : '',
      data_egresso: item.data_egresso ? new Date(item.data_egresso).toISOString().split('T')[0] : '',
      ativo: item.ativo 
    })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form };
      if (payload.idade === '') payload.idade = null;
      else payload.idade = Number(payload.idade);

      if (editId) {
        await api.put(`/api/balconistas/${editId}`, payload)
      } else {
        await api.post('/api/balconistas', payload)
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
    if (!confirm('Remover este balconista?')) return
    await api.delete(`/api/balconistas/${id}`)
    fetchLista()
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="text-drogamais-500" /> Balconistas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Gestão de equipe e perfis demográficos da loja.</p>
        </div>
        <button
          onClick={openNew}
          className="bg-drogamais-500 hover:bg-drogamais-600 text-white font-bold px-6 py-3 rounded-xl transition hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-drogamais-500/20"
        >
          <UserPlus size={18} strokeWidth={3} /> <span className="hidden sm:inline">Novo Balconista</span>
        </button>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {editId ? 'Editar Balconista' : 'Cadastrar Balconista'}
              </h2>
              <button 
                type="button"
                onClick={() => setShowForm(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-bold"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-drogamais-500/20" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">CPF</label>
                <input value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-drogamais-500/20" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Telefone</label>
                <input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Sexo</label>
                  <select value={form.sexo} onChange={e => setForm({...form, sexo: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none">
                    <option value="">Selecionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Idade</label>
                  <input type="number" value={form.idade} onChange={e => setForm({...form, idade: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data de Ingresso</label>
                <input type="date" value={form.data_ingresso} onChange={e => setForm({...form, data_ingresso: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data de Egresso</label>
                <input type="date" value={form.data_egresso} onChange={e => setForm({...form, data_egresso: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <input
                  id="ativo"
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-5 h-5 rounded accent-drogamais-500"
                />
                <label htmlFor="ativo" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">Colaborador Ativo na Loja</label>
              </div>
            </div>

            {error && <p className="mt-6 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-3 border border-red-100 dark:border-red-900/50 font-bold">{error}</p>}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-drogamais-500 hover:bg-drogamais-600 text-white font-black px-10 py-3 rounded-xl transition shadow-xl shadow-drogamais-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? 'PROCESSANDO...' : <><Save size={18} /> SALVAR DADOS</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-600 animate-pulse font-black italic uppercase tracking-widest">Sincronizando equipe...</div>
      ) : lista.length === 0 ? (
        <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
          <Users size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
          <p className="text-slate-500 dark:text-slate-500 font-bold">Nenhum balconista cadastrado no momento.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">
              <tr>
                <th className="px-6 py-5 text-left">Colaborador</th>
                <th className="px-6 py-5 text-left">Documentação</th>
                <th className="px-6 py-5 text-left">Perfil</th>
                <th className="px-6 py-5 text-left">Contrato</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {lista.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs uppercase group-hover:bg-drogamais-500 group-hover:text-white transition-colors">
                        {b.nome.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 dark:text-slate-100">{b.nome}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1"><Mail size={10} /> {b.email || 'sem e-mail'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><Fingerprint size={10} /> {b.cpf || '—'}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1"><Phone size={10} /> {b.telefone || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-1 rounded-md text-[10px] font-black border ${
                         b.sexo === 'M' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50' : 
                         b.sexo === 'F' ? 'bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-900/50' : 
                         'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800 dark:text-slate-500'
                       }`}>
                         {b.sexo === 'M' ? 'MASC' : b.sexo === 'F' ? 'FEM' : 'OUTRO'}
                       </span>
                       <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{b.idade ? `${b.idade} anos` : '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Calendar size={10} /> {b.data_ingresso ? new Date(b.data_ingresso).toLocaleDateString('pt-BR') : 'Sem data'}
                      </span>
                      {b.data_egresso && (
                        <span className="text-[10px] text-red-400 font-medium">Saída: {new Date(b.data_egresso).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      b.ativo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {b.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(b)} className="p-2 text-slate-400 hover:text-drogamais-500 hover:bg-drogamais-50 dark:hover:bg-drogamais-500/10 rounded-lg transition-all"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(b.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
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
