# Chamados AV1

Aplicação de atendimento para registrar solicitações e acompanhar chamados. O repositório é um monorepo Turborepo com uma interface web React e uma API Express.

## Requisitos

- Node.js 24.20 ou superior
- npm 11.9

## Configuração local

Na raiz do projeto, instale as dependências e copie o ambiente de exemplo:

```sh
npm install
```

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Gere um segredo JWT com pelo menos 32 bytes e defina `JWT_SECRET` em `apps/api/.env`:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

O projeto usa SQLite por padrão em `apps/api/prisma/dev.db`. Aplique a migração inicial:

```sh
npm run prisma:migrate --workspace api -- --name init
```

Preencha `ADMIN_NOME`, `ADMIN_EMAIL` e `ADMIN_SENHA` no `.env` e crie o primeiro administrador:

```sh
npm run admin:seed --workspace api
```

O seed não altera contas se já existir um administrador. Remova `ADMIN_SENHA` do `.env` depois da criação.

## Desenvolvimento

Inicie a interface e a API pela raiz:

```sh
npm run dev
```

A interface Vite fica disponível em `http://localhost:5173` e a API em `http://localhost:3000`. Para iniciar um app individual:

```sh
npm run dev --workspace web
npm run dev --workspace api
```

## Documentação da API

Com a API em execução, acesse `http://localhost:3000/docs` para explorar e testar as rotas no Swagger UI. A especificação OpenAPI fica disponível em `http://localhost:3000/openapi.json`. Use o botão **Authorize** no Swagger UI com o JWT retornado por `POST /auth/login` para chamar as rotas protegidas.

## Autenticação

`GET /health`, `POST /auth/login` e `POST /auth/register` são públicos. O login recebe `{ "email": "...", "senha": "..." }` e retorna um JWT HS256 com validade de 1 hora. O cadastro recebe `nome`, `email`, `setor`, `telefone` e `senha`, cria uma conta `USER` e já retorna um JWT para iniciar a sessão. Envie o token nas rotas protegidas usando `Authorization: Bearer <token>`.

O único administrador inicial é provisionado pelo seed acima; não existe cadastro público de administrador nem rota para criar outro administrador. Pessoas também podem criar as próprias contas de solicitante em `/cadastro`; somente administradores podem usar `POST /api/usuarios` para cadastrar contas em seu nome. As senhas são armazenadas com bcrypt.

Contas comuns recebem papel `USER` e não acessam as rotas administrativas. Elas podem consultar equipamentos disponíveis, abrir chamados em seu próprio nome e listar somente os próprios chamados em `/api/me/equipamentos` e `/api/me/chamados`.

Na tela `/login`, o cliente envia as credenciais a `POST /auth/login` e guarda o token e o papel em `sessionStorage`. A sessão termina ao sair, ao fechar a aba ou quando o token expira. No desenvolvimento, o Vite encaminha `/auth` e `/api` para a API na porta `3000`; em outro ambiente, `VITE_API_URL` pode apontar para a origem da API.

## API

As rotas de gestão abaixo exigem um JWT de administrador.

### Administradores

| Método | Rota | Ação |
| --- | --- | --- |
| `GET` | `/api/administradores` | Lista administradores |
| `GET` | `/api/administradores/:id` | Busca administrador por ID |
| `PATCH` | `/api/administradores/:id` | Atualiza os campos enviados |
| `DELETE` | `/api/administradores/:id` | Remove administrador |

As senhas são armazenadas com bcrypt (12 rounds) e nunca retornadas pela API. Senhas novas aceitam até 72 bytes, limite do bcrypt. Não é possível desativar ou remover a própria conta, nem deixar o sistema sem administradores ativos.

### Usuários

| Método | Rota | Ação |
| --- | --- | --- |
| `GET` | `/api/usuarios` | Lista usuários |
| `GET` | `/api/usuarios/:id` | Busca usuário por ID |
| `POST` | `/api/usuarios` | Cria usuário |
| `PATCH` | `/api/usuarios/:id` | Atualiza os campos enviados |
| `DELETE` | `/api/usuarios/:id` | Remove usuário |

Exemplo de corpo para criar usuário:

```json
{
  "nome": "Ana Silva",
  "email": "ana@example.com",
  "setor": "Secretaria",
  "telefone": "24999998888",
  "senha": "senha-segura"
}
```

Essa rota exige token de administrador. A senha precisa ter pelo menos 8 caracteres e é armazenada com bcrypt, nunca retornada pela API. E-mails já usados por qualquer conta retornam `409`; IDs inválidos retornam `400` e registros ausentes retornam `404`.

### Equipamentos

| Método | Rota | Ação |
| --- | --- | --- |
| `GET` | `/api/equipamentos` | Lista equipamentos |
| `GET` | `/api/equipamentos/:id` | Busca equipamento por ID |
| `POST` | `/api/equipamentos` | Cria equipamento |
| `PATCH` | `/api/equipamentos/:id` | Atualiza os campos enviados |
| `DELETE` | `/api/equipamentos/:id` | Remove equipamento |

### Chamados

| Método | Rota | Ação |
| --- | --- | --- |
| `GET` | `/api/chamados` | Lista chamados |
| `GET` | `/api/chamados/:id` | Busca chamado por ID |
| `POST` | `/api/chamados` | Abre chamado |
| `PATCH` | `/api/chamados/:id` | Atualiza os campos enviados |
| `DELETE` | `/api/chamados/:id` | Remove chamado |

### Área do usuário

| Método | Rota | Ação |
| --- | --- | --- |
| `GET` | `/api/me/equipamentos` | Lista equipamentos disponíveis |
| `GET` | `/api/me/chamados` | Lista somente os chamados da própria conta |
| `POST` | `/api/me/chamados` | Abre chamado para a própria conta |

Essas rotas exigem um JWT com papel `USER`. O ID do solicitante é obtido do token; qualquer `usuarioId` enviado no corpo é ignorado. Usuários comuns recebem `403` nas rotas de gestão.

## Scripts

```sh
npm run build
npm run lint
npm run prisma:generate --workspace api
npm run prisma:migrate --workspace api
npm run admin:seed --workspace api
```

Os comandos `dev` e `build` da API geram o Prisma Client antes de iniciar ou compilar.

## Estrutura

```text
apps/
  api/       Express, autenticação, validações Zod, repositórios e Prisma
  web/       React, Vite e TanStack Router
packages/
  eslint-config/
  tailwind-config/
  typescript-config/
  ui/
```
