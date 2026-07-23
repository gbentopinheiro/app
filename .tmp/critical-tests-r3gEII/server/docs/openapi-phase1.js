const ref = name => ({ $ref: `#/components/schemas/${name}` })

const jsonContent = schema => ({
  'application/json': {
    schema,
  },
})

const binaryContent = mimeType => ({
  [mimeType]: {
    schema: {
      type: 'string',
      format: 'binary',
    },
  },
})

const protectedPayloadDescription = decryptedPayloadExample => [
  'O corpo aceite pela API e sempre o envelope protegido produzido pelo transporte de login.',
  'O payload desencriptado esperado e:',
  '```json',
  JSON.stringify(decryptedPayloadExample, null, 2),
  '```',
].join('\n')

export const openApiPhase1 = {
  openapi: '3.1.0',
  info: {
    title: 'Bentix Operational API',
    version: '1.0.0-phase2',
    description: [
      'Swagger/OpenAPI para a superficie operacional estavel da aplicacao.',
      'A fase 1 documentou os endpoints operacionais e os blocos developer ja migrados para REST Service Layer.',
      'A fase 2 acrescenta os endpoints developer/admin restantes e os endpoints legacy de compatibilidade ainda expostos pela aplicacao.',
    ].join('\n\n'),
  },
  servers: [
    {
      url: '/',
      description: 'Mesma origem da aplicacao Next.js',
    },
  ],
  tags: [
    { name: 'Auth' },
    { name: 'Account' },
    { name: 'Clients' },
    { name: 'People' },
    { name: 'People Documents' },
    { name: 'Works' },
    { name: 'Work Plans' },
    { name: 'Work Assignments' },
    { name: 'Materials' },
    { name: 'Calendar' },
    { name: 'Daily Work Notes' },
    { name: 'Activity History' },
    { name: 'Access Identities' },
    { name: 'Developer Users' },
    { name: 'Developer Access Profiles' },
    { name: 'Developer Permissions' },
    { name: 'Developer Feature Flags' },
    { name: 'Developer Overrides' },
    { name: 'Developer Admin' },
    { name: 'Legacy Compatibility' },
  ],
  paths: {
    '/api/auth/session': {
      get: {
        tags: ['Auth'],
        summary: 'Obter sessao atual',
        description: 'Devolve a sessao autenticada atual. Sem sessao devolve 401 com `{ authenticated: false }`.',
        responses: {
          '200': {
            description: 'Sessao autenticada',
            content: jsonContent(ref('AuthenticatedSessionResponse')),
          },
          '401': {
            description: 'Sem sessao ativa',
            content: jsonContent(ref('AnonymousSessionResponse')),
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sessao',
        description: protectedPayloadDescription({
          username: 'chef.demo',
          password: 'Secret123!',
        }),
        requestBody: {
          required: true,
          content: jsonContent(ref('ProtectedPayloadEnvelope')),
        },
        responses: {
          '200': {
            description: 'Sessao iniciada e cookie `bentix_session` definido',
            headers: {
              'Set-Cookie': {
                description: 'Cookie HTTP-only da sessao autenticada.',
                schema: {
                  type: 'string',
                },
              },
            },
            content: jsonContent(ref('LoginResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '429': { $ref: '#/components/responses/RateLimited' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Terminar sessao',
        description: 'Limpa o cookie de sessao atual e devolve `{ success: true }`.',
        responses: {
          '200': {
            description: 'Sessao terminada',
            headers: {
              'Set-Cookie': {
                description: 'Cookie `bentix_session` expirado.',
                schema: {
                  type: 'string',
                },
              },
            },
            content: jsonContent(ref('LogoutResponse')),
          },
        },
      },
    },
    '/api/auth/payload-key': {
      get: {
        tags: ['Auth'],
        summary: 'Obter chave publica para payload protegido',
        description: 'Devolve a chave publica PEM usada para cifrar payloads sensiveis no cliente.',
        responses: {
          '200': {
            description: 'Chave publica disponivel',
            content: jsonContent(ref('PublicKeyResponse')),
          },
          '503': {
            description: 'Protecao de login nao configurada',
            content: jsonContent(ref('ErrorResponse')),
          },
        },
      },
    },
    '/api/account/password': {
      patch: {
        tags: ['Account'],
        summary: 'Alterar a propria palavra-passe',
        security: [{ sessionCookie: [] }],
        description: protectedPayloadDescription({
          currentPassword: 'Atual123!',
          newPassword: 'Nova123!',
          confirmPassword: 'Nova123!',
        }),
        requestBody: {
          required: true,
          content: jsonContent(ref('ProtectedPayloadEnvelope')),
        },
        responses: {
          '200': {
            description: 'Palavra-passe atualizada',
            content: jsonContent(ref('MessageResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/clients': {
      get: {
        tags: ['Clients'],
        summary: 'Listar clientes',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Lista de clientes',
            content: jsonContent({
              type: 'array',
              items: ref('Client'),
            }),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Clients'],
        summary: 'Criar cliente',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('ClientInput')),
        },
        responses: {
          '201': {
            description: 'Cliente criado',
            content: jsonContent(ref('Client')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/clients/{id}': {
      get: {
        tags: ['Clients'],
        summary: 'Obter cliente por id',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Cliente encontrado',
            content: jsonContent(ref('Client')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Clients'],
        summary: 'Atualizar cliente',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('ClientUpdateInput')),
        },
        responses: {
          '200': {
            description: 'Cliente atualizado',
            content: jsonContent(ref('Client')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Clients'],
        summary: 'Remover cliente',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Cliente removido',
            content: jsonContent(ref('MessageResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/people': {
      get: {
        tags: ['People'],
        summary: 'Listar pessoas',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Lista de pessoas',
            content: jsonContent({
              type: 'array',
              items: ref('Person'),
            }),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['People'],
        summary: 'Criar pessoa',
        security: [{ sessionCookie: [] }],
        description: protectedPayloadDescription({
          name: 'Joao Silva',
          price: 10,
          monthlyPrice: 0,
          role: 'trolha',
          accessIdentity: {
            username: 'joao.silva',
            password: 'Secret123!',
            works: [1, 2],
          },
        }),
        requestBody: {
          required: true,
          content: jsonContent(ref('ProtectedPayloadEnvelope')),
        },
        responses: {
          '201': {
            description: 'Pessoa criada',
            content: jsonContent(ref('Person')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/people/{id}': {
      get: {
        tags: ['People'],
        summary: 'Obter pessoa por id',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Pessoa encontrada',
            content: jsonContent(ref('Person')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['People'],
        summary: 'Atualizar pessoa',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        description: protectedPayloadDescription({
          name: 'Joao Silva',
          price: 11,
          monthlyPrice: 0,
          role: 'trolha',
          accessIdentity: {
            username: 'joao.silva',
            password: 'Secret123!',
            works: [1, 2],
          },
        }),
        requestBody: {
          required: true,
          content: jsonContent(ref('ProtectedPayloadEnvelope')),
        },
        responses: {
          '200': {
            description: 'Pessoa atualizada',
            content: jsonContent(ref('Person')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['People'],
        summary: 'Remover pessoa',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Pessoa removida',
            content: jsonContent(ref('MessageResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/people/{id}/documents': {
      get: {
        tags: ['People Documents'],
        summary: 'Listar documentos de uma pessoa',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Lista de documentos',
            content: jsonContent({
              type: 'array',
              items: ref('PersonDocumentReminder'),
            }),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['People Documents'],
        summary: 'Criar documento de uma pessoa',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('PersonDocumentReminderInput')),
        },
        responses: {
          '201': {
            description: 'Documento criado',
            content: jsonContent(ref('PersonDocumentReminder')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/people/{id}/documents/{documentId}': {
      put: {
        tags: ['People Documents'],
        summary: 'Atualizar documento de uma pessoa',
        security: [{ sessionCookie: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdPath' },
          { $ref: '#/components/parameters/DocumentIdPath' },
        ],
        requestBody: {
          required: true,
          content: jsonContent(ref('PersonDocumentReminderInput')),
        },
        responses: {
          '200': {
            description: 'Documento atualizado',
            content: jsonContent(ref('PersonDocumentReminder')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['People Documents'],
        summary: 'Remover documento de uma pessoa',
        security: [{ sessionCookie: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdPath' },
          { $ref: '#/components/parameters/DocumentIdPath' },
        ],
        responses: {
          '200': {
            description: 'Documento removido',
            content: jsonContent(ref('MessageResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/works': {
      get: {
        tags: ['Works'],
        summary: 'Listar obras',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Lista de obras',
            content: jsonContent({
              type: 'array',
              items: ref('Work'),
            }),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Works'],
        summary: 'Criar obra',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('WorkInput')),
        },
        responses: {
          '201': {
            description: 'Obra criada',
            content: jsonContent(ref('Work')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/works/{id}': {
      get: {
        tags: ['Works'],
        summary: 'Obter obra por id',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Obra encontrada',
            content: jsonContent(ref('Work')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Works'],
        summary: 'Atualizar obra',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('WorkUpdateInput')),
        },
        responses: {
          '200': {
            description: 'Obra atualizada',
            content: jsonContent(ref('Work')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Works'],
        summary: 'Remover obra',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Obra removida',
            content: jsonContent(ref('MessageResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/clients/{id}/summary-export': {
      post: {
        tags: ['Clients'],
        summary: 'Exportar resumo de cliente em XLSX',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent({
            type: 'object',
            required: ['workIds', 'startMonth', 'endMonth', 'summaryName'],
            properties: {
              workIds: {
                type: 'array',
                minItems: 1,
                maxItems: 100,
                items: { type: 'integer', minimum: 1 },
              },
              startMonth: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
              endMonth: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
              summaryName: { type: 'string', minLength: 1, maxLength: 120 },
            },
          }),
        },
        responses: {
          '200': {
            description: 'Resumo combinado exportado em XLSX',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/work-plans': {
      get: {
        tags: ['Work Plans'],
        summary: 'Listar work plans',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Lista de work plans',
            content: jsonContent({
              type: 'array',
              items: ref('WorkPlan'),
            }),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Work Plans'],
        summary: 'Criar work plan',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('WorkPlanCreateInput')),
        },
        responses: {
          '201': {
            description: 'Work plan criado',
            content: jsonContent(ref('WorkPlan')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/work-plans/{id}': {
      get: {
        tags: ['Work Plans'],
        summary: 'Obter work plan por id',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Work plan encontrado',
            content: jsonContent(ref('WorkPlan')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Work Plans'],
        summary: 'Atualizar work plan',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('WorkPlanUpdateInput')),
        },
        responses: {
          '200': {
            description: 'Work plan atualizado',
            content: jsonContent(ref('WorkPlan')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Work Plans'],
        summary: 'Remover work plan',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Work plan removido',
            content: jsonContent(ref('MessageResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/work-assignments': {
      get: {
        tags: ['Work Assignments'],
        summary: 'Listar afetacoes',
        security: [{ sessionCookie: [] }],
        parameters: [
          { $ref: '#/components/parameters/WorkPlanIdQuery' },
          { $ref: '#/components/parameters/WorkIdQuery' },
          { $ref: '#/components/parameters/PersonIdQuery' },
          { $ref: '#/components/parameters/DateQuery' },
          { $ref: '#/components/parameters/IncludeDefaultsQuery' },
          { $ref: '#/components/parameters/PreviewPersonIdQuery' },
          { $ref: '#/components/parameters/PreviewChefQuery' },
        ],
        responses: {
          '200': {
            description: 'Lista de afetacoes ou lista com defaults',
            content: jsonContent({
              oneOf: [
                {
                  type: 'array',
                  items: ref('WorkAssignment'),
                },
                ref('WorkAssignmentListWithDefaults'),
              ],
            }),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Work Assignments'],
        summary: 'Criar afetacao',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('WorkAssignmentInput')),
        },
        responses: {
          '201': {
            description: 'Afetacao criada',
            content: jsonContent(ref('WorkAssignment')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/work-assignments/{id}': {
      get: {
        tags: ['Work Assignments'],
        summary: 'Obter afetacao por id',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Afetacao encontrada',
            content: jsonContent(ref('WorkAssignment')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Work Assignments'],
        summary: 'Atualizar afetacao',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('WorkAssignmentUpdateInput')),
        },
        responses: {
          '200': {
            description: 'Afetacao atualizada',
            content: jsonContent(ref('WorkAssignment')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Work Assignments'],
        summary: 'Remover afetacao',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Afetacao removida',
            content: jsonContent(ref('MessageResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/work-assignments/{id}/submit': {
      patch: {
        tags: ['Work Assignments'],
        summary: 'Submeter horas',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Afetacao submetida',
            content: jsonContent(ref('WorkAssignment')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },
    '/api/work-assignments/{id}/approve': {
      put: {
        tags: ['Work Assignments'],
        summary: 'Aprovar horas',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('WorkAssignmentApproveInput')),
        },
        responses: {
          '200': {
            description: 'Afetacao aprovada',
            content: jsonContent(ref('WorkAssignment')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },
    '/api/materials': {
      get: {
        tags: ['Materials'],
        summary: 'Listar materiais',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Lista de materiais',
            content: jsonContent({
              type: 'array',
              items: ref('Material'),
            }),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Materials'],
        summary: 'Criar material',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('MaterialInput')),
        },
        responses: {
          '201': {
            description: 'Material criado',
            content: jsonContent(ref('Material')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/materials/{id}': {
      get: {
        tags: ['Materials'],
        summary: 'Obter material por id',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Material encontrado',
            content: jsonContent(ref('Material')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Materials'],
        summary: 'Atualizar material',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('MaterialInput')),
        },
        responses: {
          '200': {
            description: 'Material atualizado',
            content: jsonContent(ref('Material')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Materials'],
        summary: 'Remover material',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Material removido',
            content: jsonContent(ref('MessageResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/calendar-events': {
      get: {
        tags: ['Calendar'],
        summary: 'Listar eventos de calendario',
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: 'year',
            in: 'query',
            schema: { type: 'integer' },
          },
          {
            name: 'month',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 12 },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de eventos',
            content: jsonContent({
              type: 'array',
              items: ref('CalendarEvent'),
            }),
          },
          '401': { $ref: '#/components/responses/SessionExpired' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
      post: {
        tags: ['Calendar'],
        summary: 'Criar evento de calendario',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('CalendarEventInput')),
        },
        responses: {
          '201': {
            description: 'Evento criado',
            content: jsonContent(ref('CalendarEvent')),
          },
          '401': { $ref: '#/components/responses/SessionExpired' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
      put: {
        tags: ['Calendar'],
        summary: 'Atualizar evento de calendario',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('CalendarEventUpdateInput')),
        },
        responses: {
          '200': {
            description: 'Evento atualizado',
            content: jsonContent(ref('CalendarEvent')),
          },
          '401': { $ref: '#/components/responses/SessionExpired' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
      delete: {
        tags: ['Calendar'],
        summary: 'Remover evento de calendario',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('CalendarEventDeleteInput')),
        },
        responses: {
          '200': {
            description: 'Resultado da remocao',
            content: jsonContent(ref('BooleanResult')),
          },
          '401': { $ref: '#/components/responses/SessionExpired' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },
    '/api/daily-work-notes': {
      get: {
        tags: ['Daily Work Notes'],
        summary: 'Listar notas diarias',
        security: [{ sessionCookie: [] }],
        parameters: [
          { $ref: '#/components/parameters/DateQuery' },
          { $ref: '#/components/parameters/WorkIdQuery' },
          { $ref: '#/components/parameters/PreviewPersonIdQuery' },
          { $ref: '#/components/parameters/PreviewChefQuery' },
        ],
        responses: {
          '200': {
            description: 'Lista de notas',
            content: jsonContent({
              type: 'array',
              items: ref('DailyWorkNote'),
            }),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
      put: {
        tags: ['Daily Work Notes'],
        summary: 'Criar ou atualizar nota diaria',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('DailyWorkNoteInput')),
        },
        responses: {
          '200': {
            description: 'Nota guardada',
            content: jsonContent(ref('DailyWorkNote')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
      delete: {
        tags: ['Daily Work Notes'],
        summary: 'Remover notas diarias',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('DailyWorkNotesDeleteInput')),
        },
        responses: {
          '200': {
            description: 'Numero de notas removidas',
            content: jsonContent(ref('RemovedCountResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },
    '/api/people/{id}/activity-history': {
      get: {
        tags: ['Activity History'],
        summary: 'Exportar historico de atividades de uma pessoa',
        security: [{ sessionCookie: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdPath' },
          {
            name: 'format',
            in: 'query',
            description: 'Formato do ficheiro devolvido. Se omitido, devolve PDF.',
            schema: {
              type: 'string',
              enum: ['pdf', 'csv'],
              default: 'pdf',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Ficheiro de exportacao individual',
            content: {
              ...binaryContent('application/pdf'),
              ...binaryContent('text/csv'),
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/activity-history/export': {
      get: {
        tags: ['Activity History'],
        summary: 'Exportar historico global',
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['all', 'day', 'week', 'month', 'year'],
              default: 'all',
            },
          },
          {
            name: 'referenceDate',
            in: 'query',
            schema: {
              type: 'string',
              format: 'date',
            },
          },
          { $ref: '#/components/parameters/PersonIdQuery' },
          { $ref: '#/components/parameters/WorkIdQuery' },
        ],
        responses: {
          '200': {
            description: 'CSV de exportacao global',
            content: binaryContent('text/csv'),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/access-identities': {
      get: {
        tags: ['Access Identities'],
        summary: 'Listar identidades de acesso',
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: 'includeWorks',
            in: 'query',
            schema: {
              type: 'boolean',
              default: false,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de identidades ou lista acompanhada de obras disponiveis',
            content: jsonContent({
              oneOf: [
                {
                  type: 'array',
                  items: ref('AccessIdentity'),
                },
                ref('AccessIdentityListWithWorks'),
              ],
            }),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/developer/users': {
      get: {
        tags: ['Developer Users'],
        summary: 'Listar contas tecnicas',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Overview de contas tecnicas',
            content: jsonContent(ref('DeveloperUsersOverviewResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/developer/users/{id}': {
      get: {
        tags: ['Developer Users'],
        summary: 'Obter detalhe de conta tecnica',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Detalhe da conta tecnica',
            content: jsonContent(ref('DeveloperUserDetail')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        tags: ['Developer Users'],
        summary: 'Atualizar conta tecnica',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('DeveloperUserUpdateInput')),
        },
        responses: {
          '200': {
            description: 'Conta tecnica atualizada',
            content: jsonContent(ref('DeveloperUserUpdateResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/users/reset-password': {
      post: {
        tags: ['Developer Users'],
        summary: 'Redefinir palavra-passe tecnica',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('DeveloperUserResetPasswordInput')),
        },
        responses: {
          '200': {
            description: 'Palavra-passe temporaria criada',
            content: jsonContent(ref('DeveloperUserResetPasswordResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/access-profiles': {
      get: {
        tags: ['Developer Access Profiles'],
        summary: 'Listar perfis de acesso',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Overview dos perfis de acesso',
            content: jsonContent(ref('DeveloperAccessProfilesOverviewResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/developer/access-profiles/{id}': {
      get: {
        tags: ['Developer Access Profiles'],
        summary: 'Obter detalhe de perfil de acesso',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Perfil encontrado',
            content: jsonContent(ref('DeveloperAccessProfileDetailResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/access-profiles/{id}/permissions': {
      put: {
        tags: ['Developer Access Profiles'],
        summary: 'Atualizar permissoes de perfil',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('DeveloperAccessProfilePermissionsInput')),
        },
        responses: {
          '200': {
            description: 'Permissoes do perfil atualizadas',
            content: jsonContent(ref('DeveloperAccessProfileUpdateResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/permissions': {
      get: {
        tags: ['Developer Permissions'],
        summary: 'Listar catalogo de permissoes',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Catalogo de permissoes',
            content: jsonContent(ref('DeveloperPermissionsResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/developer/feature-flags': {
      get: {
        tags: ['Developer Feature Flags'],
        summary: 'Listar feature flags',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Lista de feature flags',
            content: jsonContent(ref('DeveloperFeatureFlagsResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      put: {
        tags: ['Developer Feature Flags'],
        summary: 'Atualizar feature flag',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('DeveloperFeatureFlagUpdateInput')),
        },
        responses: {
          '200': {
            description: 'Lista atualizada de feature flags',
            content: jsonContent(ref('DeveloperFeatureFlagsResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/developer/daily-plan-overrides/work-assignments': {
      post: {
        tags: ['Developer Overrides'],
        summary: 'Criar afetacao com override tecnico do lock das 08h',
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: jsonContent(ref('DeveloperOverrideWorkAssignmentInput')),
        },
        responses: {
          '201': {
            description: 'Afetacao criada com audit trail tecnico',
            content: jsonContent(ref('DeveloperOverrideWorkAssignmentMutationResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/daily-plan-overrides/work-assignments/{id}': {
      get: {
        tags: ['Developer Overrides'],
        summary: 'Obter afetacao elegivel para override tecnico',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Afetacao devolvida no envelope tecnico',
            content: jsonContent(ref('DeveloperOverrideWorkAssignmentGetResponse')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        tags: ['Developer Overrides'],
        summary: 'Atualizar afetacao com override tecnico do lock das 08h',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('DeveloperOverrideWorkAssignmentUpdateInput')),
        },
        responses: {
          '200': {
            description: 'Afetacao atualizada com audit trail tecnico',
            content: jsonContent(ref('DeveloperOverrideWorkAssignmentMutationResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Developer Overrides'],
        summary: 'Remover afetacao com override tecnico do lock das 08h',
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('DeveloperOverrideDeleteInput')),
        },
        responses: {
          '200': {
            description: 'Afetacao removida com audit trail tecnico',
            content: jsonContent(ref('DeveloperOverrideDeleteResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/audit-trail': {
      get: {
        tags: ['Developer Admin'],
        summary: 'Listar eventos de audit trail',
        security: [{ sessionCookie: [] }],
        description: 'Endpoint tecnico de administracao developer para consultar eventos auditados com filtros opcionais.',
        parameters: [
          {
            name: 'username',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'action',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'entity',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'result',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Eventos e estatisticas de auditoria',
            content: jsonContent(ref('AuditTrailResponse')),
          },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Developer Admin'],
        summary: 'Registar evento de audit trail',
        security: [{ sessionCookie: [] }],
        description: 'Endpoint tecnico de administracao developer para registar um evento auditado em nome da sessao atual.',
        requestBody: {
          required: true,
          content: jsonContent(ref('AuditTrailCreateInput')),
        },
        responses: {
          '200': {
            description: 'Evento auditado registado',
            content: jsonContent(ref('AuditTrailEntry')),
          },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/dashboard-export': {
      get: {
        tags: ['Developer Admin'],
        summary: 'Exportar dashboard developer em PDF',
        security: [{ sessionCookie: [] }],
        description: 'Exporta o dashboard tecnico recente em formato PDF com nome de ficheiro dinâmico.',
        responses: {
          '200': {
            description: 'PDF gerado com sucesso',
            headers: {
              'Content-Disposition': {
                description: 'Download attachment com nome `developer-recente-<data>.pdf`.',
                schema: {
                  type: 'string',
                },
              },
            },
            content: binaryContent('application/pdf'),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/developer/data-integrity': {
      get: {
        tags: ['Developer Admin'],
        summary: 'Obter relatorio de integridade de dados',
        security: [{ sessionCookie: [] }],
        description: 'Relatorio tecnico de integridade de dados com issues, contadores e estatisticas globais.',
        responses: {
          '200': {
            description: 'Relatorio de integridade',
            content: jsonContent(ref('DeveloperDataIntegrityReport')),
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Developer Admin'],
        summary: 'Aplicar correcao tecnica de integridade',
        security: [{ sessionCookie: [] }],
        description: 'Aplica uma correcao de integridade suportada. Mantem o workflow tecnico atual e pode devolver `409` quando a correcao ainda nao esta disponivel.',
        requestBody: {
          required: true,
          content: jsonContent(ref('DeveloperDataIntegrityFixInput')),
        },
        responses: {
          '200': {
            description: 'Correcao aplicada',
            content: jsonContent(ref('DeveloperDataIntegrityFixResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/data-management': {
      get: {
        tags: ['Developer Admin'],
        summary: 'Consultar estatisticas ou exportar dados tecnicos',
        security: [{ sessionCookie: [] }],
        description: 'Endpoint tecnico legacy de administracao. `action=stats` devolve estatisticas JSON; `action=export` devolve um ficheiro JSON para download.',
        parameters: [
          {
            name: 'action',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['stats', 'export'],
            },
          },
          {
            name: 'type',
            in: 'query',
            description: 'Usado apenas com `action=export`.',
            schema: {
              type: 'string',
              enum: ['full', 'all', 'people', 'works', 'companies', 'clients', 'assignments', 'notes', 'plans'],
              default: 'full',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Estatisticas JSON ou export JSON para download',
            headers: {
              'Content-Disposition': {
                description: 'Presente no modo `action=export`, com nome `backup-<type>-<YYYY-MM-DD>.json`.',
                schema: {
                  type: 'string',
                },
              },
            },
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    ref('DeveloperDataStats'),
                    ref('DeveloperDataExport'),
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/system-diagnostics': {
      get: {
        tags: ['Developer Admin'],
        summary: 'Obter diagnostico tecnico do sistema',
        security: [{ sessionCookie: [] }],
        description: 'Estado tecnico agregado do sistema, incluindo origem principal dos dados, base de dados, build, utilizadores online e resumo de migracao.',
        responses: {
          '200': {
            description: 'Diagnostico tecnico',
            content: jsonContent(ref('DeveloperSystemState')),
          },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/test-data': {
      get: {
        tags: ['Developer Admin'],
        summary: 'Gerar payloads de test data',
        security: [{ sessionCookie: [] }],
        description: 'Gera dados tecnicos de teste por `scenario` predefinido ou por `count` custom.',
        parameters: [
          {
            name: 'scenario',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['small', 'medium', 'large'],
            },
          },
          {
            name: 'count',
            in: 'query',
            schema: {
              type: 'integer',
              default: 10,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Payload de dados de teste',
            content: jsonContent(ref('DeveloperTestDataResponse')),
          },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/chefs': {
      get: {
        tags: ['Legacy Compatibility'],
        summary: 'Listar chefs legacy',
        description: 'Endpoint legacy de compatibilidade. Em modo MySQL usa identidades de acesso e pode devolver apenas a lista ou `{ items, works }` quando `includeWorks=true`.',
        parameters: [
          {
            name: 'includeWorks',
            in: 'query',
            schema: {
              type: 'boolean',
              default: false,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Lista legacy de chefs',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'array',
                      items: ref('AccessIdentity'),
                    },
                    ref('AccessIdentityListWithWorks'),
                  ],
                },
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Legacy Compatibility'],
        summary: 'Criar chef legacy',
        description: protectedPayloadDescription({
          personId: 1,
          username: 'chef.demo',
          password: 'Secret123!',
          works: [1, 2],
        }),
        requestBody: {
          required: true,
          content: jsonContent(ref('ProtectedPayloadEnvelope')),
        },
        responses: {
          '201': {
            description: 'Identidade legacy criada',
            content: jsonContent(ref('AccessIdentity')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/chefs/{id}': {
      get: {
        tags: ['Legacy Compatibility'],
        summary: 'Obter chef legacy por id',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Identidade legacy encontrada',
            content: jsonContent(ref('AccessIdentity')),
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        tags: ['Legacy Compatibility'],
        summary: 'Atualizar chef legacy',
        description: protectedPayloadDescription({
          personId: 1,
          username: 'chef.demo',
          password: 'Secret123!',
          works: [1, 2],
        }),
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        requestBody: {
          required: true,
          content: jsonContent(ref('ProtectedPayloadEnvelope')),
        },
        responses: {
          '200': {
            description: 'Identidade legacy atualizada',
            content: jsonContent(ref('AccessIdentity')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Legacy Compatibility'],
        summary: 'Remover chef legacy',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '200': {
            description: 'Identidade legacy removida',
            content: jsonContent(ref('MessageResponse')),
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/process': {
      get: {
        tags: ['Legacy Compatibility'],
        summary: 'Preview legacy do workbook de pessoas',
        description: 'Endpoint legacy de compatibilidade que le o workbook `data/pessoas.xlsx` e devolve um preview do separador processado.',
        responses: {
          '200': {
            description: 'Preview do workbook',
            content: jsonContent(ref('LegacyProcessPreview')),
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Legacy Compatibility'],
        summary: 'Importar workbook legacy de pessoas',
        description: 'Endpoint legacy de compatibilidade para importacao via ficheiro Excel. Em `BENTIX_DATA_SOURCE=mysql` a importacao continua bloqueada e devolve `409`.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Workbook importado com sucesso',
            content: jsonContent(ref('LegacyProcessImportResponse')),
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/developer/users/{id}/reset-password': {
      post: {
        tags: ['Developer Users', 'Legacy Compatibility'],
        summary: 'Alias legacy descontinuado para reset de password',
        deprecated: true,
        description: 'Endpoint legado mantido apenas para compatibilidade. O fluxo foi movido para `/api/developer/users/reset-password` e esta rota devolve sempre `410`.',
        parameters: [{ $ref: '#/components/parameters/IdPath' }],
        responses: {
          '410': {
            description: 'Endpoint descontinuado e movido',
            content: jsonContent(ref('ErrorResponse')),
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'bentix_session',
        description: 'Cookie de sessao HTTP-only emitido por `/api/auth/login`.',
      },
    },
    parameters: {
      IdPath: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'integer',
        },
      },
      DocumentIdPath: {
        name: 'documentId',
        in: 'path',
        required: true,
        schema: {
          type: 'integer',
        },
      },
      WorkPlanIdQuery: {
        name: 'workPlanId',
        in: 'query',
        schema: {
          type: 'integer',
        },
      },
      WorkIdQuery: {
        name: 'workId',
        in: 'query',
        schema: {
          type: 'integer',
        },
      },
      PersonIdQuery: {
        name: 'personId',
        in: 'query',
        schema: {
          type: 'integer',
        },
      },
      DateQuery: {
        name: 'date',
        in: 'query',
        schema: {
          type: 'string',
          format: 'date',
        },
      },
      IncludeDefaultsQuery: {
        name: 'includeDefaults',
        in: 'query',
        schema: {
          type: 'boolean',
          default: false,
        },
      },
      PreviewPersonIdQuery: {
        name: 'previewPersonId',
        in: 'query',
        description: 'Preview tecnico da perspetiva de um chefe especifico por pessoa. Disponivel apenas para sessao com gestao total.',
        schema: {
          type: 'integer',
        },
      },
      PreviewChefQuery: {
        name: 'previewChef',
        in: 'query',
        description: 'Preview tecnico da perspetiva de um chefe especifico por username. Disponivel apenas para sessao com gestao total.',
        schema: {
          type: 'string',
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Pedido invalido',
        content: jsonContent(ref('ErrorResponse')),
      },
      Unauthorized: {
        description: 'Sessao obrigatoria ou credenciais em falta',
        content: jsonContent(ref('ErrorResponse')),
      },
      SessionExpired: {
        description: 'Sessao expirada',
        content: jsonContent(ref('ErrorResponse')),
      },
      Forbidden: {
        description: 'Sem permissao',
        content: jsonContent(ref('ErrorResponse')),
      },
      NotFound: {
        description: 'Recurso nao encontrado',
        content: jsonContent(ref('ErrorResponse')),
      },
      Conflict: {
        description: 'Conflito de negocio ou integridade',
        content: jsonContent(ref('ErrorResponse')),
      },
      RateLimited: {
        description: 'Demasiadas tentativas',
        headers: {
          'Retry-After': {
            description: 'Segundos ate nova tentativa permitida.',
            schema: {
              type: 'string',
            },
          },
        },
        content: jsonContent(ref('ErrorResponse')),
      },
      ServiceUnavailable: {
        description: 'Funcionalidade ou modulo indisponivel',
        content: jsonContent(ref('ErrorResponse')),
      },
      InternalError: {
        description: 'Erro interno',
        content: jsonContent(ref('ErrorResponse')),
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
        },
      },
      MessageResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string' },
        },
      },
      RemovedCountResponse: {
        type: 'object',
        required: ['removedCount'],
        properties: {
          removedCount: { type: 'integer' },
        },
      },
      BooleanResult: {
        type: 'boolean',
      },
      ProtectedPayloadEnvelope: {
        type: 'object',
        required: ['protectedPayload'],
        properties: {
          protectedPayload: {
            type: 'object',
            required: ['encryptedKey', 'iv', 'ciphertext'],
            properties: {
              encryptedKey: { type: 'string' },
              iv: { type: 'string' },
              ciphertext: { type: 'string' },
            },
          },
        },
      },
      AnonymousSessionResponse: {
        type: 'object',
        required: ['authenticated'],
        properties: {
          authenticated: {
            type: 'boolean',
            enum: [false],
          },
        },
      },
      AuthenticatedSessionResponse: {
        type: 'object',
        required: ['authenticated', 'user'],
        properties: {
          authenticated: {
            type: 'boolean',
            enum: [true],
          },
          user: ref('SessionUser'),
        },
      },
      SessionUser: {
        type: 'object',
        required: ['id', 'personId', 'username', 'name', 'role', 'accountType', 'workIds'],
        properties: {
          id: { type: 'integer' },
          personId: { type: 'integer' },
          username: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string' },
          accountType: { type: 'string' },
          accessProfileId: { type: 'integer', nullable: true },
          accessProfile: { type: 'string', nullable: true },
          permissionKeys: {
            type: 'array',
            items: { type: 'string' },
          },
          workIds: {
            type: 'array',
            items: { type: 'integer' },
          },
        },
      },
      LoginResponse: {
        type: 'object',
        required: ['role', 'username', 'name', 'accountType', 'redirectTo'],
        properties: {
          role: { type: 'string' },
          username: { type: 'string' },
          name: { type: 'string' },
          accountType: { type: 'string' },
          redirectTo: { type: 'string' },
        },
      },
      LogoutResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean' },
        },
      },
      PublicKeyResponse: {
        type: 'object',
        required: ['publicKey'],
        properties: {
          publicKey: { type: 'string' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          vatNumber: { type: 'string', nullable: true },
          contactName: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          summaryLanguage: { type: 'string', enum: ['pt', 'fr', 'en', 'es'] },
        },
      },
      ClientInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          vatNumber: { type: 'string' },
          contactName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          notes: { type: 'string' },
          summaryLanguage: { type: 'string', enum: ['pt', 'fr', 'en', 'es'] },
        },
      },
      ClientUpdateInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          vatNumber: { type: 'string' },
          contactName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          notes: { type: 'string' },
          summaryLanguage: { type: 'string', enum: ['pt', 'fr', 'en', 'es'] },
        },
      },
      WorkReference: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          number: { type: 'string', nullable: true },
          name: { type: 'string' },
          clientId: { type: 'integer', nullable: true },
        },
      },
      PersonSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          defaultHourlyPrice: { type: 'number', nullable: true },
        },
      },
      AccessIdentity: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          personId: { type: 'integer', nullable: true },
          role: { type: 'string' },
          username: { type: 'string' },
          works: {
            type: 'array',
            items: ref('WorkReference'),
          },
          person: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              role: { type: 'string', nullable: true },
            },
          },
        },
      },
      AccessIdentityListWithWorks: {
        type: 'object',
        required: ['items', 'works'],
        properties: {
          items: {
            type: 'array',
            items: ref('AccessIdentity'),
          },
          works: {
            type: 'array',
            items: ref('WorkReference'),
          },
        },
      },
      Person: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          companyId: { type: 'integer', nullable: true },
          name: { type: 'string' },
          price: { type: 'number' },
          monthlyPrice: { type: 'number' },
          isMonthlyBilling: { type: 'boolean' },
          role: { type: 'string' },
          roleLabel: { type: 'string', nullable: true },
          hasDocumentAlert: { type: 'boolean', nullable: true },
          documentAlertStatus: { type: 'string', nullable: true },
          documentAlertLabel: { type: 'string', nullable: true },
          documentAlertCount: { type: 'integer', nullable: true },
          documentAlerts: {
            type: 'array',
            items: ref('PersonDocumentReminder'),
          },
        },
      },
      PersonDocumentReminder: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          personId: { type: 'integer' },
          name: { type: 'string' },
          expirationDate: { type: 'string', format: 'date', nullable: true },
          warningDate: { type: 'string', format: 'date', nullable: true },
          warningDays: { type: 'integer', nullable: true },
          warningDaysLabel: { type: 'string', nullable: true },
          status: { type: 'string', nullable: true },
          statusLabel: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      PersonDocumentReminderInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          expirationDate: { type: 'string', format: 'date' },
          warningDate: { type: 'string', format: 'date' },
          warningDays: { type: 'integer' },
          notes: { type: 'string' },
        },
      },
      Work: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          clientId: { type: 'integer' },
          companyId: { type: 'integer', nullable: true },
          number: { type: 'string', nullable: true },
          name: { type: 'string' },
          location: { type: 'string', nullable: true },
          status: { type: 'string', nullable: true },
          budget: { type: 'number', nullable: true },
          defaultHourlyCost: { type: 'number', nullable: true },
          roleHourlyCosts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          specialPersonHourlyCosts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          workingDays: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          notes: { type: 'string', nullable: true },
          startDate: { type: 'string', format: 'date', nullable: true },
          endDate: { type: 'string', format: 'date', nullable: true },
          repricedAssignmentsCount: { type: 'integer', nullable: true },
          pricingAppliedFrom: { type: 'string', format: 'date', nullable: true },
          pricingApplicationMode: { type: 'string', nullable: true },
        },
      },
      WorkInput: {
        type: 'object',
        required: ['name', 'clientId'],
        properties: {
          number: { type: 'string' },
          name: { type: 'string' },
          clientId: { type: 'integer' },
          location: { type: 'string' },
          status: { type: 'string' },
          budget: { type: 'number' },
          defaultHourlyCost: { type: 'number' },
          roleHourlyCosts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          specialPersonHourlyCosts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          workingDays: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          notes: { type: 'string' },
        },
      },
      WorkUpdateInput: {
        type: 'object',
        properties: {
          number: { type: 'string' },
          name: { type: 'string' },
          clientId: { type: 'integer' },
          location: { type: 'string' },
          status: { type: 'string' },
          budget: { type: 'number' },
          defaultHourlyCost: { type: 'number' },
          roleHourlyCosts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          specialPersonHourlyCosts: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          workingDays: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          notes: { type: 'string' },
          pricingChangeApplication: {
            type: 'object',
            properties: {
              startDate: { type: 'string', format: 'date' },
              mode: { type: 'string' },
            },
          },
        },
      },
      WorkPlan: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          companyId: { type: 'integer', nullable: true },
          date: { type: 'string', format: 'date' },
          clonedAssignments: { type: 'integer', nullable: true },
          clearedAssignments: { type: 'integer', nullable: true },
          reusedWorkPlan: { type: 'boolean', nullable: true },
          clonedFromDate: { type: 'string', format: 'date', nullable: true },
          clonedFromWorkPlanId: { type: 'integer', nullable: true },
        },
      },
      WorkPlanCreateInput: {
        type: 'object',
        required: ['date'],
        properties: {
          date: { type: 'string', format: 'date' },
          companyId: { type: 'integer' },
          clonePreviousDay: { type: 'boolean' },
        },
      },
      WorkPlanUpdateInput: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
        },
      },
      WorkAssignment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          workPlanId: { type: 'integer', nullable: true },
          workId: { type: 'integer' },
          personId: { type: 'integer' },
          date: { type: 'string', format: 'date', nullable: true },
          hours: { type: 'number' },
          dailyHours: { type: 'number', nullable: true },
          approvedHours: { type: 'number', nullable: true },
          submitted: { type: 'boolean' },
          submittedAt: { type: 'string', format: 'date-time', nullable: true },
          submittedBy: { type: 'string', nullable: true },
          hourlyCost: { type: 'number', nullable: true },
          manualHourlyCost: { type: 'boolean', nullable: true },
          hasWorkAccess: { type: 'boolean', nullable: true },
          notes: { type: 'string', nullable: true },
          adminApprovedAt: { type: 'string', format: 'date-time', nullable: true },
          adminApprovedBy: { type: 'string', nullable: true },
          work: { allOf: [ref('WorkReference')], nullable: true },
          person: { allOf: [ref('PersonSummary')], nullable: true },
          workPlan: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer' },
              date: { type: 'string', format: 'date' },
            },
          },
        },
      },
      WorkAssignmentInput: {
        type: 'object',
        required: ['workId', 'personId', 'hours'],
        anyOf: [
          { required: ['workPlanId'] },
          { required: ['date'] },
        ],
        properties: {
          workPlanId: { type: 'integer' },
          workId: { type: 'integer' },
          personId: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          hours: { type: 'number' },
          hourlyCost: { type: 'number' },
          manualHourlyCost: { type: 'boolean' },
          notes: { type: 'string' },
          hasWorkAccess: { type: 'boolean' },
        },
      },
      WorkAssignmentUpdateInput: {
        type: 'object',
        properties: {
          workPlanId: { type: 'integer' },
          workId: { type: 'integer' },
          personId: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          hours: { type: 'number' },
          hourlyCost: { type: 'number' },
          manualHourlyCost: { type: 'boolean' },
          notes: { type: 'string' },
          hasWorkAccess: { type: 'boolean' },
          submitted: { type: 'boolean' },
        },
      },
      WorkAssignmentApproveInput: {
        type: 'object',
        required: ['approvedHours'],
        properties: {
          approvedHours: { type: 'number', minimum: 0 },
        },
      },
      WorkAssignmentListWithDefaults: {
        type: 'object',
        required: ['items', 'defaults'],
        properties: {
          items: {
            type: 'array',
            items: ref('WorkAssignment'),
          },
          defaults: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
      Material: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          reference: { type: 'string', nullable: true },
          category: { type: 'string', nullable: true },
          unit: { type: 'string', nullable: true },
          quantity: { type: 'number' },
          minimumQuantity: { type: 'number' },
          location: { type: 'string', nullable: true },
          supplier: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
        },
      },
      MaterialInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          reference: { type: 'string' },
          category: { type: 'string' },
          unit: { type: 'string' },
          quantity: { type: 'number', minimum: 0 },
          minimumQuantity: { type: 'number', minimum: 0 },
          location: { type: 'string' },
          supplier: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      CalendarEvent: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          title: { type: 'string' },
          type: { type: 'string', nullable: true },
          transport: { type: 'string', nullable: true },
          airport: { type: 'string', nullable: true },
          destination: { type: 'string', nullable: true },
          departureDate: { type: 'string', format: 'date', nullable: true },
          arrivalDate: { type: 'string', format: 'date', nullable: true },
          departureTime: { type: 'string', nullable: true },
          arrivalTime: { type: 'string', nullable: true },
          color: { type: 'string', nullable: true },
          createdBy: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      CalendarEventInput: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          title: { type: 'string' },
          type: { type: 'string' },
          transport: { type: 'string' },
          airport: { type: 'string' },
          destination: { type: 'string' },
          departureDate: { type: 'string', format: 'date' },
          arrivalDate: { type: 'string', format: 'date' },
          departureTime: { type: 'string' },
          arrivalTime: { type: 'string' },
          color: { type: 'string' },
        },
      },
      CalendarEventUpdateInput: {
        allOf: [
          ref('CalendarEventInput'),
          {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'integer' },
            },
          },
        ],
      },
      CalendarEventDeleteInput: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
        },
      },
      DailyWorkNote: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          workId: { type: 'integer' },
          note: { type: 'string' },
          authorId: { type: 'integer', nullable: true },
          authorName: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
          work: { allOf: [ref('WorkReference')], nullable: true },
        },
      },
      DailyWorkNoteInput: {
        type: 'object',
        required: ['date', 'workId', 'note'],
        properties: {
          date: { type: 'string', format: 'date' },
          workId: { type: 'integer' },
          note: { type: 'string' },
        },
      },
      DailyWorkNotesDeleteInput: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: {
            type: 'array',
            items: { type: 'integer' },
          },
        },
      },
      PermissionDefinition: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
        },
      },
      FeatureFlag: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          enabled: { type: 'boolean' },
        },
      },
      DeveloperUserSummary: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          admins: { type: 'integer' },
          developers: { type: 'integer' },
          operational: { type: 'integer' },
          active: { type: 'integer' },
          inactive: { type: 'integer' },
          blocked: { type: 'integer' },
          withoutAccessProfile: { type: 'integer' },
        },
      },
      DeveloperManagedUser: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          personId: { type: 'integer', nullable: true },
          name: { type: 'string' },
          username: { type: 'string' },
          role: { type: 'string', nullable: true },
          roleLabel: { type: 'string', nullable: true },
          accountType: { type: 'string' },
          accountTypeLabel: { type: 'string' },
          accessProfileId: { type: 'integer', nullable: true },
          accessProfileKey: { type: 'string', nullable: true },
          accessProfileName: { type: 'string', nullable: true },
          accessProfileDescription: { type: 'string', nullable: true },
          hasExplicitAccessProfile: { type: 'boolean' },
          suggestedAccessProfileKey: { type: 'string', nullable: true },
          suggestedAccessProfileName: { type: 'string', nullable: true },
          active: { type: 'boolean' },
          blocked: { type: 'boolean' },
          statusKey: { type: 'string' },
          statusLabel: { type: 'string' },
          statusHelper: { type: 'string' },
          retryAfterSeconds: { type: 'integer', nullable: true },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
          deactivatedAt: { type: 'string', format: 'date-time', nullable: true },
          lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      DeveloperAccessProfileOption: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          key: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          permissionsCount: { type: 'integer', nullable: true },
          usersCount: { type: 'integer', nullable: true },
          isTechnicalProfile: { type: 'boolean' },
          hasCriticalDeveloperPermissions: { type: 'boolean' },
        },
      },
      DeveloperUsersOverviewResponse: {
        type: 'object',
        required: ['users', 'summary', 'accessProfiles'],
        properties: {
          users: {
            type: 'array',
            items: ref('DeveloperManagedUser'),
          },
          summary: ref('DeveloperUserSummary'),
          accessProfiles: {
            type: 'array',
            items: ref('DeveloperAccessProfileOption'),
          },
        },
      },
      DeveloperUserDetail: {
        type: 'object',
        additionalProperties: true,
        description: 'Payload de detalhe tecnico devolvido pela camada developer para uma conta concreta.',
      },
      DeveloperUserUpdateInput: {
        type: 'object',
        properties: {
          accessProfileId: { type: 'integer', nullable: true },
          active: { type: 'boolean' },
          unlockBlocked: { type: 'boolean' },
        },
      },
      DeveloperUserUpdateResponse: {
        type: 'object',
        additionalProperties: true,
        properties: {
          message: { type: 'string' },
        },
      },
      DeveloperUserResetPasswordInput: {
        type: 'object',
        required: ['userId', 'type'],
        properties: {
          userId: { type: 'integer' },
          type: {
            type: 'string',
            enum: ['admin', 'developer', 'operational'],
          },
        },
      },
      DeveloperUserResetPasswordResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          temporaryPassword: { type: 'string' },
          note: { type: 'string' },
        },
      },
      DeveloperAccessProfilesOverviewResponse: {
        type: 'object',
        required: ['profiles'],
        properties: {
          profiles: {
            type: 'array',
            items: ref('DeveloperAccessProfileOption'),
          },
        },
      },
      DeveloperAccessProfileDetail: {
        type: 'object',
        additionalProperties: true,
        properties: {
          id: { type: 'integer' },
          key: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          permissionKeys: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      DeveloperAccessProfileDetailResponse: {
        type: 'object',
        required: ['profile'],
        properties: {
          profile: ref('DeveloperAccessProfileDetail'),
        },
      },
      DeveloperAccessProfilePermissionsInput: {
        type: 'object',
        required: ['permissionKeys'],
        properties: {
          permissionKeys: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      DeveloperAccessProfileUpdateResponse: {
        type: 'object',
        required: ['profile', 'message'],
        properties: {
          profile: ref('DeveloperAccessProfileDetail'),
          message: { type: 'string' },
        },
      },
      DeveloperPermissionsResponse: {
        type: 'object',
        required: ['permissions'],
        properties: {
          permissions: {
            type: 'array',
            items: ref('PermissionDefinition'),
          },
        },
      },
      DeveloperFeatureFlagsResponse: {
        type: 'object',
        required: ['flags'],
        properties: {
          flags: {
            type: 'array',
            items: ref('FeatureFlag'),
          },
        },
      },
      DeveloperFeatureFlagUpdateInput: {
        type: 'object',
        required: ['key', 'enabled'],
        properties: {
          key: { type: 'string' },
          enabled: { type: 'boolean' },
        },
      },
      DeveloperOverrideWorkAssignmentInput: {
        allOf: [
          ref('WorkAssignmentInput'),
          {
            type: 'object',
            required: ['reason'],
            properties: {
              reason: { type: 'string' },
            },
          },
        ],
      },
      DeveloperOverrideWorkAssignmentUpdateInput: {
        allOf: [
          ref('WorkAssignmentUpdateInput'),
          {
            type: 'object',
            required: ['reason'],
            properties: {
              reason: { type: 'string' },
            },
          },
        ],
      },
      DeveloperOverrideWorkAssignmentGetResponse: {
        type: 'object',
        required: ['item'],
        properties: {
          item: ref('WorkAssignment'),
        },
      },
      DeveloperOverrideWorkAssignmentMutationResponse: {
        type: 'object',
        required: ['item', 'message', 'overrideEventId'],
        properties: {
          item: ref('WorkAssignment'),
          message: { type: 'string' },
          overrideEventId: { type: 'integer', nullable: true },
        },
      },
      DeveloperOverrideDeleteInput: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: { type: 'string' },
        },
      },
      DeveloperOverrideDeleteResponse: {
        type: 'object',
        required: ['message', 'overrideEventId'],
        properties: {
          message: { type: 'string' },
          overrideEventId: { type: 'integer', nullable: true },
        },
      },
      AuditTrailEntry: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' },
          username: { type: 'string' },
          action: { type: 'string' },
          entity: { type: 'string', nullable: true },
          entityId: {
            oneOf: [{ type: 'integer' }, { type: 'string' }],
            nullable: true,
          },
          details: {
            type: 'object',
            additionalProperties: true,
            nullable: true,
          },
          result: { type: 'string', nullable: true },
          errorMessage: { type: 'string', nullable: true },
        },
      },
      AuditTrailStats: {
        type: 'object',
        properties: {
          totalEvents: { type: 'integer' },
          byAction: {
            type: 'object',
            additionalProperties: { type: 'integer' },
          },
          byEntity: {
            type: 'object',
            additionalProperties: { type: 'integer' },
          },
          byUsername: {
            type: 'object',
            additionalProperties: { type: 'integer' },
          },
          successRate: { type: 'number', nullable: true },
          recentErrors: {
            type: 'array',
            items: ref('AuditTrailEntry'),
          },
        },
      },
      AuditTrailResponse: {
        type: 'object',
        required: ['logs', 'stats', 'filterCount'],
        properties: {
          logs: {
            type: 'array',
            items: ref('AuditTrailEntry'),
          },
          stats: ref('AuditTrailStats'),
          filterCount: { type: 'integer' },
        },
      },
      AuditTrailCreateInput: {
        type: 'object',
        additionalProperties: true,
        description: 'Payload tecnico livre, enriquecido no servidor com o `username` da sessao autenticada.',
      },
      DeveloperIntegrityIssue: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },
          category: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          affectedCount: { type: 'integer' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          fixable: { type: 'boolean' },
          fixLabel: { type: 'string', nullable: true },
          destructive: { type: 'boolean' },
        },
      },
      DeveloperDataIntegrityReport: {
        type: 'object',
        required: ['issues', 'statistics', 'hasIssues', 'issueCounts'],
        properties: {
          issues: {
            type: 'array',
            items: ref('DeveloperIntegrityIssue'),
          },
          statistics: {
            type: 'object',
            properties: {
              totalPeople: { type: 'integer' },
              totalWorks: { type: 'integer' },
              totalClients: { type: 'integer' },
              totalAssignments: { type: 'integer' },
              totalWorkPlans: { type: 'integer' },
              totalDailyNotes: { type: 'integer' },
              totalAccounts: { type: 'integer' },
              totalUsers: { type: 'integer' },
            },
          },
          hasIssues: { type: 'boolean' },
          issueCounts: {
            type: 'object',
            properties: {
              high: { type: 'integer' },
              medium: { type: 'integer' },
              low: { type: 'integer' },
            },
          },
        },
      },
      DeveloperDataIntegrityFixInput: {
        type: 'object',
        required: ['issueId'],
        properties: {
          issueId: { type: 'string' },
        },
      },
      DeveloperDataIntegrityFixResponse: {
        type: 'object',
        additionalProperties: true,
        description: 'Resultado tecnico da correcao aplicada. A forma exata depende do tipo de issue corrigido.',
      },
      DeveloperSystemCard: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          value: { type: 'string' },
          helper: { type: 'string', nullable: true },
          tone: { type: 'string', nullable: true },
        },
      },
      DeveloperSystemState: {
        type: 'object',
        required: ['generatedAt', 'cards', 'migration'],
        properties: {
          generatedAt: { type: 'string', format: 'date-time' },
          cards: {
            type: 'array',
            items: ref('DeveloperSystemCard'),
          },
          migration: {
            type: 'object',
            properties: {
              primaryDataSource: { type: 'string' },
              summary: {
                type: 'object',
                properties: {
                  mysql: { type: 'integer' },
                  json: { type: 'integer' },
                  hybrid: { type: 'integer' },
                },
              },
              entities: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
            },
          },
        },
      },
      DeveloperDataStats: {
        type: 'object',
        properties: {
          files: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              additionalProperties: true,
            },
          },
          totalSizeMB: { type: 'number' },
          entityCounts: {
            type: 'object',
            additionalProperties: { type: 'integer' },
          },
        },
      },
      DeveloperDataExport: {
        type: 'object',
        additionalProperties: true,
        description: 'Conteudo exportado em JSON. As chaves presentes dependem do `type` pedido.',
      },
      DeveloperTestDataBundle: {
        type: 'object',
        properties: {
          people: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          works: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          clients: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          workAssignments: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
      DeveloperTestDataResponse: {
        type: 'object',
        required: ['scenario', 'data'],
        properties: {
          scenario: { type: 'string' },
          count: { type: 'integer', nullable: true },
          data: ref('DeveloperTestDataBundle'),
        },
      },
      LegacyProcessPerson: {
        type: 'object',
        properties: {
          id: {
            oneOf: [{ type: 'integer' }, { type: 'string' }],
          },
          name: { type: 'string' },
          price: { type: 'number', nullable: true },
          monthlyPrice: { type: 'number', nullable: true },
          isMonthlyBilling: { type: 'boolean', nullable: true },
        },
      },
      LegacyProcessPreview: {
        type: 'object',
        required: ['sheetName', 'total', 'people'],
        properties: {
          sheetName: { type: 'string' },
          total: { type: 'integer' },
          people: {
            type: 'array',
            items: ref('LegacyProcessPerson'),
          },
        },
      },
      LegacyProcessImportResponse: {
        allOf: [
          ref('LegacyProcessPreview'),
          {
            type: 'object',
            required: ['message'],
            properties: {
              message: { type: 'string' },
            },
          },
        ],
      },
    },
  },
}

export default openApiPhase1
