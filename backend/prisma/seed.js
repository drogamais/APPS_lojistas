import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const senhaHash = await bcrypt.hash('admin', 12)

  const loja = await prisma.lojaCadastro.upsert({
    where: { email: 'inteligencia@drogamais.com.br' },
    update: {
      is_admin: true,
    },
    create: {
      cnpj:                 '00000000000100',
      loja_numero:          1,
      nome_fantasia:        'Loja Matriz Drogamais',
      razao_social:         'Drogamais Rede Associativa Ltda.',
      email:                'inteligencia@drogamais.com.br',
      senha_hash:           senhaHash,
      is_admin:             true,
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

  // Seed de Links
  await prisma.lojaHomeLink.deleteMany({}) // Apenas para garantia em dev de ter id sequencial e limpo
  await prisma.lojaHomeLink.createMany({
    data: [
      { titulo: 'Indicamais', url: 'https://indicamais.com/', icone_nome: 'TrendingUp', ordem: 1 },
      { titulo: 'Febrafar Analysis', url: 'https://febrafaranalysis.com.br/', icone_nome: 'BarChart2', ordem: 2 },
      { titulo: 'e-Delivery', url: 'https://delivery.com', icone_nome: 'Truck', ordem: 3 },
      { titulo: 'Gruppy', url: 'https://gruppy.com', icone_nome: 'Users', ordem: 4 },
      { titulo: 'Corporate Supply', url: 'https://supply.com', icone_nome: 'Database', ordem: 5 },
      { titulo: 'BigConecta', url: 'https://bigconecta.com', icone_nome: 'Link', ordem: 6 },
      { titulo: 'Órion', url: 'https://orion.com', icone_nome: 'Star', ordem: 7 },
      { titulo: 'Pedmais', url: 'https://pedmais.com', icone_nome: 'ShoppingCart', ordem: 8 },
      { titulo: 'Studio Digital', url: 'https://studiodigital.com', icone_nome: 'MonitorPlay', ordem: 9 },
    ]
  })

  await prisma.lojaHomeAviso.deleteMany({})
  await prisma.lojaHomeAviso.createMany({
    data: [
      { titulo: 'Boas-vindas ao Novo Portal', descricao_ou_imagem: 'A Drogamais está com um novo visual e novas funcionalidades. Explore o menu à esquerda!', ordem: 1 },
      { titulo: 'Treinamento de Balconistas', descricao_ou_imagem: 'Novo treinamento disponível na plataforma EAD Drogamais. Inscreva seus balconistas até o dia 15.', ordem: 2 },
      { titulo: 'Campanha de Inverno', descricao_ou_imagem: 'Confira as ações promocionais de inverno disponíveis. Material disponível na Indicamais.', ordem: 3 },
    ]
  })

  // Seed de Promoções (banners com imagem)
  await prisma.lojaHomePromocao.deleteMany({})
  await prisma.lojaHomePromocao.createMany({
    data: [
      {
        titulo: 'Promoção de Inverno',
        imagem_url: '/imgs/item-1.jpeg',
        url_destino: 'https://indicamais.com',
        ordem: 1,
      },
      {
        titulo: 'Campanha de Fidelização',
        imagem_url: '/imgs/item-2.jpeg',
        url_destino: 'https://indicamais.com',
        ordem: 2,
      },
      {
        titulo: 'Novidades do Mês',
        imagem_url: '/imgs/item-3.jpeg',
        url_destino: null,
        ordem: 3,
      },
    ]
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
