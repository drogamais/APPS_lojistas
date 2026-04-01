import { useState, useEffect } from 'react'
import api from '../services/api.js'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, Plus, Save, Trash2, Edit2, X } from 'lucide-react'


export default function AdminHomePage() {
  const [links, setLinks] = useState([])
  const [avisos, setAvisos] = useState([])
  const [promocoes, setPromocoes] = useState([])
  const [admins, setAdmins] = useState([])
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
    const promises = [
      api.get('/api/home?all=true'),
      api.get('/api/admin/users').catch(() => ({ data: [] }))
    ]
    
    Promise.all(promises).then(([homeRes, adminRes]) => {
      setLinks(homeRes.data.links || [])
      setAvisos(homeRes.data.avisos || [])
      setPromocoes(homeRes.data.promocoes || [])
      setAdmins(adminRes.data || [])
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
  const openCreate = (type) => {
    setEditingItem({ id: null, type })
    if (type === 'links') {
      setEditForm({ titulo: '', url: 'https://', icone_nome: 'Link', ativo: true, data_expiracao_input: '' })
    } else if (type === 'avisos') {
      setEditForm({ titulo: '', descricao_ou_imagem: '', ativo: true, data_expiracao_input: '' })
    } else if (type === 'promocoes') {
      setEditForm({ titulo: '', imagem_url: '', url_destino: '', ativo: true, data_expiracao_input: '' })
    } else if (type === 'admins') {
      setEditForm({ nome: '', email: '', senha: '' })
    }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm("Deseja realmente excluir permanentemente?")) return
    try {
      if (type === 'admins') {
        await api.delete(`/api/admin/users/${id}`)
        setAdmins(admins.filter(i => i.id !== id))
      } else {
        await api.delete(`/api/admin/home/${type}/${id}`)
        if (type === 'links') setLinks(links.filter(i => i.id !== id))
        else if (type === 'avisos') setAvisos(avisos.filter(i => i.id !== id))
        else setPromocoes(promocoes.filter(i => i.id !== id))
      }
    } catch (err) { 
      const errorMsg = err.response?.data?.error || "Erro ao remover"
      alert(errorMsg)
    }
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
      
      if (type === 'admins') {
        await api.post('/api/admin/users', editForm)
      } else {
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

        if (id === null) {
          await api.post(`/api/admin/home/${type}`, payload)
        } else {
          await api.put(`/api/admin/home/${type}/${id}`, payload)
        }
      }
      setEditingItem(null)
      fetchData()
    } catch (err) { 
      const errorMsg = err.response?.data?.error || "Erro ao salvar"
      alert(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg)
    }
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
          className={`flex justify-between items-center p-3 bg-white dark:bg-slate-800 border rounded-xl group transition-all mb-2 ${
            snapshot.isDragging 
              ? 'shadow-xl ring-2 ring-drogamais-500 scale-105 z-50 border-transparent bg-white dark:bg-slate-700' 
              : 'border-slate-200 dark:border-slate-700 hover:border-drogamais-300 dark:hover:border-drogamais-900'
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
              <span className="font-bold text-[13px] text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap truncate">
                {item.titulo}
                {item.data_expiracao && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wide whitespace-nowrap ${
                    new Date(item.data_expiracao) <= new Date() 
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50' 
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                  }`}>⏳ {formatExpMsg(item.data_expiracao)}</span>
                )}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {type === 'links' ? `${item.url} (${item.icone_nome||'sem ícone'})` : type === 'avisos' ? item.descricao_ou_imagem : item.imagem_url}
              </span>
            </div>
          </div>
          
          <div className="flex gap-1 shrink-0">
            <button onClick={() => openEdit(type, item)} className="p-1.5 text-slate-400 hover:text-drogamais-500 hover:bg-drogamais-50 dark:hover:bg-drogamais-500/10 rounded transition"><Edit2 size={15} /></button>
            <button onClick={() => handleDelete(type, item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition"><Trash2 size={15} /></button>
          </div>
        </div>
      )}
    </Draggable>
  )

  const renderAdminList = () => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Nome</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">E-mail</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">CNPJ</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Criado em</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {admins.map(admin => (
              <tr key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200">{admin.nome_fantasia}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">{admin.email}</td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400 dark:text-slate-500">{admin.cnpj || '-'}</td>
                <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">{new Date(admin.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-right">
                  {admin.email !== 'admin@drogamais.com' && (
                    <button 
                      onClick={() => handleDelete('admins', admin.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {admins.length === 0 && (
        <div className="p-12 text-center text-slate-400 italic text-sm">Nenhum administrador encontrado.</div>
      )}
    </div>
  )

  if (loading) return <p className="text-slate-500 dark:text-slate-400 p-8 animate-pulse italic">Carregando painel de administração...</p>

  // Listas da aba atual
  const activeData = activeTab === 'links' ? links : activeTab === 'avisos' ? avisos : promocoes
  const listAtivos = activeData.filter(i => !isInactive(i)).sort((a,b) => a.ordem - b.ordem)
  const listOcultos = activeData.filter(i => isInactive(i)).sort((a,b) => a.ordem - b.ordem)

  return (
    <div className="max-w-6xl mx-auto w-full pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 select-none">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Administração de Conteúdo</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Arraste os cards para o bloco da direita para ocultá-los do mural. Expirados pulam automaticamente.
          </p>
        </div>
        <button
          onClick={() => openCreate(activeTab)}
          className="bg-drogamais-500 hover:bg-drogamais-600 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition hover:scale-105 active:scale-95 shadow-lg shadow-drogamais-500/20"
        >
          <Plus size={18} strokeWidth={3} /> 
          Novo {activeTab === 'links' ? 'SISTEMA' : activeTab === 'promocoes' ? 'BANNER' : activeTab === 'avisos' ? 'AVISO' : 'ADMINISTRADOR'}
        </button>
      </div>

      {/* ── TABS NAVEGADORAS ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto select-none rounded-t-2xl bg-white dark:bg-slate-900">
        {[
          { id: 'promocoes', label: 'Banners de Promoção' },
          { id: 'links', label: 'Carrossel de Sistemas' },
          { id: 'avisos', label: 'Mural de Avisos' },
          { id: 'admins', label: 'Gestão de Admins' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-4 font-bold text-[13px] uppercase tracking-widest transition-all whitespace-nowrap border-b-[3px]
              ${activeTab === tab.id 
                ? 'border-drogamais-500 text-drogamais-600 bg-white dark:bg-slate-800/10' 
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/20'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'admins' ? renderAdminList() : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* COLUNA 1: ATIVOS NA TELA */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col h-[65vh] min-h-[500px]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-[24px] flex items-center justify-between shadow-sm">
                <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-xs tracking-widest uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                  Visíveis na Home
                </h2>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-black tabular-nums border border-slate-200 dark:border-slate-700">{listAtivos.length}</span>
              </div>
              <Droppable droppableId="zone-ativos" direction="vertical">
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className={`p-4 flex-1 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                  >
                    {listAtivos.map((item, index) => renderItemCard(item, index, activeTab))}
                    {provided.placeholder}
                    {listAtivos.length === 0 && <p className="text-xs text-center py-12 text-slate-400 dark:text-slate-600 italic font-medium">Nenhum item visível. Arraste para cá.</p>}
                  </div>
                )}
              </Droppable>
            </div>

            {/* COLUNA 2: OCULTOS / EXPIRADOS */}
            <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-[24px] border border-slate-200 dark:border-slate-800/60 shadow-inner flex flex-col h-[65vh] min-h-[500px]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 rounded-t-[24px] flex items-center justify-between shadow-sm">
                <h2 className="font-black text-slate-400 dark:text-slate-600 flex items-center gap-2 text-xs tracking-widest uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  Geladeira (Ocultos)
                </h2>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 px-2.5 py-1 rounded-full font-black tabular-nums border border-slate-200/60 dark:border-slate-700">{listOcultos.length}</span>
              </div>
              <Droppable droppableId="zone-ocultos" direction="vertical">
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className={`p-4 flex-1 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-red-50/30 dark:bg-red-950/20' : ''}`}
                  >
                    {listOcultos.map((item, index) => renderItemCard(item, index, activeTab))}
                    {provided.placeholder}
                    {listOcultos.length === 0 && <p className="text-xs text-center py-12 text-slate-400 dark:text-slate-600 italic font-medium">Geladeira vazia.</p>}
                  </div>
                )}
              </Droppable>
            </div>

          </div>
        </DragDropContext>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 dark:bg-black/80 z-50 flex items-center justify-center p-4 shadow-2xl backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-lg p-8 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-[18px] text-slate-800 dark:text-white uppercase tracking-tight">
                {editingItem?.id === null ? 'Novo' : 'Editar'} {editingItem?.type === 'links' ? 'SISTEMA' : editingItem?.type === 'promocoes' ? 'BANNER' : 'AVISO'}
              </h3>
              <button 
                onClick={() => setEditingItem(null)} 
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="space-y-5 max-h-[60vh] overflow-y-auto px-1">
              {activeTab === 'admins' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input value={editForm.nome || ''} onChange={e => setEditForm({...editForm, nome: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                    <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Senha Inicial</label>
                    <input type="password" value={editForm.senha || ''} onChange={e => setEditForm({...editForm, senha: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Título do Card</label>
                    <input 
                      value={editForm.titulo || ''} 
                      onChange={e => setEditForm({...editForm, titulo: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-drogamais-500/20 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Ocultação Automática</label>
                    <input 
                      type="datetime-local"
                      value={editForm.data_expiracao_input || ''} 
                      onChange={e => setEditForm({...editForm, data_expiracao_input: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-drogamais-500/20 outline-none transition-all" 
                    />
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 px-1 mt-1 leading-relaxed">Se agendado, o card pulará para a "Geladeira" no horário definido.</p>
                  </div>

                  {activeTab === 'links' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">URL do Parceiro</label>
                        <input value={editForm.url || ''} onChange={e => setEditForm({...editForm, url: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome do Ícone Lucide</label>
                        <input value={editForm.icone_nome || ''} onChange={e => setEditForm({...editForm, icone_nome: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" placeholder="Ex: Star, Truck, Mail" />
                      </div>
                    </>
                  )}
                  {activeTab === 'avisos' && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Mensagem do Aviso</label>
                      <textarea value={editForm.descricao_ou_imagem || ''} onChange={e => setEditForm({...editForm, descricao_ou_imagem: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-white min-h-[120px] outline-none" />
                    </div>
                  )}
                  {activeTab === 'promocoes' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">URL da Imagem Banner</label>
                        <input value={editForm.imagem_url || ''} onChange={e => setEditForm({...editForm, imagem_url: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Link de Destino</label>
                        <input value={editForm.url_destino || ''} onChange={e => setEditForm({...editForm, url_destino: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none" />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 pt-5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setEditingItem(null)} 
                className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={saveEdit} 
                className="bg-drogamais-500 hover:bg-drogamais-600 shadow-xl shadow-drogamais-500/20 text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wide flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Save size={18} strokeWidth={3} /> {editingItem?.id === null ? 'Criar' : 'Salvar Edição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
