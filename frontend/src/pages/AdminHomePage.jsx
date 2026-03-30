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

  // Edit states
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    setLoading(true)
    api.get('/api/home').then(({ data }) => {
      setLinks(data.links || [])
      setAvisos(data.avisos || [])
      setPromocoes(data.promocoes || [])
    }).finally(() => setLoading(false))
  }

  const handleDragEnd = async (result, type) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index
    if (sourceIndex === destIndex) return

    let reorderedItems = []
    
    if (type === 'links') {
      reorderedItems = reorder(links, sourceIndex, destIndex)
      setLinks(reorderedItems)
    } else if (type === 'avisos') {
      reorderedItems = reorder(avisos, sourceIndex, destIndex)
      setAvisos(reorderedItems)
    } else {
      reorderedItems = reorder(promocoes, sourceIndex, destIndex)
      setPromocoes(reorderedItems)
    }

    // Persistir reordenação no backend em background
    try {
      await api.put('/api/admin/reorder', {
        tipo: type,
        ids: reorderedItems.map(item => item.id),
      })
    } catch (err) {
      console.error('Erro ao reordenar:', err)
      fetchData() // Reverte se falhar
    }
  }

  // ============== CRUD Genérico ==============
  const handleAddNew = async (type) => {
    try {
      if (type === 'links') {
        const payload = { titulo: 'Novo Link', url: 'https://', icone_nome: 'Link' }
        const res = await api.post('/api/admin/home/links', payload)
        setLinks([...links, res.data])
      } else if (type === 'avisos') {
        const payload = { titulo: 'Novo Aviso', descricao_ou_imagem: 'Conteúdo do aviso' }
        const res = await api.post('/api/admin/home/avisos', payload)
        setAvisos([...avisos, res.data])
      } else {
        const payload = { titulo: 'Nova Promoção', imagem_url: 'https://', url_destino: '' }
        const res = await api.post('/api/admin/home/promocoes', payload)
        setPromocoes([...promocoes, res.data])
      }
    } catch (error) {
      alert("Erro ao criar novo item")
    }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm("Deseja realmente remover?")) return
    try {
      await api.delete(`/api/admin/home/${type}/${id}`)
      if (type === 'links') setLinks(links.filter(i => i.id !== id))
      else if (type === 'avisos') setAvisos(avisos.filter(i => i.id !== id))
      else setPromocoes(promocoes.filter(i => i.id !== id))
    } catch (error) {
      alert("Erro ao remover")
    }
  }

  const openEdit = (type, item) => {
    setEditingItem({ id: item.id, type })
    setEditForm({ ...item })
  }

  const saveEdit = async () => {
    try {
      const { id, type } = editingItem
      const payload = {
        titulo: editForm.titulo,
        ativo: editForm.ativo
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
    } catch (error) {
      alert("Erro ao salvar")
    }
  }

  if (loading) return <p className="text-gray-500 p-8">Carregando painel de administração...</p>

  return (
    <div className="max-w-4xl pb-12 animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Administração da Home</h1>
        <p className="text-gray-500 mt-1">
          Arraste e solte os cartões para reposicioná-los na Home dos seus Lojistas em tempo real.
        </p>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 shadow-2xl backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-3 border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">
                Editar {editingItem.type === 'links' ? 'Link' : editingItem.type === 'avisos' ? 'Aviso' : 'Promoção'}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-red-500 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Título</label>
                <input 
                  value={editForm.titulo || ''} 
                  onChange={e => setEditForm({...editForm, titulo: e.target.value})}
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-drogamais-500 outline-none" 
                />
              </div>

              {editingItem.type === 'links' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">URL do Parceiro</label>
                    <input 
                      value={editForm.url || ''} 
                      onChange={e => setEditForm({...editForm, url: e.target.value})}
                      className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-drogamais-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Ícone (Nome do Lucide)</label>
                    <input 
                      value={editForm.icone_nome || ''} 
                      onChange={e => setEditForm({...editForm, icone_nome: e.target.value})}
                      className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-drogamais-500 outline-none" 
                      placeholder="Ex: Star, Truck, BarChart2"
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'avisos' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Mensagem do Comunicado</label>
                  <textarea 
                    value={editForm.descricao_ou_imagem || ''} 
                    onChange={e => setEditForm({...editForm, descricao_ou_imagem: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm min-h-[120px] focus:ring-2 focus:ring-drogamais-500 outline-none" 
                  />
                </div>
              )}

              {editingItem.type === 'promocoes' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">URL da Imagem (Banner)</label>
                    <input 
                      value={editForm.imagem_url || ''} 
                      onChange={e => setEditForm({...editForm, imagem_url: e.target.value})}
                      className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-drogamais-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">URL de Destino (Opcional)</label>
                    <input 
                      value={editForm.url_destino || ''} 
                      onChange={e => setEditForm({...editForm, url_destino: e.target.value})}
                      className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-drogamais-500 outline-none" 
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={saveEdit} 
                className="bg-drogamais-500 hover:bg-drogamais-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
              >
                <Save size={16} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-12">
        {/* ======================= CARROSSEL DE PROMOÇÕES ======================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between rounded-t-2xl border-b border-gray-100">
            <h2 className="font-bold text-gray-700">Carrossel de Promoções</h2>
            <button onClick={() => handleAddNew('promocoes')} className="flex items-center gap-1 text-sm bg-white border border-gray-200 text-drogamais-600 font-medium px-3 py-1.5 rounded-md hover:bg-drogamais-50 transition">
              <Plus size={16} /> Nova Promoção
            </button>
          </div>
          
          <div className="p-4">
            <DragDropContext onDragEnd={(r) => handleDragEnd(r, 'promocoes')}>
              <Droppable droppableId="promocoes-zone">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {promocoes.map((promo, index) => (
                      <Draggable key={`promo-${promo.id}`} draggableId={`promo-${promo.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex justify-between items-center p-3 sm:px-4 bg-white border border-gray-200 rounded-xl group transition-all ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-drogamais-500/50 scale-[1.02] z-40' : 'hover:border-drogamais-300'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1">
                                <GripVertical size={20} />
                              </div>
                              <div className="w-20 h-10 rounded overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                <img 
                                  src={promo.imagem_url.startsWith('/') ? `${api.defaults.baseURL}${promo.imagem_url}` : promo.imagem_url} 
                                  alt={promo.titulo} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm text-gray-800 truncate">{promo.titulo}</span>
                                <span className="text-xs text-gray-400 truncate">{promo.imagem_url}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openEdit('promocoes', promo)} className="p-2 text-gray-400 hover:text-drogamais-500 hover:bg-drogamais-50 rounded-lg transition"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete('promocoes', promo.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {promocoes.length === 0 && <p className="text-sm text-center py-6 text-gray-400">Clique em 'Nova Promoção' para adicionar banners à Home.</p>}
          </div>
        </section>

        {/* ======================= LINKS DE SISTEMAS ======================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between rounded-t-2xl border-b border-gray-100">
            <h2 className="font-bold text-gray-700">Carrossel de Sistemas</h2>
            <button onClick={() => handleAddNew('links')} className="flex items-center gap-1 text-sm bg-white border border-gray-200 text-drogamais-600 font-medium px-3 py-1.5 rounded-md hover:bg-drogamais-50 transition">
              <Plus size={16} /> Novo Link
            </button>
          </div>
          
          <div className="p-4">
            <DragDropContext onDragEnd={(r) => handleDragEnd(r, 'links')}>
              <Droppable droppableId="links-zone">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {links.map((link, index) => (
                      <Draggable key={`link-${link.id}`} draggableId={`link-${link.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex justify-between items-center p-3 sm:px-4 bg-white border border-gray-200 rounded-xl group transition-all ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-drogamais-500/50 scale-[1.02] z-40' : 'hover:border-drogamais-300'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1">
                                <GripVertical size={20} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-gray-800">{link.titulo}</span>
                                <span className="text-xs text-gray-400 max-w-[200px] truncate">{link.url} / Icon: {link.icone_nome}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openEdit('links', link)} className="p-2 text-gray-400 hover:text-drogamais-500 hover:bg-drogamais-50 rounded-lg transition"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete('links', link.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {links.length === 0 && <p className="text-sm text-center py-6 text-gray-400">Clique em 'Novo Link' para começar a popular o carrossel superior.</p>}
          </div>
        </section>

        {/* ======================= MURAL DE AVISOS ======================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between rounded-t-2xl border-b border-gray-100">
            <h2 className="font-bold text-gray-700">Mural de Avisos</h2>
            <button onClick={() => handleAddNew('avisos')} className="flex items-center gap-1 text-sm bg-white border border-gray-200 text-drogamais-600 font-medium px-3 py-1.5 rounded-md hover:bg-drogamais-50 transition">
              <Plus size={16} /> Novo Aviso
            </button>
          </div>

          <div className="p-4">
            <DragDropContext onDragEnd={(r) => handleDragEnd(r, 'avisos')}>
              <Droppable droppableId="avisos-zone">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {avisos.map((aviso, index) => (
                      <Draggable key={`aviso-${aviso.id}`} draggableId={`aviso-${aviso.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex justify-between items-center p-3 sm:px-4 bg-white border border-gray-200 rounded-xl group transition-all ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-drogamais-500/50 scale-[1.02] z-40' : 'hover:border-drogamais-300'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1 pr-4">
                              <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1">
                                <GripVertical size={20} />
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-bold text-sm text-gray-800 truncate">{aviso.titulo}</span>
                                <span className="text-xs text-gray-400 truncate">{aviso.descricao_ou_imagem}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => openEdit('avisos', aviso)} className="p-2 text-gray-400 hover:text-drogamais-500 hover:bg-drogamais-50 rounded-lg transition"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete('avisos', aviso.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {avisos.length === 0 && <p className="text-sm text-center py-6 text-gray-400">Clique em 'Novo Aviso' para despachar notícias aos Lojistas.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
