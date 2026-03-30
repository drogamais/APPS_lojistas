import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export async function homeRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate)

  // Hook para restringir apenas Admins
  const requireAdmin = async (request, reply) => {
    if (!request.user || request.user.is_admin !== true) {
      return reply.status(403).send({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' })
    }
  }

  // ============== GET (Público para Lojistas) ==============
  fastify.get('/api/home', async (request, reply) => {
    const [links, avisos] = await Promise.all([
      prisma.lojaHomeLink.findMany({
        where: { ativo: true },
        orderBy: { ordem: 'asc' }
      }),
      prisma.lojaHomeAviso.findMany({
        where: { ativo: true },
        orderBy: { ordem: 'asc' }
      })
    ])

    return reply.send({ links, avisos })
  })

  // ============== LINKS (Admin) ==============
  fastify.post('/api/admin/home/links', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({
      titulo: z.string().min(1),
      url: z.string().url(),
      icone_nome: z.string().optional(),
    })
    const data = schema.parse(request.body)
    const total = await prisma.lojaHomeLink.count()
    const link = await prisma.lojaHomeLink.create({
      data: { ...data, ordem: total + 1 }
    })
    return reply.send(link)
  })

  fastify.put('/api/admin/home/links/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({
      titulo: z.string().min(1),
      url: z.string().url(),
      icone_nome: z.string().optional(),
      ativo: z.boolean().optional(),
    })
    const data = schema.parse(request.body)
    const link = await prisma.lojaHomeLink.update({
      where: { id: Number(request.params.id) },
      data
    })
    return reply.send(link)
  })

  fastify.delete('/api/admin/home/links/:id', { preHandler: requireAdmin }, async (request, reply) => {
    await prisma.lojaHomeLink.delete({ where: { id: Number(request.params.id) } })
    return reply.send({ ok: true })
  })

  // ============== AVISOS (Admin) ==============
  fastify.post('/api/admin/home/avisos', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({
      titulo: z.string().min(1),
      descricao_ou_imagem: z.string().min(1),
    })
    const data = schema.parse(request.body)
    const total = await prisma.lojaHomeAviso.count()
    const aviso = await prisma.lojaHomeAviso.create({
      data: { ...data, ordem: total + 1 }
    })
    return reply.send(aviso)
  })

  fastify.put('/api/admin/home/avisos/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({
      titulo: z.string().min(1),
      descricao_ou_imagem: z.string().min(1),
      ativo: z.boolean().optional(),
    })
    const data = schema.parse(request.body)
    const aviso = await prisma.lojaHomeAviso.update({
      where: { id: Number(request.params.id) },
      data
    })
    return reply.send(aviso)
  })

  fastify.delete('/api/admin/home/avisos/:id', { preHandler: requireAdmin }, async (request, reply) => {
    await prisma.lojaHomeAviso.delete({ where: { id: Number(request.params.id) } })
    return reply.send({ ok: true })
  })

  // ============== REORDER (Drag & Drop) ==============
  fastify.put('/api/admin/reorder', { preHandler: requireAdmin }, async (request, reply) => {
    const schema = z.object({
      tipo: z.enum(['links', 'avisos']),
      ids: z.array(z.number())
    })
    const { tipo, ids } = schema.parse(request.body)

    // Atualiza a ordem seqüencialmente
    const table = tipo === 'links' ? prisma.lojaHomeLink : prisma.lojaHomeAviso

    // Transação para garantir consistência
    await prisma.$transaction(
      ids.map((id, index) =>
        table.update({
          where: { id },
          data: { ordem: index + 1 },
        })
      )
    )

    return reply.send({ ok: true })
  })
}
