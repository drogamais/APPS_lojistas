#!/bin/bash
set -e

echo "[start] Aguardando o banco de dados ficar disponivel..."

MAX=10
COUNT=0

# Usa --input-type=commonjs para rodar CJS inline sem conflito com "type":"module" do package.json
CHECK_SCRIPT='
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.$queryRaw`SELECT 1`
  .then(() => { p.$disconnect(); process.exit(0); })
  .catch(() => { p.$disconnect(); process.exit(1); });
'

until echo "$CHECK_SCRIPT" | node --input-type=commonjs 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$MAX" ]; then
    echo "[start] ERRO: banco nao respondeu apos ${MAX} tentativas. Abortando."
    exit 1
  fi
  echo "[start] Banco indisponivel. Tentativa ${COUNT}/${MAX}. Aguardando 2s..."
  sleep 2
done

echo "[start] Banco disponivel! Sincronizando schema..."
npx prisma db push --accept-data-loss

echo "[start] Rodando seed..."
npx prisma db seed

echo "[start] Iniciando servidor Fastify..."
exec node src/server.js
