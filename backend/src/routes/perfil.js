import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

// Apenas campos seguros — id, cnpj, email e senha_hash são bloqueados por design
const perfilUpdateSchema = z.object({
  nome_fantasia:        z.string().min(2).optional(),
  razao_social:         z.string().min(2).optional(),
  telefone:             z.string().max(20).optional(),
  whatsapp:             z.string().max(20).optional(),
  instagram:            z.string().max(100).optional(),
  facebook:             z.string().max(100).optional(),
  area_loja:            z.number().optional(),
  vagas_estacionamento: z.number().int().optional(),
  google_email:         z.string().email().max(255).optional().nullable(),

  // Endereço
  end_rua:         z.string().max(255).optional(),
  end_numero:      z.string().max(20).optional(),
  end_bairro:      z.string().max(100).optional(),
  end_cidade:      z.string().max(100).optional(),
  end_uf:          z.string().max(2).optional(),
  end_cep:         z.string().max(9).optional(),
  end_complemento: z.string().max(100).optional(),

  // Horários (Abertura/Fechamento)
  seg_abre:  z.string().max(5).nullable().optional(),
  seg_fecha: z.string().max(5).nullable().optional(),
  ter_abre:  z.string().max(5).nullable().optional(),
  ter_fecha: z.string().max(5).nullable().optional(),
  qua_abre:  z.string().max(5).nullable().optional(),
  qua_fecha: z.string().max(5).nullable().optional(),
  qui_abre:  z.string().max(5).nullable().optional(),
  qui_fecha: z.string().max(5).nullable().optional(),
  sex_abre:  z.string().max(5).nullable().optional(),
  sex_fecha: z.string().max(5).nullable().optional(),
  sab_abre:  z.string().max(5).nullable().optional(),
  sab_fecha: z.string().max(5).nullable().optional(),
  dom_abre:  z.string().max(5).nullable().optional(),
  dom_fecha: z.string().max(5).nullable().optional(),
  loja_id:   z.number().optional(),
}).superRefine((data, ctx) => {
  const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  dias.forEach(dia => {
    const abre = data[`${dia}_abre`];
    const fecha = data[`${dia}_fecha`];
    
    // Se ambos foram enviados e não são nulos
    if (abre && fecha) {
      if (fecha <= abre) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Horário de fechamento (${fecha}) não pode ser menor ou igual ao de abertura (${abre}) na ${dia}.`,
          path: [`${dia}_fecha`]
        });
      }
    }
  });
})

// Colunas retornadas ao lojista — nunca expõe senha_hash
const SAFE_SELECT = {
  id:                   true,
  cnpj:                 true,
  loja_numero:          true,
  nome_fantasia:        true,
  razao_social:         true,
  email:                true,
  telefone:             true,
  whatsapp:             true,
  instagram:            true,
  facebook:             true,
  area_loja:            true,
  vagas_estacionamento: true,
  end_rua:         true,
  end_numero:      true,
  end_bairro:      true,
  end_cidade:      true,
  end_uf:          true,
  end_cep:         true,
  end_complemento: true,
  seg_abre:  true,
  seg_fecha: true,
  ter_abre:  true,
  ter_fecha: true,
  qua_abre:  true,
  qua_fecha: true,
  qui_abre:  true,
  qui_fecha: true,
  sex_abre:  true,
  sex_fecha: true,
  sab_abre:  true,
  sab_fecha: true,
  dom_abre:  true,
  dom_fecha: true,
  google_email:         true,
  createdAt:            true,
  updatedAt:            true,
}

export async function perfilRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate)

  // GET /api/loja/perfil
  fastify.get('/api/loja/perfil', async (request, reply) => {
    const { loja_id: user_loja_id, is_admin } = request.user
    const target_loja_id = (is_admin && request.query.loja_id) ? parseInt(request.query.loja_id) : user_loja_id

    const loja = await prisma.lojaCadastro.findFirst({
      where: { id: target_loja_id, deletedAt: null },
      select: SAFE_SELECT,
    })

    if (!loja) {
      return reply.status(404).send({ error: 'Loja não encontrada.' })
    }

    return reply.send(loja)
  })

  // PUT /api/loja/perfil
  fastify.put('/api/loja/perfil', async (request, reply) => {
    const { loja_id: user_loja_id, is_admin } = request.user
    const target_loja_id = (is_admin && request.body.loja_id) ? parseInt(request.body.loja_id) : user_loja_id

    const parse = perfilUpdateSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.flatten().fieldErrors })
    }

    // Remove loja_id do corpo para não tentar atualizar o ID no banco
    const { loja_id, ...updateData } = parse.data

    // Garante existência antes de atualizar e verifica se é o admin principal
    const target = await prisma.lojaCadastro.findFirst({
      where: { id: target_loja_id, deletedAt: null },
      select: { id: true, email: true },
    })

    if (!target) {
      return reply.status(404).send({ error: 'Loja não encontrada.' })
    }

    // Proteção: Apenas o próprio admin principal (ou ninguém, dependendo da regra) pode editá-lo.
    // Aqui vamos bloquear qualquer edição no admin@drogamais.com via esta rota se não for ele mesmo.
    if (target.email === 'admin@drogamais.com' && request.user.email !== 'admin@drogamais.com') {
      return reply.status(403).send({ error: 'Não é permitido editar o administrador principal.' })
    }

    const lojaResult = await prisma.lojaCadastro.update({
      where: { id: target_loja_id },
      data: updateData,
      select: SAFE_SELECT,
    })

    return reply.send(lojaResult)
  })
}
