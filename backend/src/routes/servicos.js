import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const servicoSchema = z.object({
  nome_servico: z.string().min(2, 'Nome do serviço obrigatório.'),
  descricao: z.string().optional(),
  ativo: z.boolean().optional(),
})

const servicoUpdateSchema = servicoSchema.partial()

export async function servicoRoutes(fastify) {
  // Aplica autenticação em todas as rotas deste escopo
  fastify.addHook('onRequest', fastify.authenticate)

  // GET /api/servicos - lista todos da loja autenticada
  fastify.get('/api/servicos', async (request, reply) => {
    const { loja_id } = request.user

    const servicos = await prisma.lojaServicos.findMany({
      where: { loja_id, deletedAt: null },
      orderBy: { nome_servico: 'asc' },
      select: {
        id: true,
        nome_servico: true,
        descricao: true,
        ativo: true,
        createdAt: true,
      },
    })

    return reply.send(servicos)
  })

  // GET /api/servicos/:id - detalhe de um serviço
  fastify.get('/api/servicos/:id', async (request, reply) => {
    const { loja_id } = request.user
    const id = Number(request.params.id)

    const servico = await prisma.lojaServicos.findFirst({
      where: { id, loja_id, deletedAt: null },
    })

    if (!servico) {
      return reply.status(404).send({ error: 'Serviço não encontrado.' })
    }

    return reply.send(servico)
  })

  // POST /api/servicos - cria novo serviço
  fastify.post('/api/servicos', async (request, reply) => {
    const { loja_id, cnpj, loja_numero, nome_fantasia } = request.user

    const parse = servicoSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.flatten().fieldErrors })
    }

    const servico = await prisma.lojaServicos.create({
      data: {
        ...parse.data,
        loja_id,
        cnpj,
        loja_numero,
        nome_fantasia,
      },
    })

    return reply.status(201).send(servico)
  })

  // PUT /api/servicos/:id - atualiza serviço
  fastify.put('/api/servicos/:id', async (request, reply) => {
    const { loja_id } = request.user
    const id = Number(request.params.id)

    const parse = servicoUpdateSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.flatten().fieldErrors })
    }

    const exists = await prisma.lojaServicos.findFirst({
      where: { id, loja_id, deletedAt: null },
    })
    if (!exists) {
      return reply.status(404).send({ error: 'Serviço não encontrado.' })
    }

    const servico = await prisma.lojaServicos.update({
      where: { id },
      data: parse.data,
    })

    return reply.send(servico)
  })

  // DELETE /api/servicos/:id - soft delete
  fastify.delete('/api/servicos/:id', async (request, reply) => {
    const { loja_id } = request.user
    const id = Number(request.params.id)

    const exists = await prisma.lojaServicos.findFirst({
      where: { id, loja_id, deletedAt: null },
    })
    if (!exists) {
      return reply.status(404).send({ error: 'Serviço não encontrado.' })
    }

    await prisma.lojaServicos.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return reply.status(204).send()
  })
}
