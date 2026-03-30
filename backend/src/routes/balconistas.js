import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const balconistaSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório.'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos.').optional(),
  email: z.string().email('E-mail inválido.').optional(),
  telefone: z.string().max(20).optional(),
  ativo: z.boolean().optional(),
})

const balconistaUpdateSchema = balconistaSchema.partial()

export async function balconistaRoutes(fastify) {
  // Aplica autenticação em todas as rotas deste escopo
  fastify.addHook('onRequest', fastify.authenticate)

  // GET /api/balconistas - lista todos da loja autenticada
  fastify.get('/api/balconistas', async (request, reply) => {
    const { loja_id } = request.user

    const balconistas = await prisma.lojaBalconista.findMany({
      where: { loja_id, deletedAt: null },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        cpf: true,
        email: true,
        telefone: true,
        ativo: true,
        createdAt: true,
      },
    })

    return reply.send(balconistas)
  })

  // GET /api/balconistas/:id - detalhe de um balconista
  fastify.get('/api/balconistas/:id', async (request, reply) => {
    const { loja_id } = request.user
    const id = Number(request.params.id)

    const balconista = await prisma.lojaBalconista.findFirst({
      where: { id, loja_id, deletedAt: null },
    })

    if (!balconista) {
      return reply.status(404).send({ error: 'Balconista não encontrado.' })
    }

    return reply.send(balconista)
  })

  // POST /api/balconistas - cria novo balconista
  fastify.post('/api/balconistas', async (request, reply) => {
    const { loja_id, cnpj, loja_numero, nome_fantasia } = request.user

    const parse = balconistaSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.flatten().fieldErrors })
    }

    const balconista = await prisma.lojaBalconista.create({
      data: {
        ...parse.data,
        loja_id,
        cnpj,
        loja_numero,
        nome_fantasia,
      },
    })

    return reply.status(201).send(balconista)
  })

  // PUT /api/balconistas/:id - atualiza balconista
  fastify.put('/api/balconistas/:id', async (request, reply) => {
    const { loja_id } = request.user
    const id = Number(request.params.id)

    const parse = balconistaUpdateSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.flatten().fieldErrors })
    }

    // Garante que o registro pertence à loja antes de atualizar
    const exists = await prisma.lojaBalconista.findFirst({
      where: { id, loja_id, deletedAt: null },
    })
    if (!exists) {
      return reply.status(404).send({ error: 'Balconista não encontrado.' })
    }

    const balconista = await prisma.lojaBalconista.update({
      where: { id },
      data: parse.data,
    })

    return reply.send(balconista)
  })

  // DELETE /api/balconistas/:id - soft delete
  fastify.delete('/api/balconistas/:id', async (request, reply) => {
    const { loja_id } = request.user
    const id = Number(request.params.id)

    const exists = await prisma.lojaBalconista.findFirst({
      where: { id, loja_id, deletedAt: null },
    })
    if (!exists) {
      return reply.status(404).send({ error: 'Balconista não encontrado.' })
    }

    await prisma.lojaBalconista.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return reply.status(204).send()
  })
}
