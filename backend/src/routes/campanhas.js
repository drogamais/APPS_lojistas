import { prisma } from '../lib/prisma.js'

// ─── Dados das Campanhas ───────────────────────────────────────────────────
const CAMPANHAS = [
  { id: 1, nome: 'Kenvue em Foco',          corPrimaria: '#16a34a', periodo: 'Jan–Jun 2026' },
  { id: 2, nome: 'Eurofarma em Foco',        corPrimaria: '#0369a1', periodo: 'Jan–Jun 2026' },
  { id: 3, nome: 'Campanha Verão Saudável',  corPrimaria: '#e8001c', periodo: 'Jan–Mar 2026' },
]

// ─── Ranking Mockado ───────────────────────────────────────────────────────
// TODO (produção): substituir por query real filtrando por `cat` da loja logada
// WHERE fat_loja_cadastro.cat = catFiltro
const BASE_RANKING = [
  { posicao: 1,  loja_numero: 'L07', nome_fantasia: 'Drogamais Centro',          pontuacao: 9840, variacao:  3 },
  { posicao: 2,  loja_numero: 'L03', nome_fantasia: 'Drogamais Norte',            pontuacao: 8720, variacao:  0 },
  { posicao: 3,  loja_numero: 'L11', nome_fantasia: 'Drogamais Sul Shopping',     pontuacao: 8310, variacao: -1 },
  { posicao: 4,  loja_numero: 'L01', nome_fantasia: 'Drogamais Matriz',           pontuacao: 7640, variacao:  2 },
  { posicao: 5,  loja_numero: 'L09', nome_fantasia: 'Drogamais Leste',            pontuacao: 6890, variacao: -2 },
  { posicao: 6,  loja_numero: 'L14', nome_fantasia: 'Drogamais Parque Verde',     pontuacao: 6310, variacao:  1 },
  { posicao: 7,  loja_numero: 'L05', nome_fantasia: 'Drogamais Oeste',            pontuacao: 5880, variacao:  0 },
  { posicao: 8,  loja_numero: 'L12', nome_fantasia: 'Drogamais Vila Nova',        pontuacao: 5220, variacao: -1 },
  { posicao: 9,  loja_numero: 'L08', nome_fantasia: 'Drogamais Jardins',          pontuacao: 4760, variacao:  3 },
  { posicao: 10, loja_numero: 'L02', nome_fantasia: 'Drogamais Bela Vista',       pontuacao: 4190, variacao:  0 },
  { posicao: 11, loja_numero: 'L15', nome_fantasia: 'Drogamais Alto da Serra',    pontuacao: 3540, variacao: -3 },
  { posicao: 12, loja_numero: 'L06', nome_fantasia: 'Drogamais Avenida Central',  pontuacao: 2980, variacao:  1 },
  { posicao: 13, loja_numero: 'L10', nome_fantasia: 'Drogamais Rio Comprido',     pontuacao: 2310, variacao:  0 },
  { posicao: 14, loja_numero: 'L04', nome_fantasia: 'Drogamais Campo Alegre',     pontuacao: 1750, variacao: -1 },
  { posicao: 15, loja_numero: 'L13', nome_fantasia: 'Drogamais Pinheiros',        pontuacao: 1200, variacao:  2 },
]

// Campanha 2 e 3 usam o mesmo ranking com offset de pontos para parecer distinto
const RANKING = {
  1: BASE_RANKING,
  2: BASE_RANKING.map(r => ({ ...r, pontuacao: Math.round(r.pontuacao * 0.87) })),
  3: BASE_RANKING.map(r => ({ ...r, pontuacao: Math.round(r.pontuacao * 1.13) })),
}

