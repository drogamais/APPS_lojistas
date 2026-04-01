import mysql from 'mysql2/promise'
import { prisma } from './prisma.js'

// ─── Conexão com o banco de dados externo (mesmo host do sync de lojas) ───
async function criarConexao() {
  return mysql.createConnection({
    host:     process.env.DB_SYNC_HOST,
    port:     parseInt(process.env.DB_SYNC_PORT || '3306'),
    user:     process.env.DB_SYNC_USER,
    password: process.env.DB_SYNC_PASS,
    charset:  'utf8mb4',
  })
}

// ─── Sync: dim_campanha ────────────────────────────────────────────────────
async function syncDimCampanha(db) {
  const [rows] = await db.query(`
    SELECT id, nome, data_inicio, data_fim, status, data_atualizacao, parceiro_id
    FROM drogamais.dim_campanha
  `)

  let upserted = 0
  for (const row of rows) {
    await prisma.dimCampanha.upsert({
      where: { id: row.id },
      update: {
        nome:             row.nome             ?? null,
        data_inicio:      row.data_inicio       ? new Date(row.data_inicio)      : null,
        data_fim:         row.data_fim          ? new Date(row.data_fim)         : null,
        status:           row.status            ?? 0,
        data_atualizacao: row.data_atualizacao  ? new Date(row.data_atualizacao) : null,
        parceiro_id:      row.parceiro_id       ?? null,
      },
      create: {
        id:               row.id,
        nome:             row.nome             ?? null,
        data_inicio:      row.data_inicio       ? new Date(row.data_inicio)      : null,
        data_fim:         row.data_fim          ? new Date(row.data_fim)         : null,
        status:           row.status            ?? 0,
        data_atualizacao: row.data_atualizacao  ? new Date(row.data_atualizacao) : null,
        parceiro_id:      row.parceiro_id       ?? null,
      },
    })
    upserted++
  }
  return { tabela: 'dim_campanha', total: rows.length, upserted }
}

// ─── Sync: dim_campanha_produto ────────────────────────────────────────────
async function syncDimCampanhaProduto(db) {
  const [rows] = await db.query(`
    SELECT
      id, campanha_id, codigo_barras, codigo_barras_normalizado,
      codigo_interno, descricao, pontuacao, preco_normal,
      preco_desconto, rebaixe, qtd_limite, data_atualizacao
    FROM drogamais.dim_campanha_produto
  `)

  let upserted = 0
  for (const row of rows) {
    await prisma.dimCampanhaProduto.upsert({
      where: { id: row.id },
      update: {
        campanha_id:               row.campanha_id               ?? null,
        codigo_barras:             row.codigo_barras             ?? null,
        codigo_barras_normalizado: row.codigo_barras_normalizado ?? null,
        codigo_interno:            row.codigo_interno            ?? null,
        descricao:                 row.descricao                 ?? null,
        pontuacao:                 row.pontuacao                 ?? null,
        preco_normal:              row.preco_normal              ?? null,
        preco_desconto:            row.preco_desconto            ?? null,
        rebaixe:                   row.rebaixe                   ?? null,
        qtd_limite:                row.qtd_limite                ?? null,
        data_atualizacao:          row.data_atualizacao ? new Date(row.data_atualizacao) : null,
      },
      create: {
        id:                        row.id,
        campanha_id:               row.campanha_id               ?? null,
        codigo_barras:             row.codigo_barras             ?? null,
        codigo_barras_normalizado: row.codigo_barras_normalizado ?? null,
        codigo_interno:            row.codigo_interno            ?? null,
        descricao:                 row.descricao                 ?? null,
        pontuacao:                 row.pontuacao                 ?? null,
        preco_normal:              row.preco_normal              ?? null,
        preco_desconto:            row.preco_desconto            ?? null,
        rebaixe:                   row.rebaixe                   ?? null,
        qtd_limite:                row.qtd_limite                ?? null,
        data_atualizacao:          row.data_atualizacao ? new Date(row.data_atualizacao) : null,
      },
    })
    upserted++
  }
  return { tabela: 'dim_campanha_produto', total: rows.length, upserted }
}

