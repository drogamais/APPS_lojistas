import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import path from 'path'
import { fileURLToPath } from 'url'
import fastifyStatic from '@fastify/static'
import authenticatePlugin from './plugins/authenticate.js'
import { authRoutes } from './routes/auth.js'
import { perfilRoutes } from './routes/perfil.js'
import { balconistaRoutes } from './routes/balconistas.js'
import { servicoRoutes } from './routes/servicos.js'
import { googleAuthRoutes } from './routes/google_auth.js'
import { homeRoutes } from './routes/home.js'
import { adminRoutes } from './routes/admin.js'
import { campanhasRoutes } from './routes/campanhas.js'

const app = Fastify({ logger: true })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await app.register(cors, { origin: true })
await app.register(jwt, { secret: process.env.JWT_SECRET })
await app.register(authenticatePlugin)

// Serve a pasta de imagens (que será montada via Docker)
await app.register(fastifyStatic, {
  root: path.join(__dirname, '../imgs'),
  prefix: '/imgs/',
})

app.get('/health', async () => ({ status: 'ok' }))

await app.register(authRoutes)
await app.register(perfilRoutes)
await app.register(balconistaRoutes)
await app.register(servicoRoutes)
await app.register(googleAuthRoutes)
await app.register(homeRoutes)
await app.register(adminRoutes)
await app.register(campanhasRoutes)

const PORT = Number(process.env.PORT) || 3333

try {
  await app.listen({ port: PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
