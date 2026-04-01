import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { runSync } from '../lib/sync.js'

let currentSyncStatus = { active: false, current: 0, total: 0 }

export async function adminRoutes(fastify) {
  // Middleware para garantir que o usuário é admin
  fastify.addHook('onRequest', async (request, reply) => {
    await fastify.authenticate(request, reply)
    if (!request.user.is_admin) {
      return reply.status(403).send({ error: 'Acesso negado. Apenas administradores.' })
    }
  })

  // GET /api/admin/lojas
  // Retorna todas as lojas para preencher o dropdown do admin
  fastify.get('/api/admin/lojas', async (request, reply) => {
    const lojas = await prisma.lojaCadastro.findMany({
      where: { deletedAt: null, is_admin: false },
      select: {
        id: true,
        loja_completo: true,
        cnpj: true,
        loja_numero: true,
      },
      orderBy: { loja_completo: 'asc' },
    })
  })

  // GET /api/admin/sync/status
  fastify.get('/api/admin/sync/status', async (request, reply) => {
    return reply.send(currentSyncStatus)
  })

  fastify.post('/api/admin/sync', async (request, reply) => {
    if (currentSyncStatus.active) {
      return reply.status(400).send({ error: 'Já existe uma sincronização em andamento.' })
    }

    try {
      currentSyncStatus = { active: true, current: 0, total: 0 }
      
      const stats = await runSync((progress) => {
        currentSyncStatus.current = progress.current
        currentSyncStatus.total   = progress.total
      })

      return reply.send({ message: 'Sincronização concluída com sucesso.', stats })
    } catch (err) {
      fastify.log.error(err)
      return reply.status(500).send({ error: 'Erro ao executar sincronização.', detail: err.message })
    } finally {
      currentSyncStatus.active = false
    }
  })

  // POST /api/admin/make-admin
  // Rota utilitária para promover uma loja/usuario a admin via ID
  fastify.post('/api/admin/make-admin', async (request, reply) => {
    const schema = z.object({ id: z.number() })
    const parse = schema.safeParse(request.body)
    
    if (!parse.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    const updated = await prisma.lojaCadastro.update({
      where: { id: parse.data.id },
      data: { is_admin: true },
    })

    return reply.send({ message: `Loja ${updated.nome_fantasia} agora é admin.` })
  })

  // ── GESTÃO DE USUÁRIOS ADMIN ────────────────────────────────────

  // GET /api/admin/users
  // Lista todos os administradores
  fastify.get('/api/admin/users', async (request, reply) => {
    const admins = await prisma.lojaCadastro.findMany({
      where: { is_admin: true, deletedAt: null },
      select: {
        id: true,
        nome_fantasia: true,
        email: true,
        cnpj: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(admins)
  })

  // POST /api/admin/users
  // Cria um novo administrador
  fastify.post('/api/admin/users', async (request, reply) => {
    const schema = z.object({
      nome: z.string().min(2),
      email: z.string().email(),
      senha: z.string().min(6),
    })

    const parse = schema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.flatten().fieldErrors })
    }

    const { nome, email, senha } = parse.data

    // Verifica se e-mail já existe
    const exists = await prisma.lojaCadastro.findUnique({ where: { email } })
    if (exists) {
      return reply.status(400).send({ error: 'Este e-mail já está em uso.' })
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const newUser = await prisma.lojaCadastro.create({
      data: {
        nome_fantasia: nome,
        razao_social: nome,
        email,
        senha_hash: senhaHash,
        is_admin: true,
        cnpj: '00000000000000', // CNPJ genérico para admins
      },
      select: { id: true, email: true, nome_fantasia: true }
    })

    return reply.send({ message: 'Administrador criado com sucesso.', user: newUser })
  })

  // DELETE /api/admin/users/:id
  // Remove um administrador (Protege o root admin)
  fastify.delete('/api/admin/users/:id', async (request, reply) => {
    const { id } = request.params
    const targetId = parseInt(id)

    const user = await prisma.lojaCadastro.findUnique({ where: { id: targetId } })
    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado.' })
    }

    // Proteção: Não permite deletar o root admin (email: admin@drogamais.com)
    if (user.email === 'admin@drogamais.com') {
      return reply.status(403).send({ error: 'O administrador principal não pode ser removido.' })
    }

    await prisma.lojaCadastro.delete({
      where: { id: targetId }
    })

    return reply.send({ message: 'Administrador removido com sucesso.' })
  })
}
