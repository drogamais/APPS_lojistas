import oauthPlugin from '@fastify/oauth2'
import { prisma } from '../lib/prisma.js'

export async function googleAuthRoutes(fastify) {
  // Configuração do OAuth2
  // IMPORTANTE: Em produção, estas credenciais devem vir de variáveis de ambiente
  await fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID || 'ALERTA_FALTA_CLIENT_ID',
        secret: process.env.GOOGLE_CLIENT_SECRET || 'ALERTA_FALTA_CLIENT_SECRET'
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/api/google/auth',
    callbackUri: `${process.env.VITE_API_URL || 'http://localhost:3333'}/api/google/callback`,
    callbackUriParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  })

  // Callback chamado pelo Google após autorização
  fastify.get('/api/google/callback', async (request, reply) => {
    try {
      const { loja_id } = request.user // Assumindo que o usuário está logado via JWT no portal
      
      const token = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
      
      // Decodificar info do perfil (opcional, para pegar o e-mail)
      // Aqui simplificaremos salvando o que o google retornar
      
      await prisma.lojaCadastro.update({
        where: { id: loja_id },
        data: {
          google_access_token: token.access_token,
          google_refresh_token: token.refresh_token,
          google_expiry_date: BigInt(Date.now() + (token.expires_in * 1000)),
          // O google_email pode ser buscado via userinfo se necessário
        }
      })

      // Redireciona de volta para a página de perfil no frontend
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/perfil?google=success`)
    } catch (err) {
      fastify.log.error(err)
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/perfil?google=error`)
    }
  })

  // Rota para verificar status e desconectar
  fastify.get('/api/google/status', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { loja_id } = request.user
    const loja = await prisma.lojaCadastro.findUnique({
      where: { id: loja_id },
      select: { google_email: true, google_refresh_token: true }
    })
    
    return { 
      connected: !!loja?.google_refresh_token,
      email: loja?.google_email 
    }
  })

  fastify.post('/api/google/disconnect', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { loja_id } = request.user
    await prisma.lojaCadastro.update({
      where: { id: loja_id },
      data: {
        google_email: null,
        google_access_token: null,
        google_refresh_token: null,
        google_expiry_date: null,
        google_calendar_id: null
      }
    })
    return { success: true }
  })
}
