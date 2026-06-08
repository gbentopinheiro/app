import {
  ACCESS_PROFILE_ADMIN,
  ACCESS_PROFILE_CHEF,
  ACCESS_PROFILE_DEVELOPER,
  ACCESS_PROFILE_RESPONSAVEL,
  ACCESS_PROFILE_WORKER_NO_ACCESS,
  normalizeAccessProfile,
  resolveAccessProfileForUser,
} from './access-profiles.js'

export const PERMISSION_DEFINITIONS = Object.freeze([
  { key: 'account.read_self', name: 'Ler a propria conta', category: 'simple', description: 'Permite consultar a propria sessao e dados basicos de conta.' },
  { key: 'account.password.change_self', name: 'Alterar a propria palavra-passe', category: 'simple', description: 'Permite alterar a palavra-passe da conta autenticada.' },
  { key: 'account.notifications.manage_self', name: 'Gerir notificacoes proprias', category: 'simple', description: 'Permite ajustar preferencias pessoais de notificacoes.' },
  { key: 'dashboard.read', name: 'Ler dashboard', category: 'simple', description: 'Permite aceder ao dashboard principal da aplicacao.' },
  { key: 'notifications.read', name: 'Ler notificacoes', category: 'simple', description: 'Permite consultar a central de notificacoes.' },
  { key: 'activity_history.read_global', name: 'Ler historico global', category: 'simple', description: 'Permite consultar historico transversal da aplicacao.' },
  { key: 'people.read', name: 'Ler pessoas', category: 'simple', description: 'Permite consultar a area de pessoas.' },
  { key: 'people.read_full', name: 'Ler detalhe completo de pessoas', category: 'simple', description: 'Permite consultar o detalhe completo de uma pessoa.' },
  { key: 'people.create_basic', name: 'Criar pessoas em modo basico', category: 'simple', description: 'Permite criar pessoas com os campos minimos permitidos ao responsavel.' },
  { key: 'people.create_full', name: 'Criar pessoas em modo completo', category: 'simple', description: 'Permite criar pessoas com todos os campos operacionais.' },
  { key: 'people.update_basic', name: 'Editar pessoas em modo basico', category: 'simple', description: 'Permite editar dados basicos de pessoas.' },
  { key: 'people.update_full', name: 'Editar pessoas em modo completo', category: 'simple', description: 'Permite editar todos os dados de pessoas.' },
  { key: 'people.delete', name: 'Remover pessoas', category: 'simple', description: 'Permite remover pessoas da aplicacao.' },
  { key: 'people.documents.read', name: 'Ler documentos de pessoas', category: 'simple', description: 'Permite consultar documentos e alertas documentais.' },
  { key: 'people.documents.write', name: 'Criar documentos de pessoas', category: 'simple', description: 'Permite criar ou atualizar lembretes documentais.' },
  { key: 'people.documents.delete', name: 'Remover documentos de pessoas', category: 'simple', description: 'Permite apagar lembretes documentais.' },
  { key: 'people.activity_history.read', name: 'Ler historico de atividades por pessoa', category: 'simple', description: 'Permite exportar e consultar historico por pessoa.' },
  { key: 'access_identities.read', name: 'Ler identidades de acesso', category: 'simple', description: 'Permite consultar identidades operacionais e obras ligadas.' },
  { key: 'access_identities.manage', name: 'Gerir identidades de acesso', category: 'simple', description: 'Permite criar, editar e remover identidades de acesso.' },
  { key: 'clients.read', name: 'Ler clientes', category: 'simple', description: 'Permite consultar clientes.' },
  { key: 'clients.create', name: 'Criar clientes', category: 'simple', description: 'Permite criar clientes.' },
  { key: 'clients.update', name: 'Editar clientes', category: 'simple', description: 'Permite editar clientes.' },
  { key: 'clients.delete', name: 'Remover clientes', category: 'simple', description: 'Permite remover clientes.' },
  { key: 'works.read', name: 'Ler obras', category: 'simple', description: 'Permite consultar obras.' },
  { key: 'works.create', name: 'Criar obras', category: 'simple', description: 'Permite criar obras.' },
  { key: 'works.update', name: 'Editar obras', category: 'simple', description: 'Permite editar obras.' },
  { key: 'works.delete', name: 'Remover obras', category: 'simple', description: 'Permite remover obras.' },
  { key: 'works.special_pricing.manage', name: 'Gerir precos especiais de obra', category: 'simple', description: 'Permite gerir precos por role e por pessoa em cada obra.' },
  { key: 'works.annual_summary.read', name: 'Ler resumo anual de obras', category: 'simple', description: 'Permite consultar resumos anuais de clientes e obras.' },
  { key: 'works.annual_summary.export', name: 'Exportar resumo anual de obras', category: 'simple', description: 'Permite exportar os resumos anuais de clientes e obras.' },
  { key: 'work_plans.read', name: 'Ler planeamento diario', category: 'simple', description: 'Permite consultar o plano diario.' },
  { key: 'work_plans.create', name: 'Criar plano diario', category: 'simple', description: 'Permite criar planos diarios.' },
  { key: 'work_plans.copy_previous', name: 'Copiar plano anterior', category: 'simple', description: 'Permite copiar o plano do dia anterior.' },
  { key: 'work_plans.update', name: 'Editar plano diario', category: 'simple', description: 'Permite editar planos diarios.' },
  { key: 'work_plans.delete', name: 'Remover plano diario', category: 'simple', description: 'Permite remover planos diarios.' },
  { key: 'work_assignments.read', name: 'Ler afetacoes', category: 'simple', description: 'Permite consultar afetacoes.' },
  { key: 'work_assignments.create', name: 'Criar afetacoes', category: 'simple', description: 'Permite criar afetacoes.' },
  { key: 'work_assignments.update', name: 'Editar afetacoes', category: 'simple', description: 'Permite editar afetacoes.' },
  { key: 'work_assignments.delete', name: 'Remover afetacoes', category: 'simple', description: 'Permite remover afetacoes.' },
  { key: 'work_assignments.submit', name: 'Submeter horas', category: 'simple', description: 'Permite submeter horas registadas em afetacoes.' },
  { key: 'work_assignments.approve', name: 'Aprovar horas', category: 'simple', description: 'Permite aprovar horas submetidas.' },
  { key: 'daily_work_notes.read', name: 'Ler notas diarias', category: 'simple', description: 'Permite consultar notas diarias da obra.' },
  { key: 'daily_work_notes.write', name: 'Escrever notas diarias', category: 'simple', description: 'Permite criar ou atualizar notas diarias da obra.' },
  { key: 'daily_work_notes.delete', name: 'Remover notas diarias', category: 'simple', description: 'Permite remover notas diarias.' },
  { key: 'calendar.read', name: 'Ler calendario', category: 'simple', description: 'Permite consultar o calendario interno.' },
  { key: 'calendar.manage', name: 'Gerir calendario', category: 'simple', description: 'Permite criar, editar e remover eventos do calendario.' },
  { key: 'materials.read', name: 'Ler materiais', category: 'simple', description: 'Permite consultar o stock de materiais.' },
  { key: 'materials.create', name: 'Criar materiais', category: 'simple', description: 'Permite criar materiais.' },
  { key: 'materials.update', name: 'Editar materiais', category: 'simple', description: 'Permite editar materiais.' },
  { key: 'materials.delete', name: 'Remover materiais', category: 'simple', description: 'Permite remover materiais.' },
  { key: 'chef.mobile.use', name: 'Usar registo movel do chefe', category: 'simple', description: 'Permite usar a experiencia movel do chefe.' },
  { key: 'developer.dashboard.read', name: 'Ler dashboard tecnico', category: 'technical', description: 'Permite abrir o centro tecnico do programador.' },
  { key: 'developer.dashboard.export', name: 'Exportar dashboard tecnico', category: 'technical', description: 'Permite exportar o dashboard do programador.' },
  { key: 'developer.feature_flags.read', name: 'Ler feature flags', category: 'technical', description: 'Permite consultar feature flags.' },
  { key: 'developer.feature_flags.manage', name: 'Gerir feature flags', category: 'technical', description: 'Permite ativar e desativar feature flags.' },
  { key: 'developer.users.read', name: 'Ler utilizadores tecnicos', category: 'technical', description: 'Permite consultar utilizadores e ultimo login.' },
  { key: 'developer.users.reset_password', name: 'Redefinir passwords tecnicas', category: 'technical', description: 'Permite redefinir passwords de contas da aplicacao.' },
  { key: 'developer.audit.read', name: 'Ler auditoria tecnica', category: 'technical', description: 'Permite consultar logs e trilho de auditoria.' },
  { key: 'developer.audit.write', name: 'Escrever auditoria tecnica', category: 'technical', description: 'Permite registar entradas no trilho de auditoria.' },
  { key: 'developer.data_integrity.read', name: 'Ler integridade de dados', category: 'technical', description: 'Permite consultar verificacoes de integridade de dados.' },
  { key: 'developer.data_management.read', name: 'Ler gestao de dados', category: 'technical', description: 'Permite consultar estatisticas de dados.' },
  { key: 'developer.data_management.export', name: 'Exportar gestao de dados', category: 'technical', description: 'Permite exportar backups e snapshots de dados.' },
  { key: 'developer.diagnostics.read', name: 'Ler diagnosticos do sistema', category: 'technical', description: 'Permite consultar diagnosticos tecnicos do runtime.' },
  { key: 'developer.test_data.generate', name: 'Gerar dados de teste', category: 'technical', description: 'Permite gerar dados e cenarios de teste.' },
  { key: 'developer.work_plans.override_lock', name: 'Fazer override tecnico do lock do planeamento', category: 'technical', description: 'Permite corrigir planeamento diario apos o bloqueio das 08h em endpoints tecnicos dedicados.' },
  { key: 'developer.work_assignments.override_lock', name: 'Fazer override tecnico do lock das afetacoes', category: 'technical', description: 'Permite corrigir afetacoes apos o bloqueio das 08h em endpoints tecnicos dedicados.' },
])

