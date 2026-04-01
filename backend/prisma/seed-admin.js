import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@drogamais.com'
  const adminPassword = 'Admin#123'
  const adminCnpj = '00000000000000'

  const existing = await prisma.lojaCadastro.findUnique({
    where: { email: adminEmail }
  })

  if (!existing) {
    const senhaHash = await bcrypt.hash(adminPassword, 10)
    await prisma.lojaCadastro.create({
      data: {
        nome_fantasia: 'Administrador Drogamais',
        razao_social: 'Administrador Drogamais',
        email: adminEmail,
        senha_hash: senhaHash,
        cnpj: adminCnpj,
        is_admin: true,
      }
    })
    console.log('✅ Root admin created: admin@drogamais.com / Admin#123')
  } else {
    // Garante que o administrador existente tenha a flag is_admin: true
    await prisma.lojaCadastro.update({
      where: { email: adminEmail },
      data: { is_admin: true }
    })
    console.log('ℹ️ Root admin already exists.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
