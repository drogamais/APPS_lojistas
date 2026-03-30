import { useEffect, useState } from 'react'
import api from '../services/api.js'

const EMPTY_FORM = { nome_servico: '', descricao: '', ativo: true }

export default function ServicosPage() {
  const [lista, setLista]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

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
    setForm({ nome_servico: item.nome_servico, descricao: item.descricao ?? '', ativo: item.ativo })
    setError('')
    setShowForm(true)
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Serviços</h1>
        <button
          onClick={openNew}
          className="bg-drogamais-500 hover:bg-drogamais-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Novo serviço
        </button>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-6 flex flex-col gap-4"
        >
          <h2 className="text-sm font-bold text-gray-700">
            {editId ? 'Editar serviço' : 'Novo serviço'}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Nome do serviço *</label>
            <input
              type="text"
              required
              value={form.nome_servico}
              onChange={(e) => setForm({ ...form, nome_servico: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Descrição</label>
            <textarea
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ativo-s"
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="accent-drogamais-500"
            />
            <label htmlFor="ativo-s" className="text-sm text-gray-700">Ativo</label>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-drogamais-500 hover:bg-drogamais-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela */}
      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum serviço cadastrado.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                {['Serviço', 'Descrição', 'Ativo', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{s.nome_servico}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{s.descricao ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.ativo ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => openEdit(s)} className="text-drogamais-500 hover:underline text-xs font-medium">Editar</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline text-xs font-medium">Remover</button>
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
