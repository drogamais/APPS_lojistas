import { useEffect, useState } from 'react'
import api from '../services/api.js'

const EMPTY_FORM = { nome: '', cpf: '', email: '', telefone: '', ativo: true }

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
    setForm({ nome: item.nome, cpf: item.cpf ?? '', email: item.email ?? '', telefone: item.telefone ?? '', ativo: item.ativo })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/api/balconistas/${editId}`, form)
      } else {
        await api.post('/api/balconistas', form)
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Balconistas</h1>
        <button
          onClick={openNew}
          className="bg-drogamais-500 hover:bg-drogamais-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Novo balconista
        </button>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <h2 className="sm:col-span-2 text-sm font-bold text-gray-700">
            {editId ? 'Editar balconista' : 'Novo balconista'}
          </h2>

          {[
            { name: 'nome',     label: 'Nome *',     type: 'text',  required: true },
            { name: 'cpf',      label: 'CPF',        type: 'text'  },
            { name: 'email',    label: 'E-mail',     type: 'email' },
            { name: 'telefone', label: 'Telefone',   type: 'text'  },
          ].map(({ name, label, type, required }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
              <input
                type={type}
                required={required}
                value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500"
              />
            </div>
          ))}

          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="ativo"
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="accent-drogamais-500"
            />
            <label htmlFor="ativo" className="text-sm text-gray-700">Ativo</label>
          </div>

          {error && <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="sm:col-span-2 flex gap-3 justify-end">
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
        <p className="text-sm text-gray-500">Nenhum balconista cadastrado.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                {['Nome', 'CPF', 'E-mail', 'Telefone', 'Ativo', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{b.nome}</td>
                  <td className="px-4 py-3 font-mono">{b.cpf ?? '—'}</td>
                  <td className="px-4 py-3">{b.email ?? '—'}</td>
                  <td className="px-4 py-3">{b.telefone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.ativo ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => openEdit(b)} className="text-drogamais-500 hover:underline text-xs font-medium">Editar</button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:underline text-xs font-medium">Remover</button>
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
