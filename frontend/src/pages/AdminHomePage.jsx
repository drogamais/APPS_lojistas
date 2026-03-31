import { useState, useEffect } from 'react'
import api from '../services/api.js'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, Plus, Save, Trash2, Edit2, X } from 'lucide-react'

// Utilidade de reordenação local
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

export default function AdminHomePage() {
  const [links, setLinks] = useState([])
  const [avisos, setAvisos] = useState([])
  const [promocoes, setPromocoes] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Abas e KanBan
  const [activeTab, setActiveTab] = useState('promocoes')

  // Edit states
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    setLoading(true)
    api.get('/api/home?all=true').then(({ data }) => {
      setLinks(data.links || [])
      setAvisos(data.avisos || [])
      setPromocoes(data.promocoes || [])
    }).finally(() => setLoading(false))
  }

  // Função utilitária para verificar validade visual
  const isInactive = (item) => {
    if (item.ativo === false) return true
    if (item.data_expiracao && new Date(item.data_expiracao) <= new Date()) return true
    return false
  }

  // ============== NOVO DRAG AND DROP KANBAN ==============
  const handleDragEnd = async (result) => {
    const { source, destination } = result
    if (!destination) return

    const type = activeTab
    const dataArray = type === 'links' ? links : type === 'avisos' ? avisos : promocoes
    const setter = type === 'links' ? setLinks : type === 'avisos' ? setAvisos : setPromocoes

    const ativos = dataArray.filter(i => !isInactive(i))
    const ocultos = dataArray.filter(i => isInactive(i))

    // Helper para montar payload completo satisfazendo o Zod do Backend
    const buildPayload = (item, overrides) => {
      const payload = {
        titulo: item.titulo,
        ativo: item.ativo,
        data_expiracao: item.data_expiracao || null,
        ...overrides
      }
      if (type === 'links') {
        payload.url = item.url
        payload.icone_nome = item.icone_nome || ''
      } else if (type === 'avisos') {
        payload.descricao_ou_imagem = item.descricao_ou_imagem || ''
      } else {
        payload.imagem_url = item.imagem_url
        payload.url_destino = item.url_destino || ''
      }
      return payload
    }

    // Movimentação interna
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'zone-ativos') {
        const newAtivos = Array.from(ativos)
        const [moved] = newAtivos.splice(source.index, 1)
        newAtivos.splice(destination.index, 0, moved)
        setter([...newAtivos, ...ocultos])
        try {
          await api.put('/api/admin/reorder', { tipo: type, ids: newAtivos.map(i => i.id) })
        } catch { fetchData() }
      }
      return
    }

    // Ativos -> Ocultos (Ocultar)
    if (source.droppableId === 'zone-ativos' && destination.droppableId === 'zone-ocultos') {
      const item = ativos[source.index]
      const payload = buildPayload(item, { ativo: false })
      setter(dataArray.map(i => i.id === item.id ? { ...i, ...payload } : i))
      try {
        await api.put(`/api/admin/home/${type}/${item.id}`, payload)
        fetchData()
      } catch { fetchData() }
      return
    }

    // Ocultos -> Ativos (Ativar)
    if (source.droppableId === 'zone-ocultos' && destination.droppableId === 'zone-ativos') {
      const item = ocultos[source.index]
      const expired = item.data_expiracao && new Date(item.data_expiracao) <= new Date()
      const payload = buildPayload(item, expired ? { ativo: true, data_expiracao: null } : { ativo: true })
      
      setter(dataArray.map(i => i.id === item.id ? { ...i, ...payload } : i))
      try {
        await api.put(`/api/admin/home/${type}/${item.id}`, payload)
        fetchData()
      } catch { fetchData() }
    }
  }

  // ============== CRUD Genérico ==============
  const handleAddNew = async (type) => {
    try {
      if (type === 'links') {
        const res = await api.post('/api/admin/home/links', { titulo: 'Novo Link', url: 'https://', icone_nome: 'Link' })
        setLinks([...links, res.data])
      } else if (type === 'avisos') {
        const res = await api.post('/api/admin/home/avisos', { titulo: 'Novo Aviso', descricao_ou_imagem: 'Conteúdo do aviso' })
        setAvisos([...avisos, res.data])
      } else {
        const res = await api.post('/api/admin/home/promocoes', { titulo: 'Nova Promoção', imagem_url: 'https://', url_destino: '' })
        setPromocoes([...promocoes, res.data])
      }
    } catch { alert("Erro ao criar novo item") }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm("Deseja realmente excluir permanentemente?")) return
    try {
      await api.delete(`/api/admin/home/${type}/${id}`)
      if (type === 'links') setLinks(links.filter(i => i.id !== id))
      else if (type === 'avisos') setAvisos(avisos.filter(i => i.id !== id))
      else setPromocoes(promocoes.filter(i => i.id !== id))
    } catch { alert("Erro ao remover") }
  }

  const openEdit = (type, item) => {
    setEditingItem({ id: item.id, type })
    let dExp = ''
    if (item.data_expiracao) {
      const d = new Date(item.data_expiracao)
      dExp = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    }
    setEditForm({ ...item, data_expiracao_input: dExp, ativo: item.ativo !== false })
  }

  const saveEdit = async () => {
    try {
      const { id, type } = editingItem
      const payload = {
        titulo: editForm.titulo,
        ativo: editForm.ativo,
        data_expiracao: editForm.data_expiracao_input ? new Date(editForm.data_expiracao_input).toISOString() : null
      }

      if (type === 'links') {
        payload.url = editForm.url
        payload.icone_nome = editForm.icone_nome
      } else if (type === 'avisos') {
        payload.descricao_ou_imagem = editForm.descricao_ou_imagem
      } else {
        payload.imagem_url = editForm.imagem_url
        payload.url_destino = editForm.url_destino
      }

      await api.put(`/api/admin/home/${type}/${id}`, payload)
      setEditingItem(null)
      fetchData()
    } catch { alert("Erro ao salvar") }
  }

  const formatExpMsg = (iso) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' -')
  }

  // ============== FUNÇÃO DE RENDER DO ITEM DO KANBAN ==============
  const renderItemCard = (item, index, type) => (
    <Draggable key={`${type}-${item.id}`} draggableId={`${type}-${item.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex justify-between items-center p-3 bg-white border rounded-xl group transition-all mb-2 ${
            snapshot.isDragging ? 'shadow-xl ring-2 ring-drogamais-500 scale-105 z-50 border-transparent' : 'border-gray-200 hover:border-drogamais-300'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
            <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1">
              <GripVertical size={18} />
            </div>
            
            {type === 'promocoes' && (
              <div className="w-14 h-10 shrink-0 bg-gray-100 rounded overflow-hidden border border-gray-100">
                <img src={item.imagem_url.startsWith('/') ? `${api.defaults.baseURL}${item.imagem_url}` : item.imagem_url} alt="img" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[13px] text-gray-800 flex items-center gap-2 flex-wrap truncate">
                {item.titulo}
                {item.data_expiracao && (
                  <span className={`px-1 rounded text-[9px] font-mono border tracking-wide whitespace-nowrap ${
                    new Date(item.data_expiracao) <= new Date() ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>⏳ {formatExpMsg(item.data_expiracao)}</span>
                )}
              </span>
              <span className="text-[11px] text-gray-400 truncate mt-0.5">
                {type === 'links' ? `${item.url} (${item.icone_nome||'sem ícone'})` : type === 'avisos' ? item.descricao_ou_imagem : item.imagem_url}
              </span>
            </div>
          </div>
          
          <div className="flex gap-1 shrink-0">
            <button onClick={() => openEdit(type, item)} className="p-1.5 text-gray-400 hover:text-drogamais-500 hover:bg-drogamais-50 rounded transition"><Edit2 size={15} /></button>
            <button onClick={() => handleDelete(type, item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={15} /></button>
          </div>
        </div>
      )}
    </Draggable>
  )

  if (loading) return <p className="text-gray-500 p-8">Carregando painel de administração...</p>

  // Listas da aba atual
  const activeData = activeTab === 'links' ? links : activeTab === 'avisos' ? avisos : promocoes
  const listAtivos = activeData.filter(i => !isInactive(i)).sort((a,b) => a.ordem - b.ordem)
  const listOcultos = activeData.filter(i => isInactive(i)).sort((a,b) => a.ordem - b.ordem)

  return (
    <div className="max-w-6xl w-full pb-12 animate-in fade-in select-none">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Administração de Conteúdo</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Arraste os cards para o bloco da direita para ocultá-los do mural. Expirados pulam automaticamente.
          </p>
        </div>
        <button 
          onClick={() => handleAddNew(activeTab)} 
          className="bg-drogamais-500 hover:bg-drogamais-600 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={18} /> 
          Novo {activeTab === 'links' ? 'SISTEMA' : activeTab === 'promocoes' ? 'BANNER' : 'AVISO'}
        </button>
      </div>

      {/* ── TABS NAVEGADORAS ── */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto select-none rounded-t-xl bg-slate-50/50">
        {[
          { id: 'promocoes', label: 'Banners de Promoção' },
          { id: 'links', label: 'Carrossel de Sistemas' },
          { id: 'avisos', label: 'Mural de Avisos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-bold text-sm tracking-wide transition-all whitespace-nowrap border-b-[3px]
              ${activeTab === tab.id ? 'border-drogamais-500 text-drogamais-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-white/50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MESA KANBAN (DRAG AND DROP) ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* COLUNA 1: ATIVOS NA TELA */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex flex-col h-[65vh] min-h-[500px]">
            <div className="p-4 border-b border-slate-200 bg-white rounded-t-2xl flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                VISÍVEIS NA HOME
              </h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-bold">{listAtivos.length}</span>
            </div>
            <Droppable droppableId="zone-ativos" direction="vertical">
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef} 
                  className={`p-4 flex-1 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-emerald-50/50' : ''}`}
                >
                  {listAtivos.map((item, index) => renderItemCard(item, index, activeTab))}
                  {provided.placeholder}
                  {listAtivos.length === 0 && <p className="text-sm text-center py-10 text-slate-400 italic">Nenhum item visível. Arraste para cá.</p>}
                </div>
              )}
            </Droppable>
          </div>

          {/* COLUNA 2: OCULTOS / EXPIRADOS */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/60 shadow-inner opacity-90 hover:opacity-100 transition-opacity flex flex-col h-[65vh] min-h-[500px]">
            <div className="p-4 border-b border-slate-200/60 bg-white/50 rounded-t-2xl flex items-center justify-between">
              <h2 className="font-bold text-slate-500 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                GELADEIRA (Ocultos / Expirados)
              </h2>
              <span className="text-xs bg-slate-200 text-slate-500 px-2.5 py-1 rounded-full font-bold">{listOcultos.length}</span>
            </div>
            <Droppable droppableId="zone-ocultos" direction="vertical">
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef} 
                  className={`p-4 flex-1 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-red-50/30' : ''}`}
                >
                  {listOcultos.map((item, index) => renderItemCard(item, index, activeTab))}
                  {provided.placeholder}
                  {listOcultos.length === 0 && <p className="text-sm text-center py-10 text-slate-400 italic">Geladeira vazia.</p>}
                </div>
              )}
            </Droppable>
          </div>

        </div>
      </DragDropContext>

      {/* MODAL DE EDIÇÃO */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 shadow-2xl backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-3 border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">
                Editar {activeTab.toUpperCase()}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-red-500 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pt-1 pb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Título</label>
                <input 
                  value={editForm.titulo || ''} 
                  onChange={e => setEditForm({...editForm, titulo: e.target.value})}
                  className="w-full mt-1 border border-gray-200 bg-gray-50 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-drogamais-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Agendar Ocultação Automática</label>
                <input 
                  type="datetime-local"
                  value={editForm.data_expiracao_input || ''} 
                  onChange={e => setEditForm({...editForm, data_expiracao_input: e.target.value})}
                  className="w-full mt-1 border border-gray-200 bg-gray-50 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-drogamais-500 outline-none" 
                />
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">Deixe o campo vazio para manter no ar indefinidamente. Se agendado, o card pulará para a "Geladeira" assim que essa data/hora passar.</p>
              </div>

              {activeTab === 'links' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">URL do Parceiro</label>
                    <input value={editForm.url || ''} onChange={e => setEditForm({...editForm, url: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Ícone</label>
                    <input value={editForm.icone_nome || ''} onChange={e => setEditForm({...editForm, icone_nome: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none bg-gray-50" placeholder="Ex: Star, Truck" />
                  </div>
                </>
              )}
              {activeTab === 'avisos' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Mensagem</label>
                  <textarea value={editForm.descricao_ou_imagem || ''} onChange={e => setEditForm({...editForm, descricao_ou_imagem: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm min-h-[120px] outline-none bg-gray-50" />
                </div>
              )}
              {activeTab === 'promocoes' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">URL da Imagem</label>
                    <input value={editForm.imagem_url || ''} onChange={e => setEditForm({...editForm, imagem_url: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Link de Destino</label>
                    <input value={editForm.url_destino || ''} onChange={e => setEditForm({...editForm, url_destino: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none bg-gray-50" />
                  </div>
                </>
              )}
            </div>

            <div className="mt-2 pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition">Cancelar</button>
              <button 
                onClick={saveEdit} 
                className="bg-drogamais-500 hover:bg-drogamais-600 shadow-md shadow-drogamais-500/20 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition"
              >
                <Save size={16} /> Salvar Edição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