const PERMISSION_KEYS = new Set(PERMISSION_DEFINITIONS.map(permission => permission.key))

export const ACCESS_PROFILE_PERMISSION_KEYS = Object.freeze({
  [ACCESS_PROFILE_ADMIN]: Object.freeze([
    'account.read_self',
    'account.password.change_self',
    'dashboard.read',
    'notifications.read',
    'activity_history.read_global',
    'people.read',
    'people.read_full',
    'people.create_full',
    'people.update_full',
    'people.delete',
    'people.documents.read',
    'people.documents.write',
    'people.documents.delete',
    'people.activity_history.read',
    'access_identities.read',
    'access_identities.manage',
    'clients.read',
    'clients.create',
    'clients.update',
    'clients.delete',
    'works.read',
    'works.create',
    'works.update',
    'works.delete',
    'works.special_pricing.manage',
    'works.annual_summary.read',
    'works.annual_summary.export',
    'work_plans.read',
    'work_plans.create',
    'work_plans.copy_previous',
    'work_plans.update',
    'work_plans.delete',
    'work_assignments.read',
    'work_assignments.create',
    'work_assignments.update',
    'work_assignments.delete',
    'work_assignments.approve',
    'daily_work_notes.read',
    'daily_work_notes.write',
    'daily_work_notes.delete',
    'calendar.read',
    'calendar.manage',
    'materials.read',
    'materials.create',
    'materials.update',
    'materials.delete',
  ]),
  [ACCESS_PROFILE_DEVELOPER]: Object.freeze([
    'account.read_self',
    'account.password.change_self',
    'activity_history.read_global',
    'developer.dashboard.read',
    'developer.dashboard.export',
    'developer.feature_flags.read',
    'developer.feature_flags.manage',
    'developer.users.read',
    'developer.users.reset_password',
    'developer.audit.read',
    'developer.audit.write',
    'developer.data_integrity.read',
    'developer.data_management.read',
    'developer.data_management.export',
    'developer.diagnostics.read',
    'developer.test_data.generate',
    'developer.work_plans.override_lock',
    'developer.work_assignments.override_lock',
  ]),
  [ACCESS_PROFILE_RESPONSAVEL]: Object.freeze([
    'account.read_self',
    'account.password.change_self',
    'dashboard.read',
    'notifications.read',
    'calendar.read',
    'calendar.manage',
    'people.read',
    'people.create_basic',
    'people.documents.read',
    'people.documents.write',
    'people.documents.delete',
  ]),
  [ACCESS_PROFILE_CHEF]: Object.freeze([
    'account.read_self',
    'account.password.change_self',
    'account.notifications.manage_self',
    'chef.mobile.use',
    'work_assignments.read',
    'work_assignments.create',
    'work_assignments.update',
    'work_assignments.submit',
    'daily_work_notes.read',
    'daily_work_notes.write',
  ]),
  [ACCESS_PROFILE_WORKER_NO_ACCESS]: Object.freeze([]),
})

