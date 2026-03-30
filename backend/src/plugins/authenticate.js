import fp from 'fastify-plugin'

async function authenticate(fastify) {
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Token inválido ou não fornecido.' })
    }
  })
}

export default fp(authenticate)
