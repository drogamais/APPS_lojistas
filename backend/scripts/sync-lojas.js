// scripts/sync-lojas.js
// Sincroniza drogamais.dim_lojas → dbLojista.fat_loja_cadastro
// Mesmo servidor MariaDB, mesmas credenciais — conexão única cross-database.
//
// Uso dentro do container:
//   docker exec drogamais_backend node scripts/sync-lojas.js

import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

function normalizeCep(raw) {
  if (!raw) return null
  return raw.replace(/\D/g, '').slice(0, 9) || null
}

function buildRawPassword(row) {
  const id  = row.pec_id_convenio ?? ''
  const cod = row.pec_cod_acesso  ?? ''
  if (!id && !cod) return null
  return `Drog#${id}${cod}`
}

async function syncLojas() {
  const db = await mysql.createConnection({
    host:     process.env.DB_SYNC_HOST,
    port:     parseInt(process.env.DB_SYNC_PORT || '3306'),
    user:     process.env.DB_SYNC_USER,
    password: process.env.DB_SYNC_PASS,
    charset:  'utf8mb4',
    // sem "database" — usamos notação database.tabela nas queries
  })

  console.log('✅ Conectado ao MariaDB.')

  try {
    const [lojas] = await db.query(`
      SELECT
        cnpj_s, loja_numero, fantasia, razao_social, email,
        telefone_fixo, celular, end_bairro, cep, cidade,
        end_complemento, end_numero, logradouro,
        pec_id_convenio, pec_cod_acesso
      FROM drogamais.dim_lojas
      WHERE cnpj_s IS NOT NULL
        AND cnpj_s <> ''
        AND ativo = b'1'
    `)

    console.log(`📦 ${lojas.length} lojas encontradas na origem.\n`)

    let inserted = 0
    let updated  = 0
    let skipped  = 0

    for (const loja of lojas) {
      const cnpj = loja.cnpj_s?.trim()
      if (!cnpj) { skipped++; continue }

      const [existing] = await db.query(
        'SELECT id FROM dbLojista.fat_loja_cadastro WHERE cnpj = ? AND deletedAt IS NULL LIMIT 1',
        [cnpj]
      )

      const now         = new Date()
      const rawPassword = buildRawPassword(loja)

      if (existing.length === 0) {
        // ── INSERT ────────────────────────────────────────────────────────
        if (!rawPassword) {
          console.warn(`⚠️  CNPJ ${cnpj} sem PEC — ignorado no INSERT (sem como gerar senha).`)
          skipped++
          continue
        }

        const senhaHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS)

        await db.query(`
          INSERT INTO dbLojista.fat_loja_cadastro
            (cnpj, loja_numero, nome_fantasia, razao_social, email,
             senha_hash, telefone, whatsapp,
             end_bairro, end_cep, end_cidade, end_complemento, end_numero, end_rua,
             createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          cnpj,
          loja.loja_numero     ?? null,
          loja.fantasia        ?? '',
          loja.razao_social    ?? '',
          loja.email           ?? '',
          senhaHash,
          loja.telefone_fixo   ?? null,
          loja.celular         ?? null,
          loja.end_bairro      ?? null,
          normalizeCep(loja.cep),
          loja.cidade          ?? null,
          loja.end_complemento ?? null,
          loja.end_numero      ?? null,
          loja.logradouro      ?? null,
          now,
          now,
        ])

        inserted++
        console.log(`  ➕ INSERT  CNPJ ${cnpj} — ${loja.fantasia}`)

      } else {
        // ── UPDATE ────────────────────────────────────────────────────────
        if (rawPassword) {
          const senhaHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS)

          await db.query(`
            UPDATE dbLojista.fat_loja_cadastro SET
              loja_numero     = ?,
              nome_fantasia   = ?,
              razao_social    = ?,
              email           = ?,
              senha_hash      = ?,
              telefone        = ?,
              whatsapp        = ?,
              end_bairro      = ?,
              end_cep         = ?,
              end_cidade      = ?,
              end_complemento = ?,
              end_numero      = ?,
              end_rua         = ?,
              updatedAt       = ?
            WHERE cnpj = ? AND deletedAt IS NULL
          `, [
            loja.loja_numero     ?? null,
            loja.fantasia        ?? '',
            loja.razao_social    ?? '',
            loja.email           ?? '',
            senhaHash,
            loja.telefone_fixo   ?? null,
            loja.celular         ?? null,
            loja.end_bairro      ?? null,
            normalizeCep(loja.cep),
            loja.cidade          ?? null,
            loja.end_complemento ?? null,
            loja.end_numero      ?? null,
            loja.logradouro      ?? null,
            now,
            cnpj,
          ])
        } else {
          console.warn(`⚠️  CNPJ ${cnpj} sem PEC — UPDATE sem redefinição de senha.`)

          await db.query(`
            UPDATE dbLojista.fat_loja_cadastro SET
              loja_numero     = ?,
              nome_fantasia   = ?,
              razao_social    = ?,
              email           = ?,
              telefone        = ?,
              whatsapp        = ?,
              end_bairro      = ?,
              end_cep         = ?,
              end_cidade      = ?,
              end_complemento = ?,
              end_numero      = ?,
              end_rua         = ?,
              updatedAt       = ?
            WHERE cnpj = ? AND deletedAt IS NULL
          `, [
            loja.loja_numero     ?? null,
            loja.fantasia        ?? '',
            loja.razao_social    ?? '',
            loja.email           ?? '',
            loja.telefone_fixo   ?? null,
            loja.celular         ?? null,
            loja.end_bairro      ?? null,
            normalizeCep(loja.cep),
            loja.cidade          ?? null,
            loja.end_complemento ?? null,
            loja.end_numero      ?? null,
            loja.logradouro      ?? null,
            now,
            cnpj,
          ])
        }

        updated++
        console.log(`  🔄 UPDATE  CNPJ ${cnpj} — ${loja.fantasia}`)
      }
    }

    console.log(`\n🏁 Sincronização concluída:`)
    console.log(`   Inseridos  : ${inserted}`)
    console.log(`   Atualizados: ${updated}`)
    console.log(`   Ignorados  : ${skipped}`)

  } finally {
    await db.end()
  }
}

syncLojas().catch((err) => {
  console.error('❌ Erro na sincronização:', err)
  process.exit(1)
})
