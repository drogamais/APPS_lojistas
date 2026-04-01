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

export async function runSync(onProgress) {
  const db = await mysql.createConnection({
    host:     process.env.DB_SYNC_HOST,
    port:     parseInt(process.env.DB_SYNC_PORT || '3306'),
    user:     process.env.DB_SYNC_USER,
    password: process.env.DB_SYNC_PASS,
    charset:  'utf8mb4',
  })

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

    const total = lojas.length
    let current = 0
    let inserted = 0
    let updated  = 0
    let skipped  = 0

    const now = new Date()

    if (onProgress) onProgress({ current: 0, total })

    for (const loja of lojas) {
      current++
      if (onProgress) onProgress({ current, total })
      const cnpj = loja.cnpj_s?.trim()
      if (!cnpj) { skipped++; continue }

      const [existing] = await db.query(
        'SELECT id FROM dbLojista.fat_loja_cadastro WHERE cnpj = ? AND deletedAt IS NULL LIMIT 1',
        [cnpj]
      )

      const rawPassword = buildRawPassword(loja)

      if (existing.length === 0) {
        if (!rawPassword) {
          skipped++
          continue
        }

        const senhaHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS)
        const num  = loja.loja_numero || ''
        const fant = loja.fantasia    || ''
        const comp = `${num} - ${fant}`.trim()
        
        console.log(`[SYNC] Novo: CNPJ ${cnpj} => [${comp}]`)

        await db.query(`
          INSERT INTO dbLojista.fat_loja_cadastro
            (cnpj, loja_numero, nome_fantasia, loja_completo, razao_social, email,
             senha_hash, telefone, whatsapp,
             end_bairro, end_cep, end_cidade, end_complemento, end_numero, end_rua,
             createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          cnpj,
          loja.loja_numero     ?? null,
          loja.fantasia        ?? '',
          comp,
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
      } else {
        const num  = loja.loja_numero || ''
        const fant = loja.fantasia    || ''
        const comp = `${num} - ${fant}`.trim()
        
        if (rawPassword) {
          const senhaHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS)

          await db.query(`
            UPDATE dbLojista.fat_loja_cadastro SET
              loja_numero     = ?,
              nome_fantasia   = ?,
              loja_completo   = ?,
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
            comp,
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
          await db.query(`
            UPDATE dbLojista.fat_loja_cadastro SET
              loja_numero     = ?,
              nome_fantasia   = ?,
              loja_completo   = ?,
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
            comp,
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
      }
    }

    return { inserted, updated, skipped }
  } finally {
    await db.end()
  }
}
