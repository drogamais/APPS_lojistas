import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import authenticatePlugin from './plugins/authenticate.js'
import { authRoutes } from './routes/auth.js'
import { perfilRoutes } from './routes/perfil.js'
import { balconistaRoutes } from './routes/balconistas.js'
import { servicoRoutes } from './routes/servicos.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(jwt, { secret: process.env.JWT_SECRET })
await app.register(authenticatePlugin)

app.get('/health', async () => ({ status: 'ok' }))

await app.register(authRoutes)
await app.register(perfilRoutes)
await app.register(balconistaRoutes)
await app.register(servicoRoutes)

const PORT = Number(process.env.PORT) || 3333

try {
  await app.listen({ port: PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
