import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  senha: z.string().min(1, { message: 'Senha obrigatória.' }),
})

export async function authRoutes(fastify) {
  fastify.post('/api/auth/login', async (request, reply) => {
    // DEBUG: mostra exatamente o que chegou no body
    console.log('[auth/login] Content-Type:', request.headers['content-type'])
    console.log('[auth/login] Body recebido:', JSON.stringify(request.body))

    const parse = loginSchema.safeParse(request.body)
    if (!parse.success) {
      const errors = parse.error.flatten().fieldErrors
      console.error('[auth/login] Zod rejeitou:', JSON.stringify(errors))
      return reply.status(400).send({ error: errors })
    }

    const { email, senha } = parse.data

    const loja = await prisma.lojaCadastro.findFirst({
      where: { email, deletedAt: null },
      select: {
        id: true,
        nome_fantasia: true,
        cnpj: true,
        loja_numero: true,
        senha_hash: true,
        is_admin: true,
      },
    })

    if (!loja) {
      console.log('[auth/login] Loja nao encontrada para email:', email)
      return reply.status(401).send({ error: 'Credenciais inválidas.' })
    }

    const senhaValida = await bcrypt.compare(senha, loja.senha_hash)
    if (!senhaValida) {
      console.log('[auth/login] Senha invalida para loja:', loja.id)
      return reply.status(401).send({ error: 'Credenciais inválidas.' })
    }

    const token = fastify.jwt.sign(
      {
        loja_id: loja.id,
        nome_fantasia: loja.nome_fantasia,
        cnpj: loja.cnpj,
        loja_numero: loja.loja_numero,
        is_admin: loja.is_admin,
      },
      { expiresIn: '8h' },
    )

    console.log('[auth/login] Login OK para loja:', loja.id)
    return reply.send({ token })
  })
}
