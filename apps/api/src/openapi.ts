const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

function crudPaths(
  path: string,
  tag: string,
  singular: string,
  schema: string,
  createSchema: string,
  updateSchema: string,
  allowCreate = true,
) {
  const item = ref(schema);
  return {
    [`/api/${path}`]: {
      get: {
        tags: [tag],
        summary: `Lista ${tag.toLowerCase()}`,
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Lista retornada", content: { "application/json": { schema: { type: "array", items: item } } } } },
      },
      ...(allowCreate ? { post: {
        tags: [tag],
        summary: `Cria ${singular.toLowerCase()}`,
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: ref(createSchema) } } },
        responses: {
          "201": { description: "Registro criado", content: { "application/json": { schema: item } } },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      } } : {}),
    },
    [`/api/${path}/{id}`]: {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
      get: {
        tags: [tag],
        summary: `Busca ${singular.toLowerCase()} por ID`,
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Registro encontrado", content: { "application/json": { schema: item } } },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: [tag],
        summary: `Atualiza ${singular.toLowerCase()}`,
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: ref(updateSchema) } } },
        responses: {
          "200": { description: "Registro atualizado", content: { "application/json": { schema: item } } },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
      delete: {
        tags: [tag],
        summary: `Remove ${singular.toLowerCase()}`,
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Registro removido" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },
  };
}

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Chamados AV1 API",
    version: "1.0.0",
    description: "API de chamados, equipamentos, usuários e administradores com papéis separados.",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "Autenticação" },
    { name: "Administradores" },
    { name: "Chamados" },
    { name: "Equipamentos" },
    { name: "Usuários" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Autenticação"],
        summary: "Verifica o estado da API",
        responses: { "200": { description: "API disponível" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Autentica um administrador ou usuário",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "senha"],
                properties: {
                  email: { type: "string", format: "email", example: "admin@example.com" },
                  senha: { type: "string", format: "password", example: "senha-segura" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login efetuado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string" },
                    tokenType: { type: "string", example: "Bearer" },
                    expiresIn: { type: "integer", example: 3600 },
                    role: { type: "string", enum: ["ADMIN", "USER"] },
                    administrador: { $ref: "#/components/schemas/Administrador" },
                    usuario: { $ref: "#/components/schemas/Usuario" },
                  },
                },
              },
            },
          },
          "401": { description: "Credenciais inválidas" },
        },
      },
    },
    "/api/me/equipamentos": {
      get: {
        tags: ["Usuários"],
        summary: "Lista equipamentos disponíveis para o usuário autenticado",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Lista retornada" }, "403": { description: "Rota exclusiva para usuários comuns" } },
      },
    },
    "/api/me/chamados": {
      get: {
        tags: ["Usuários"],
        summary: "Lista somente os chamados do usuário autenticado",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Lista retornada" }, "403": { description: "Rota exclusiva para usuários comuns" } },
      },
      post: {
        tags: ["Usuários"],
        summary: "Abre chamado para o usuário autenticado",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: ref("NovoChamadoUsuario") } } },
        responses: { "201": { description: "Chamado criado" }, "400": { $ref: "#/components/responses/BadRequest" }, "403": { description: "Rota exclusiva para usuários comuns" } },
      },
    },
    ...crudPaths("administradores", "Administradores", "administrador", "Administrador", "NovoAdministrador", "AtualizarAdministrador", false),
    ...crudPaths("chamados", "Chamados", "chamado", "Chamado", "NovoChamado", "AtualizarChamado"),
    ...crudPaths("equipamentos", "Equipamentos", "equipamento", "Equipamento", "NovoEquipamento", "AtualizarEquipamento"),
    ...crudPaths("usuarios", "Usuários", "usuário", "Usuario", "NovoUsuario", "AtualizarUsuario"),
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    responses: {
      BadRequest: { description: "Dados inválidos" },
      NotFound: { description: "Registro não encontrado" },
      Conflict: { description: "Conflito com registro existente" },
    },
    schemas: {
      Administrador: {
        type: "object",
        properties: {
          id: { type: "integer" }, nome: { type: "string" }, email: { type: "string", format: "email" },
          ativo: { type: "boolean" }, dataCriacao: { type: "string", format: "date-time" },
          dataAtualizacao: { type: "string", format: "date-time" },
        },
      },
      NovoAdministrador: {
        type: "object", required: ["nome", "email", "senha"],
        properties: { nome: { type: "string" }, email: { type: "string", format: "email" }, senha: { type: "string", format: "password", minLength: 8, maxLength: 72 } },
      },
      AtualizarAdministrador: {
        type: "object",
        properties: { nome: { type: "string" }, email: { type: "string", format: "email" }, senha: { type: "string", format: "password", minLength: 8, maxLength: 72 }, ativo: { type: "boolean" } },
      },
      Chamado: {
        type: "object",
        properties: {
          id: { type: "integer" }, titulo: { type: "string" }, descricao: { type: "string" },
          prioridade: { type: "string", enum: ["Baixa", "Média", "Alta"] },
          status: { type: "string", enum: ["Aberto", "Em Andamento", "Fechado"] },
          equipamentoId: { type: "integer" }, usuarioId: { type: "integer" },
          dataAbertura: { type: "string", format: "date-time" }, dataFechamento: { type: "string", format: "date-time", nullable: true },
        },
      },
      NovoChamado: {
        type: "object", required: ["titulo", "descricao", "equipamentoId", "usuarioId"],
        properties: { titulo: { type: "string" }, descricao: { type: "string" }, equipamentoId: { type: "integer", minimum: 1 }, usuarioId: { type: "integer", minimum: 1 } },
      },
      NovoChamadoUsuario: {
        type: "object", required: ["titulo", "descricao", "equipamentoId"],
        properties: { titulo: { type: "string" }, descricao: { type: "string" }, equipamentoId: { type: "integer", minimum: 1 } },
      },
      AtualizarChamado: {
        type: "object",
        properties: {
          titulo: { type: "string" }, descricao: { type: "string" }, prioridade: { type: "string", enum: ["Baixa", "Média", "Alta"] },
          status: { type: "string", enum: ["Aberto", "Em Andamento", "Fechado"] }, equipamentoId: { type: "integer", minimum: 1 }, usuarioId: { type: "integer", minimum: 1 },
        },
      },
      Equipamento: {
        type: "object",
        properties: {
          id: { type: "integer" }, nome: { type: "string" }, patrimonio: { type: "string" },
          tipo: { type: "string", enum: ["Computador", "Impressora", "Scanner", "Monitor", "Celular"] },
          descricao: { type: "string", nullable: true }, dataCriacao: { type: "string", format: "date-time" },
        },
      },
      NovoEquipamento: {
        type: "object", required: ["nome", "patrimonio", "tipo"],
        properties: {
          nome: { type: "string" }, patrimonio: { type: "string" },
          tipo: { type: "string", enum: ["Computador", "Impressora", "Scanner", "Monitor", "Celular"] }, descricao: { type: "string" },
        },
      },
      AtualizarEquipamento: {
        type: "object",
        properties: {
          nome: { type: "string" }, patrimonio: { type: "string" },
          tipo: { type: "string", enum: ["Computador", "Impressora", "Scanner", "Monitor", "Celular"] }, descricao: { type: "string" },
        },
      },
      Usuario: {
        type: "object",
        properties: { id: { type: "integer" }, nome: { type: "string" }, email: { type: "string", format: "email" }, setor: { type: "string" }, telefone: { type: "string" } },
      },
      NovoUsuario: {
        type: "object", required: ["nome", "email", "setor", "telefone", "senha"],
        properties: { nome: { type: "string" }, email: { type: "string", format: "email" }, setor: { type: "string" }, telefone: { type: "string", minLength: 8, maxLength: 20 }, senha: { type: "string", format: "password", minLength: 8, maxLength: 72 } },
      },
      AtualizarUsuario: {
        type: "object", minProperties: 1,
        properties: { nome: { type: "string" }, email: { type: "string", format: "email" }, setor: { type: "string" }, telefone: { type: "string", minLength: 8, maxLength: 20 } },
      },
    },
  },
};
