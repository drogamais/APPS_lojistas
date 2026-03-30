# ---- Stage 1: Dependencies ----
FROM node:20-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y openssl --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

# ---- Stage 2: Runtime ----
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update \
    && apt-get install -y openssl bash dos2unix --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copia dependências instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copia o restante do código
COPY . .

# Converte CRLF -> LF (protege contra arquivos editados no Windows)
# e garante permissão de execução
RUN dos2unix start.sh && chmod +x start.sh

# Gera o Prisma Client para o ambiente Linux do container
RUN npx prisma generate

EXPOSE 3333

CMD ["bash", "start.sh"]