function normalizePermissionKey(permissionKey) {
  return String(permissionKey || '').trim()
}

function resolveSessionAccessProfile(session) {
  if (!session) {
    return ACCESS_PROFILE_WORKER_NO_ACCESS
  }

  return normalizeAccessProfile(
    session.accessProfile || resolveAccessProfileForUser({ role: session.role, accountType: session.accountType }),
  )
}

export function getAccessProfilePermissionKeys(accessProfile) {
  const normalizedAccessProfile = normalizeAccessProfile(accessProfile)
  return ACCESS_PROFILE_PERMISSION_KEYS[normalizedAccessProfile] || ACCESS_PROFILE_PERMISSION_KEYS[ACCESS_PROFILE_WORKER_NO_ACCESS]
}

export function hasPermission(session, permissionKey) {
  const normalizedPermissionKey = normalizePermissionKey(permissionKey)

  if (!PERMISSION_KEYS.has(normalizedPermissionKey)) {
    return false
  }

  return getAccessProfilePermissionKeys(resolveSessionAccessProfile(session)).includes(normalizedPermissionKey)
}

export function hasAnyPermission(session, permissionKeys = []) {
  const candidatePermissionKeys = Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys]
  return candidatePermissionKeys.some(permissionKey => hasPermission(session, permissionKey))
}