// ─── Vendas Mockadas ───────────────────────────────────────────────────────
const BASE_VENDAS = [
  { mes: 'Janeiro',   lojaNumero: 'L07', nomeFantasia: 'Drogamais Centro',      totalVendas: 48320.50, qtdTransacoes: 1240, ticketMedio: 38.97 },
  { mes: 'Janeiro',   lojaNumero: 'L03', nomeFantasia: 'Drogamais Norte',        totalVendas: 43100.00, qtdTransacoes: 1100, ticketMedio: 39.18 },
  { mes: 'Janeiro',   lojaNumero: 'L11', nomeFantasia: 'Drogamais Sul Shopping', totalVendas: 41850.75, qtdTransacoes: 1050, ticketMedio: 39.86 },
  { mes: 'Janeiro',   lojaNumero: 'L01', nomeFantasia: 'Drogamais Matriz',       totalVendas: 39600.00, qtdTransacoes:  980, ticketMedio: 40.41 },
  { mes: 'Fevereiro', lojaNumero: 'L07', nomeFantasia: 'Drogamais Centro',       totalVendas: 51200.00, qtdTransacoes: 1310, ticketMedio: 39.08 },
  { mes: 'Fevereiro', lojaNumero: 'L03', nomeFantasia: 'Drogamais Norte',        totalVendas: 44900.50, qtdTransacoes: 1140, ticketMedio: 39.39 },
  { mes: 'Fevereiro', lojaNumero: 'L11', nomeFantasia: 'Drogamais Sul Shopping', totalVendas: 43200.00, qtdTransacoes: 1080, ticketMedio: 40.00 },
  { mes: 'Fevereiro', lojaNumero: 'L01', nomeFantasia: 'Drogamais Matriz',       totalVendas: 40100.25, qtdTransacoes: 1010, ticketMedio: 39.70 },
  { mes: 'Março',     lojaNumero: 'L07', nomeFantasia: 'Drogamais Centro',       totalVendas: 55780.00, qtdTransacoes: 1420, ticketMedio: 39.28 },
  { mes: 'Março',     lojaNumero: 'L03', nomeFantasia: 'Drogamais Norte',        totalVendas: 47650.00, qtdTransacoes: 1210, ticketMedio: 39.38 },
  { mes: 'Março',     lojaNumero: 'L11', nomeFantasia: 'Drogamais Sul Shopping', totalVendas: 46100.50, qtdTransacoes: 1160, ticketMedio: 39.74 },
  { mes: 'Março',     lojaNumero: 'L01', nomeFantasia: 'Drogamais Matriz',       totalVendas: 42800.00, qtdTransacoes: 1070, ticketMedio: 40.00 },
]

const VENDAS = {
  1: BASE_VENDAS,
  2: BASE_VENDAS.map(v => ({ ...v, totalVendas: +(v.totalVendas * 0.92).toFixed(2), qtdTransacoes: Math.round(v.qtdTransacoes * 0.92), ticketMedio: +(v.totalVendas * 0.92 / Math.round(v.qtdTransacoes * 0.92)).toFixed(2) })),
  3: BASE_VENDAS.map(v => ({ ...v, totalVendas: +(v.totalVendas * 1.08).toFixed(2), qtdTransacoes: Math.round(v.qtdTransacoes * 1.08), ticketMedio: +(v.totalVendas * 1.08 / Math.round(v.qtdTransacoes * 1.08)).toFixed(2) })),
}

