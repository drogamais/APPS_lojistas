import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const senhaHash = await bcrypt.hash('admin', 12)

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

  console.log(`✔  Seed de links, avisos e promoções concluída.`)
}

main()
  .catch((err) => {
    console.error('Erro no seed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
