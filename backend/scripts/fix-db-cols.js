import mysql from 'mysql2/promise'

async function run() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL not found in environment.')
    process.exit(1)
  }

  const db = await mysql.createConnection(url)

  try {
    console.log('--- REORDENANDO COLUNA ---')
    await db.query(`ALTER TABLE fat_loja_cadastro MODIFY COLUMN loja_completo VARCHAR(255) AFTER nome_fantasia`)
    console.log('✅ Sucesso: loja_completo movida para após nome_fantasia.')
    
    // Verificação de nulos
    const [rows] = await db.query('SELECT count(*) as total FROM fat_loja_cadastro WHERE loja_completo IS NULL OR loja_completo = ""')
    console.log(`⚠️  Encontrados ${rows[0].total} registros com loja_completo vazio.`)
  } catch (err) {
    console.error('❌ Erro:', err.message)
  } finally {
    await db.end()
  }
}

run()
