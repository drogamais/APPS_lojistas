import { prisma } from '../lib/prisma.js'
import { Prisma } from '@prisma/client'

export async function campanhasRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate)

  // ─── GET /api/campanhas ─────────────────────────────────────────────────
  fastify.get('/api/campanhas', async (request, reply) => {
    const campanhas = await prisma.dimCampanha.findMany({
      where: { status: 1 },
      orderBy: { data_inicio: 'desc' },
      select: {
        id: true,
        nome: true,
        data_inicio: true,
        data_fim: true,
        status: true,
        parceiro_id: true,
      },
    })
    return reply.send({ campanhas })
  })

  // ─── GET /api/campanhas/:id/ranking ─────────────────────────────────────
  // Star schema: LEFT JOIN com fat_loja_cadastro para trazer nome_fantasia e loja_completo.
  // Segurança multi-tenant: filtra pelo CAT da loja logada.
  fastify.get('/api/campanhas/:id/ranking', async (request, reply) => {
    const id_campanha = Number(request.params.id)
    const { cnpj } = request.user

    const campanha = await prisma.dimCampanha.findFirst({
      where: { id: id_campanha, status: 1 },
      select: { id: true },
    })
    if (!campanha) return reply.status(404).send({ error: 'Campanha não encontrada.' })

    // Descobre o cat da loja logada
    const lojaLogada = await prisma.lojaCadastro.findFirst({
      where: { cnpj, deletedAt: null },
      select: { cat: true },
    })
    const catFiltro = lojaLogada?.cat ?? null

    // Coleta CNPJs da mesma categoria, se houver
    let cnpjsCategoria = null
    if (catFiltro) {
      const lojasMesmaCat = await prisma.lojaCadastro.findMany({
        where: { cat: catFiltro, deletedAt: null },
        select: { cnpj: true },
      })
      cnpjsCategoria = lojasMesmaCat.map(l => l.cnpj)
    }

    // Query raw com LEFT JOIN (star schema) para enriquecer com nome_fantasia e loja_completo
    const whereCategoria = cnpjsCategoria
      ? Prisma.sql`AND r.cnpj_loja IN (${Prisma.join(cnpjsCategoria)})`
      : Prisma.empty

    const ranking = await prisma.$queryRaw`
      SELECT
        r.id_campanha,
        r.nome_colaborador,
        r.cnpj_loja,
        r.total_pontos,
        r.RK_Grupo_Campanha,
        r.ano_mes_referencia,
        l.nome_fantasia,
        l.loja_completo
      FROM silver_ranking_campanhas r
      LEFT JOIN fat_loja_cadastro l
        ON l.cnpj = r.cnpj_loja AND l.deletedAt IS NULL
      WHERE r.id_campanha = ${id_campanha}
      ${whereCategoria}
      ORDER BY r.total_pontos DESC
    `

    const rankingComPosicao = ranking.map((row, i) => ({
      posicao:           i + 1,
      nome_colaborador:  row.nome_colaborador,
      cnpj_loja:         row.cnpj_loja,
      nome_fantasia:     row.nome_fantasia     ?? null,
      loja_completo:     row.loja_completo     ?? null,
      total_pontos:      row.total_pontos,
      RK_Grupo_Campanha: row.RK_Grupo_Campanha,
      ano_mes_referencia:row.ano_mes_referencia,
      e_minha_loja:      row.cnpj_loja === cnpj,
    }))

    return reply.send({ catFiltro, cnpjLogado: cnpj, ranking: rankingComPosicao })
  })

  // ─── GET /api/campanhas/:id/vendas ──────────────────────────────────────
  // Star schema: LEFT JOIN com fat_loja_cadastro para trazer nome_fantasia e loja_completo.
  // Filtrado pelo CNPJ do lojista logado (multi-tenant).
  fastify.get('/api/campanhas/:id/vendas', async (request, reply) => {
    const id_campanha = Number(request.params.id)
    const { cnpj } = request.user

    const campanha = await prisma.dimCampanha.findFirst({
      where: { id: id_campanha, status: 1 },
      select: { id: true },
    })
    if (!campanha) return reply.status(404).send({ error: 'Campanha não encontrada.' })

    const vendas = await prisma.$queryRaw`
      SELECT
        v.id_venda,
        v.data_venda,
        v.nome_colaborador,
        v.descricao_produto_campanha,
        v.qtd_de_produtos,
        v.pontos_campanha,
        l.nome_fantasia,
        l.loja_completo
      FROM silver_vendas_campanhas v
      LEFT JOIN fat_loja_cadastro l
        ON l.cnpj = v.cnpj_loja AND l.deletedAt IS NULL
      WHERE v.id_campanha = ${id_campanha}
        AND v.cnpj_loja = ${cnpj}
      ORDER BY v.data_venda DESC
    `

    return reply.send({ vendas })
  })

  // ─── GET /api/campanhas/:id/produtos ────────────────────────────────────
  fastify.get('/api/campanhas/:id/produtos', async (request, reply) => {
    const campanha_id = Number(request.params.id)

    const campanha = await prisma.dimCampanha.findFirst({
      where: { id: campanha_id, status: 1 },
      select: { id: true },
    })
    if (!campanha) return reply.status(404).send({ error: 'Campanha não encontrada.' })

    const produtos = await prisma.dimCampanhaProduto.findMany({
      where: { campanha_id },
      orderBy: { pontuacao: 'desc' },
      select: {
        id: true,
        codigo_barras: true,
        codigo_barras_normalizado: true,
        descricao: true,
        pontuacao: true,
        preco_normal: true,
        preco_desconto: true,
        rebaixe: true,
        qtd_limite: true,
      },
    })

    return reply.send({ produtos })
  })
}