// ─── Sync: silver_vendas_campanhas ────────────────────────────────────────
async function syncSilverVendas(db) {
  const [rows] = await db.query(`
    SELECT
      id_venda, cnpj_loja, razao_social_loja, cargo_colaborador,
      nome_colaborador, cpf_colaborador, cnpj_fabricante, razao_social_fabricante,
      nome_fantasia_fabricante, codigo_interno_produto, GTIN,
      codigo_de_barras_normalizado_produto, tipo_de_nota, tipo_de_operacao,
      tipo_de_pagamento, qtd_clientes_atendidos, cmv_unitario, cmv_total,
      desconto_total, qtd_de_produtos, valor_bruto_total, valor_bruto_unitario,
      valor_liquido_total, valor_liquido_unitario, data_venda, id_campanha,
      cod_interno_campanha, gtin_campanha, descricao_produto_campanha,
      pontos_campanha, nome_campanha, preco_normal_campanha,
      preco_desconto_geral_campanha, rebaixe_campanha,
      data_inicio_campanha, data_fim_campanha, status_campanha, data_atualizacao
    FROM dbDrogamais.silver_vendas_campanhas
  `)

  await prisma.silverVendasCampanhas.deleteMany({})
  await prisma.silverVendasCampanhas.createMany({
    data: rows.map(row => ({
      id_venda:                             row.id_venda,
      cnpj_loja:                            row.cnpj_loja                            ?? null,
      razao_social_loja:                    row.razao_social_loja                    ?? null,
      cargo_colaborador:                    row.cargo_colaborador                    ?? null,
      nome_colaborador:                     row.nome_colaborador                     ?? null,
      cpf_colaborador:                      row.cpf_colaborador                      ?? null,
      cnpj_fabricante:                      row.cnpj_fabricante                      ?? null,
      razao_social_fabricante:              row.razao_social_fabricante              ?? null,
      nome_fantasia_fabricante:             row.nome_fantasia_fabricante             ?? null,
      codigo_interno_produto:               row.codigo_interno_produto               ?? null,
      GTIN:                                 row.GTIN                                 ?? null,
      codigo_de_barras_normalizado_produto: row.codigo_de_barras_normalizado_produto ?? null,
      tipo_de_nota:                         row.tipo_de_nota                         ?? null,
      tipo_de_operacao:                     row.tipo_de_operacao                     ?? null,
      tipo_de_pagamento:                    row.tipo_de_pagamento                    ?? null,
      qtd_clientes_atendidos:               row.qtd_clientes_atendidos               ?? null,
      cmv_unitario:                         row.cmv_unitario                         ?? null,
      cmv_total:                            row.cmv_total                            ?? null,
      desconto_total:                       row.desconto_total                       ?? null,
      qtd_de_produtos:                      row.qtd_de_produtos                      ?? null,
      valor_bruto_total:                    row.valor_bruto_total                    ?? null,
      valor_bruto_unitario:                 row.valor_bruto_unitario                 ?? null,
      valor_liquido_total:                  row.valor_liquido_total                  ?? null,
      valor_liquido_unitario:               row.valor_liquido_unitario               ?? null,
      data_venda:                           row.data_venda     ? new Date(row.data_venda) : null,
      id_campanha:                          row.id_campanha                          ?? null,
      cod_interno_campanha:                 row.cod_interno_campanha                 ?? null,
      gtin_campanha:                        row.gtin_campanha                        ?? null,
      descricao_produto_campanha:           row.descricao_produto_campanha           ?? null,
      pontos_campanha:                      row.pontos_campanha                      ?? null,
      nome_campanha:                        row.nome_campanha                        ?? null,
      preco_normal_campanha:                row.preco_normal_campanha                ?? null,
      preco_desconto_geral_campanha:        row.preco_desconto_geral_campanha        ?? null,
      rebaixe_campanha:                     row.rebaixe_campanha                     ?? null,
      data_inicio_campanha:                 row.data_inicio_campanha ? new Date(row.data_inicio_campanha) : null,
      data_fim_campanha:                    row.data_fim_campanha    ? new Date(row.data_fim_campanha)    : null,
      status_campanha:                      row.status_campanha                      ?? null,
      data_atualizacao:                     row.data_atualizacao ? new Date(row.data_atualizacao) : null,
    })),
    skipDuplicates: true,
  })

  return { tabela: 'silver_vendas_campanhas', total: rows.length, upserted: rows.length }
}

// ─── Sync: silver_ranking_campanhas ───────────────────────────────────────
async function syncSilverRanking(db) {
  const [rows] = await db.query(`
    SELECT
      id_campanha, nome_colaborador, cnpj_loja, nome_campanha,
      id_grupo_historico, total_pontos, RK_Grupo_Campanha,
      data_fim_campanha, data_ultima_atualizacao, ano_mes_referencia
    FROM dbDrogamais.silver_ranking_campanhas
  `)

  await prisma.silverRankingCampanhas.deleteMany({})
  await prisma.silverRankingCampanhas.createMany({
    data: rows.map(row => ({
      id_campanha:            row.id_campanha,
      nome_colaborador:       row.nome_colaborador,
      cnpj_loja:              row.cnpj_loja,
      ano_mes_referencia:     row.ano_mes_referencia,
      nome_campanha:          row.nome_campanha          ?? null,
      id_grupo_historico:     row.id_grupo_historico     ?? null,
      total_pontos:           row.total_pontos           ?? null,
      RK_Grupo_Campanha:      row.RK_Grupo_Campanha      ?? null,
      data_fim_campanha:      row.data_fim_campanha      ? new Date(row.data_fim_campanha)      : null,
      data_ultima_atualizacao: row.data_ultima_atualizacao ? new Date(row.data_ultima_atualizacao) : null,
    })),
    skipDuplicates: true,
  })

  return { tabela: 'silver_ranking_campanhas', total: rows.length, upserted: rows.length }
}

// ─── Entry point ──────────────────────────────────────────────────────────
// onProgress({ step, stepTotal, stepLabel }) — chamado a cada tabela concluída
export async function runSyncCampanhas(onProgress) {
  const db = await criarConexao()

  const etapas = [
    { label: 'dim_campanha',             fn: syncDimCampanha        },
    { label: 'dim_campanha_produto',     fn: syncDimCampanhaProduto },
    { label: 'silver_vendas_campanhas',  fn: syncSilverVendas       },
    { label: 'silver_ranking_campanhas', fn: syncSilverRanking      },
  ]

  const resultados = []
  try {
    for (let i = 0; i < etapas.length; i++) {
      const etapa = etapas[i]
      if (onProgress) onProgress({ step: i + 1, stepTotal: etapas.length, stepLabel: etapa.label })
      const resultado = await etapa.fn(db)
      resultados.push(resultado)
    }
  } finally {
    await db.end()
  }

  return resultados
}
