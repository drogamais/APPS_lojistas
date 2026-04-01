import { prisma } from '../lib/prisma.js'

export async function campanhasRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate)

  // ─── GET /api/campanhas ─────────────────────────────────────────────────
  // Retorna todas as campanhas com status = 1 (ativas)
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
  // Regra de segurança: o lojista só vê lojas da mesma categoria (cat).
  // 1. Busca o `cat` da loja logada via CNPJ do JWT.
  // 2. Busca todos os CNPJs que têm o mesmo `cat`.
  // 3. Retorna o ranking filtrado por esses CNPJs, ordenado por total_pontos DESC.
  fastify.get('/api/campanhas/:id/ranking', async (request, reply) => {
    const id_campanha = Number(request.params.id)
    const { cnpj } = request.user

    // Valida se a campanha existe e está ativa
    const campanha = await prisma.dimCampanha.findFirst({
      where: { id: id_campanha, status: 1 },
      select: { id: true, nome: true },
    })
    if (!campanha) return reply.status(404).send({ error: 'Campanha não encontrada.' })

    // Descobre o cat da loja logada (via CNPJ extraído do token JWT)
    const lojaLogada = await prisma.lojaCadastro.findFirst({
      where: { cnpj, deletedAt: null },
      select: { cat: true, nome_fantasia: true },
    })

    const catFiltro = lojaLogada?.cat ?? null

    // Busca os CNPJs de todas as lojas que têm o mesmo cat
    // Se cat for null, não há filtro de categoria (mostra todas)
    let cnpjsCategoria = null
    if (catFiltro) {
      const lojasMesmaCat = await prisma.lojaCadastro.findMany({
        where: { cat: catFiltro, deletedAt: null },
        select: { cnpj: true },
      })
      cnpjsCategoria = lojasMesmaCat.map(l => l.cnpj)
    }

    // Monta o filtro WHERE para o ranking
    const whereRanking = {
      id_campanha,
      ...(cnpjsCategoria ? { cnpj_loja: { in: cnpjsCategoria } } : {}),
    }

    const ranking = await prisma.silverRankingCampanhas.findMany({
      where: whereRanking,
      orderBy: { total_pontos: 'desc' },
    })

    // Adiciona campo `posicao` e identifica a loja logada
    const rankingComPosicao = ranking.map((row, i) => ({
      posicao: i + 1,
      nome_colaborador: row.nome_colaborador,
      cnpj_loja: row.cnpj_loja,
      total_pontos: row.total_pontos,
      RK_Grupo_Campanha: row.RK_Grupo_Campanha,
      ano_mes_referencia: row.ano_mes_referencia,
      e_minha_loja: row.cnpj_loja === cnpj,
    }))

    return reply.send({
      catFiltro,
      cnpjLogado: cnpj,
      ranking: rankingComPosicao,
    })
  })

  // ─── GET /api/campanhas/:id/vendas ──────────────────────────────────────
  // Retorna apenas as vendas da loja logada (CNPJ do JWT) na campanha.
  fastify.get('/api/campanhas/:id/vendas', async (request, reply) => {
    const id_campanha = Number(request.params.id)
    const { cnpj } = request.user

    const campanha = await prisma.dimCampanha.findFirst({
      where: { id: id_campanha, status: 1 },
      select: { id: true },
    })
    if (!campanha) return reply.status(404).send({ error: 'Campanha não encontrada.' })

    const vendas = await prisma.silverVendasCampanhas.findMany({
      where: {
        id_campanha,
        cnpj_loja: cnpj,
      },
      orderBy: { data_venda: 'desc' },
      select: {
        id_venda: true,
        data_venda: true,
        nome_colaborador: true,
        cargo_colaborador: true,
        GTIN: true,
        descricao_produto_campanha: true,
        qtd_de_produtos: true,
        pontos_campanha: true,
        valor_liquido_total: true,
        valor_bruto_total: true,
      },
    })

    return reply.send({ vendas })
  })

  // ─── GET /api/campanhas/:id/produtos ────────────────────────────────────
  // Retorna o catálogo de produtos pontuáveis da campanha.
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
