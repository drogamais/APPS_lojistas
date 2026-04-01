# Diretrizes do Projeto: Portal do Lojista - Drogamais

Este projeto é um CRUD focado nos lojistas (donos de farmácia) da rede associativa Drogamais, incluindo visualização de dashboards de campanhas. A infraestrutura é dividida em dois containers Docker separados (Backend e Frontend).

## 1. Backend (Fastify + Prisma + MariaDB)

- **Banco de Dados:** Conexão com MariaDB (`dbLojista` no host `10.48.12.20`).
- **Modelagem Prisma:** Use `@@map` para refletir os nomes exatos do banco. Tabelas principais: `fat_loja_cadastro`, `fat_loja_balconista`, `fat_loja_servicos`.
- **Desnormalização:** As tabelas filhas contêm as colunas `cnpj` (String, só números), `loja_numero` (Int, opcional) e `nome_fantasia` (String) junto com a FK `loja_id`.
- **Regra de Multitenant (CRÍTICO):** O lojista só pode ver, editar e deletar dados da sua própria loja. O `loja_id` DEVE ser extraído do token JWT e injetado obrigatoriamente nas cláusulas `where` de TODAS as rotas restritas, **incluindo rotas de totalizadores e dashboards**.
- **Soft Delete:** Nunca faça deleção física (DELETE). Atualize a coluna `deletedAt` (DateTime). Todas as rotas de busca (`findMany`, `findUnique`, etc.) devem filtrar com `deletedAt: null`.
- **Dashboards e Performance:** Para rotas que alimentam o Dashboard de Campanhas, prefira usar a API de agregação do Prisma (`groupBy`, `aggregate`). Caso a consulta fique muito complexa ou lenta, é permitido o uso de `prisma.$queryRaw` para escrever SQL nativo otimizado, desde que o filtro de `loja_id` (Multitenant) seja estritamente respeitado via parâmetros seguros.

## 2. Frontend (React + Vite + Tailwind CSS)

- **Arquitetura:** SPA (Single Page Application) limpa. Sem SSR (Server-Side Rendering).
- **Identidade Visual Drogamais:** Use uma paleta de cores consistente com a marca da rede. O design deve ter foco total em usabilidade (UX) para o dono da farmácia.
- **Dashboards e Gráficos:** Para a página de campanhas, utilize componentes visuais claros. [OPCIONAL: Defina aqui a biblioteca, ex: "Sempre utilize a biblioteca Recharts para a plotagem de gráficos"].
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

## 5. Regras de Comportamento do Claude Code

- **Modificação de Arquivos:** Ao sugerir ou aplicar modificações em arquivos grandes, foque apenas no trecho de código alterado. Não reescreva o arquivo inteiro se não for necessário.
- **Banco de Dados:** Quando criar ou alterar models no `schema.prisma`, **sempre** me pergunte antes de rodar comandos de migração (`npx prisma migrate dev` ou `npx prisma db push`).