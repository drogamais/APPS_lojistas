# Diretrizes do Projeto: Portal do Lojista - Drogamais

Este projeto é um CRUD focado nos lojistas (donos de farmácia) da rede associativa Drogamais. A infraestrutura é dividida em dois containers Docker separados (Backend e Frontend).

## 1. Backend (Fastify + Prisma + MariaDB)
- **Banco de Dados:** Conexão com MariaDB (`dbLojista` no host `10.48.12.20`).
- **Modelagem Prisma:** Use `@@map` para refletir os nomes exatos do banco. Tabelas principais: `fat_loja_cadastro`, `fat_loja_balconista`, `fat_loja_servicos`.
- **Desnormalização:** As tabelas filhas contêm as colunas `cnpj` (String, só números), `loja_numero` (Int, opcional) e `nome_fantasia` (String) junto com a FK `loja_id`.
- **Regra de Multitenant:** O lojista só pode ver, editar e deletar dados da sua própria loja. O `loja_id` DEVE ser extraído do token JWT e injetado obrigatoriamente nas cláusulas `where` de todas as rotas restritas.
- **Soft Delete:** Nunca faça deleção física (DELETE). Atualize a coluna `deletedAt` (DateTime). Todas as rotas de busca (`findMany`, `findUnique`, etc.) devem filtrar com `deletedAt: null`.

## 2. Frontend (React + Vite + Tailwind CSS)
- **Arquitetura:** SPA (Single Page Application) limpa. Sem SSR (Server-Side Rendering).
- **Identidade Visual Drogamais:** Use uma paleta de cores consistente com a marca da rede. O design deve ter foco total em usabilidade (UX) para o dono da farmácia.
- **Gerenciamento de Estado e API:** Centralize a chamada à API garantindo que o token JWT do `localStorage` seja enviado via header `Authorization: Bearer <token>`.
- **Tratamento de Sessão:** Qualquer resposta `401 Unauthorized` da API deve forçar o logout automático do usuário e redirecionamento para a tela de login.

## 3. Infraestrutura (Docker)
- Mantenha total separação.
- O Frontend deve ter seu próprio `Dockerfile` (gerando o build do Vite e servindo via Nginx).
- O Backend deve ter seu próprio `Dockerfile` (rodando o Node/Fastify).
- O `docker-compose.yml` deve orquestrar ambos os serviços e ler as variáveis do arquivo `.env`.

## 4. Variáveis de Ambiente e Configurações (IMPORTANTE)
- **NÃO hardcode credenciais no código.** - **LEIA SEMPRE O ARQUIVO `.env`** na raiz do projeto para obter credenciais de banco de dados, secrets e portas antes de gerar conexões, rodar o Prisma ou configurar o Docker Compose.
- **Aviso de Parse de Senha:** A variável `DATABASE_URL` no `.env` já contém os escapes necessários para o Docker (`$$`) e para o Prisma (`%40`). Ao criar o `docker-compose.yml` ou configurar o backend, certifique-se de apenas repassar o valor do `.env` sem alterar essa formatação.