// ─── Produtos Mockados ─────────────────────────────────────────────────────
const BASE_PRODUTOS = [
  { ean: '7891058001234', descricao: 'Tylenol 750mg c/20 Comp',          categoria: 'Analgésicos',      pontosUnitario: 20, qtdVendida:  980, totalPontos: 19600 },
  { ean: '7896004401234', descricao: 'Neutrogena Hidratante FPS30 200ml', categoria: 'Dermocosméticos', pontosUnitario: 35, qtdVendida:  620, totalPontos: 21700 },
  { ean: '7891058002345', descricao: 'Sundown FPS60 Corporal 200ml',      categoria: 'Dermocosméticos', pontosUnitario: 30, qtdVendida:  740, totalPontos: 22200 },
  { ean: '7896523401122', descricao: 'Listerine Cool Mint 500ml',         categoria: 'Higiene Bucal',   pontosUnitario: 15, qtdVendida: 1050, totalPontos: 15750 },
  { ean: '7891058003456', descricao: 'Dipirona Sódica 500mg c/20 Comp',   categoria: 'Genéricos',       pontosUnitario:  8, qtdVendida: 1840, totalPontos: 14720 },
  { ean: '7891234567890', descricao: 'Engov After 4 Comp',                categoria: 'Medicamentos',    pontosUnitario: 15, qtdVendida:  820, totalPontos: 12300 },
  { ean: '7896523402233', descricao: 'Band-Aid Transparente c/10',        categoria: 'Curativos',       pontosUnitario: 10, qtdVendida: 1120, totalPontos: 11200 },
  { ean: '7891058004567', descricao: 'Ácido Fólico 400mcg c/30 Comp',     categoria: 'Suplementos',     pontosUnitario: 12, qtdVendida:  790, totalPontos:  9480 },
  { ean: '7895467801230', descricao: 'Omeprazol 20mg c/28 Cáps',          categoria: 'Genéricos',       pontosUnitario: 10, qtdVendida:  870, totalPontos:  8700 },
  { ean: '7896004405678', descricao: 'Clean & Clear Adstringente 200ml',  categoria: 'Dermocosméticos', pontosUnitario: 18, qtdVendida:  450, totalPontos:  8100 },
]

const PRODUTOS = {
  1: BASE_PRODUTOS,
  2: BASE_PRODUTOS.map(p => ({ ...p, qtdVendida: Math.round(p.qtdVendida * 0.9), totalPontos: Math.round(p.qtdVendida * 0.9) * p.pontosUnitario })),
  3: BASE_PRODUTOS.map(p => ({ ...p, qtdVendida: Math.round(p.qtdVendida * 1.1), totalPontos: Math.round(p.qtdVendida * 1.1) * p.pontosUnitario })),
}

// ─── Rotas ─────────────────────────────────────────────────────────────────
export async function campanhasRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate)

  // GET /api/campanhas — lista de campanhas ativas
  fastify.get('/api/campanhas', async (request, reply) => {
    return reply.send({ campanhas: CAMPANHAS })
  })

  // GET /api/campanhas/:id/ranking — ranking filtrado pela categoria da loja logada
  fastify.get('/api/campanhas/:id/ranking', async (request, reply) => {
    const id = Number(request.params.id)
    const campanha = CAMPANHAS.find(c => c.id === id)
    if (!campanha) return reply.status(404).send({ error: 'Campanha não encontrada.' })

    // Busca a categoria da loja logada para filtrar o ranking por cat
    // TODO (produção): usar catFiltro no WHERE da query de ranking real
    const loja = await prisma.lojaCadastro.findFirst({
      where: { id: request.user.loja_id, deletedAt: null },
      select: { cat: true, loja_numero: true },
    })

    const catFiltro = loja?.cat ?? null

    return reply.send({
      catFiltro,
      lojaAtualNumero: loja?.loja_numero ?? null,
      ranking: RANKING[id],
    })
  })

  // GET /api/campanhas/:id/vendas — vendas gerais da campanha
  fastify.get('/api/campanhas/:id/vendas', async (request, reply) => {
    const id = Number(request.params.id)
    if (!CAMPANHAS.find(c => c.id === id))
      return reply.status(404).send({ error: 'Campanha não encontrada.' })
    return reply.send({ vendas: VENDAS[id] })
  })

  // GET /api/campanhas/:id/produtos — pontuação por produto na campanha
  fastify.get('/api/campanhas/:id/produtos', async (request, reply) => {
    const id = Number(request.params.id)
    if (!CAMPANHAS.find(c => c.id === id))
      return reply.status(404).send({ error: 'Campanha não encontrada.' })
    return reply.send({ produtos: PRODUTOS[id] })
  })
}
