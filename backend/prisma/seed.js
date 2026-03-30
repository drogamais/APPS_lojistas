import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const senhaHash = await bcrypt.hash('admin', 12)

  const loja = await prisma.lojaCadastro.upsert({
    where: { email: 'inteligencia@drogamais.com.br' },
    update: {},
    create: {
      cnpj:                 '00000000000100',
      loja_numero:          1,
      nome_fantasia:        'Loja Matriz Drogamais',
      razao_social:         'Drogamais Rede Associativa Ltda.',
      email:                'inteligencia@drogamais.com.br',
      senha_hash:           senhaHash,
      telefone:             '4133210000',
      whatsapp:             '41999990000',
      instagram:            '@drogamais_oficial',

      end_rua:              'Av. Candido de Abreu',
      end_numero:           '817',
      end_complemento:      '',
      end_bairro:           'Centro Cívico',
      end_cidade:           'Curitiba',
      end_uf:               'PR',
      end_cep:              '80530000',

      seg_abre:             '07:00',
      seg_fecha:            '22:00',
      ter_abre:             '07:00',
      ter_fecha:            '22:00',
      qua_abre:             '07:00',
      qua_fecha:            '22:00',
      qui_abre:             '07:00',
      qui_fecha:            '22:00',
      sex_abre:             '07:00',
      sex_fecha:            '22:00',
      sab_abre:             '08:00',
      sab_fecha:            '20:00',
      dom_abre:             null,
      dom_fecha:            null,
    },
  })

  console.log(`✔  Loja seed criada/verificada: [${loja.id}] ${loja.nome_fantasia}`)
  console.log(`   E-mail : ${loja.email}`)
  console.log(`   Senha  : admin  (hash bcrypt aplicado)`)
}

main()
  .catch((err) => {
    console.error('Erro no seed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
