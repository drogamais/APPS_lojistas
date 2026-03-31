import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export async function homeRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate)

  const requireAdmin = async (request, reply) => {
    if (!request.user || request.user.is_admin !== true) {
      return reply.status(403).send({ error: 'Acesso negado. Apenas administradores.' })
    }
  }

  // ============== GET (Público para Lojistas e Visível p/ Admin) ==============
  // ============== GET (Público para Lojistas e Visível p/ Admin) ==============
  fastify.get('/api/home', async (request, reply) => {
    // Permite contornar os filtros APENAS se: o usuário logado for admin E explicitamente enviar ?all=true (na url da tela de admin)
    const isEditingAdmin = request.user && request.user.is_admin === true && request.query.all === 'true'
    
    // Assim, se o admin abrir a "Home" principal, ele vai enxergar o mesmo painel rigoroso que um lojista comum enxerga.
    const baseFilter = isEditingAdmin ? {} : {
      ativo: true,
      OR: [
        { data_expiracao: null },
        { data_expiracao: { gt: new Date() } }
      ]
    }

    const [links, avisos, promocoes] = await Promise.all([
      prisma.lojaHomeLink.findMany({ where: baseFilter, orderBy: { ordem: 'asc' } }),
      prisma.lojaHomeAviso.findMany({ where: baseFilter, orderBy: { ordem: 'asc' } }),
      prisma.lojaHomePromocao.findMany({ where: baseFilter, orderBy: { ordem: 'asc' } }),
    ])
    return reply.send({ links, avisos, promocoes })
  })

  // ============== LINKS (Admin) ==============
  fastify.post('/api/admin/home/links', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({ titulo: z.string().min(1), url: z.string().min(1), icone_nome: z.string().optional() })
    const data = schema.parse(request.body)
    const total = await prisma.lojaHomeLink.count()
    return reply.send(await prisma.lojaHomeLink.create({ data: { ...data, ordem: total + 1 } }))
  })

  fastify.put('/api/admin/home/links/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({ 
      titulo: z.string().min(1), 
      url: z.string().min(1), 
      icone_nome: z.string().optional(), 
      ativo: z.boolean().optional(),
      data_expiracao: z.string().datetime().optional().nullable() 
    })
    const data = schema.parse(request.body)
    return reply.send(await prisma.lojaHomeLink.update({ where: { id: Number(request.params.id) }, data }))
  })

  fastify.delete('/api/admin/home/links/:id', { preHandler: requireAdmin }, async (request, reply) => {
    await prisma.lojaHomeLink.delete({ where: { id: Number(request.params.id) } })
    return reply.send({ ok: true })
  })

  // ============== AVISOS (Admin) ==============
  fastify.post('/api/admin/home/avisos', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({ titulo: z.string().min(1), descricao_ou_imagem: z.string().min(1) })
    const data = schema.parse(request.body)
    const total = await prisma.lojaHomeAviso.count()
    return reply.send(await prisma.lojaHomeAviso.create({ data: { ...data, ordem: total + 1 } }))
  })

  fastify.put('/api/admin/home/avisos/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({ 
      titulo: z.string().min(1), 
      descricao_ou_imagem: z.string().min(1), 
      ativo: z.boolean().optional(),
      data_expiracao: z.string().datetime().optional().nullable() 
    })
    const data = schema.parse(request.body)
    return reply.send(await prisma.lojaHomeAviso.update({ where: { id: Number(request.params.id) }, data }))
  })

  fastify.delete('/api/admin/home/avisos/:id', { preHandler: requireAdmin }, async (request, reply) => {
    await prisma.lojaHomeAviso.delete({ where: { id: Number(request.params.id) } })
    return reply.send({ ok: true })
  })

  // ============== PROMOÇÕES (Admin) ==============
  fastify.post('/api/admin/home/promocoes', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({
      titulo: z.string().min(1),
      imagem_url: z.string().min(1),
      url_destino: z.string().min(1).optional().or(z.literal('')),
    })
    const data = schema.parse(request.body)
    const total = await prisma.lojaHomePromocao.count()
    return reply.send(await prisma.lojaHomePromocao.create({ data: { ...data, ordem: total + 1 } }))
  })

  fastify.put('/api/admin/home/promocoes/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({
      titulo: z.string().min(1),
      imagem_url: z.string().min(1),
      url_destino: z.string().min(1).optional().or(z.literal('')),
      ativo: z.boolean().optional(),
      data_expiracao: z.string().datetime().optional().nullable()
    })
    const data = schema.parse(request.body)
    return reply.send(await prisma.lojaHomePromocao.update({ where: { id: Number(request.params.id) }, data }))
  })

  fastify.delete('/api/admin/home/promocoes/:id', { preHandler: requireAdmin }, async (request, reply) => {
    await prisma.lojaHomePromocao.delete({ where: { id: Number(request.params.id) } })
    return reply.send({ ok: true })
  })

  // ============== REORDER (Drag & Drop) ==============
  fastify.put('/api/admin/reorder', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({
      tipo: z.enum(['links', 'avisos', 'promocoes']),
      ids: z.array(z.number())
    })
    const { tipo, ids } = schema.parse(request.body)
    const table = tipo === 'links'
      ? prisma.lojaHomeLink
      : tipo === 'avisos'
        ? prisma.lojaHomeAviso
        : prisma.lojaHomePromocao

    await prisma.$transaction(
      ids.map((id, index) => table.update({ where: { id }, data: { ordem: index + 1 } }))
    )
    return reply.send({ ok: true })
  })
}
