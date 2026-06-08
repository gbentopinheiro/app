import { NextResponse } from 'next/server'
import { createPersonData, deletePersonData, getAllPeopleData } from '../../../lib/people.js'
import {
  createAccessIdentityData,
  getAccessIdentityByPersonIdData,
  getAccessIdentityByUsernameData,
  updateAccessIdentityData,
} from '../../../lib/access-identities.js'
import { getAllPersonDocumentReminders } from '../../../lib/person-document-reminders.js'
import { hasPermission } from '../../../lib/permissions.js'
import { getServerSession } from '../../../lib/server-session.js'
import { DEFAULT_ROLE, isResponsavelRole, roleRequiresAppAccess, roleUsesWorkScope } from '../../../lib/roles.js'
import { readProtectedRequestJson } from '../../../lib/login-transport.js'

function hasAccessConfiguration(accessIdentity) {
  return Boolean(
    String(accessIdentity?.username || '').trim() ||
    String(accessIdentity?.password || '').trim() ||
    (Array.isArray(accessIdentity?.works) && accessIdentity.works.length > 0),
  )
}

function getIdentityWorks(accessIdentity, existingAccessIdentity, role) {
  const works = Array.isArray(accessIdentity?.works)
    ? accessIdentity.works
    : Array.isArray(existingAccessIdentity?.works)
      ? existingAccessIdentity.works.map(work => work.id ?? work)
      : []

  return roleUsesWorkScope(role) ? works : []
}

function getAccessPayload(personId, role, accessIdentity, existingAccessIdentity = null) {
  const username = String(accessIdentity?.username || existingAccessIdentity?.username || '').trim()
  const password = String(accessIdentity?.password || '')

  if (!username) {
    throw new Error('username de acesso e obrigatorio para o role selecionado')
  }

  if (!password && !existingAccessIdentity?.password) {
    throw new Error('password de acesso e obrigatoria para o role selecionado')
  }

  return {
    personId,
    role,
    username,
    password: password || existingAccessIdentity.password,
    works: getIdentityWorks(accessIdentity, existingAccessIdentity, role),
  }
}

async function syncAccessIdentityForPerson(personId, role, accessIdentity) {
  if (!roleRequiresAppAccess(role)) {
    return null
  }

  const currentAccessIdentity = await getAccessIdentityByPersonIdData(personId)
  const unlinkedIdentityWithUsername = accessIdentity?.username
    ? await getAccessIdentityByUsernameData(accessIdentity.username)
    : null
  const reusableAccessIdentity =
    currentAccessIdentity ||
    (unlinkedIdentityWithUsername && !unlinkedIdentityWithUsername.personId ? unlinkedIdentityWithUsername : null)
  const shouldPersistAccessIdentity =
    Boolean(reusableAccessIdentity) || hasAccessConfiguration(accessIdentity)

  if (!shouldPersistAccessIdentity) {
    return null
  }

  const payload = getAccessPayload(personId, role, accessIdentity, reusableAccessIdentity)

  return reusableAccessIdentity
    ? updateAccessIdentityData(reusableAccessIdentity.id, payload)
    : createAccessIdentityData(payload)
}

function getErrorStatus(error) {
  const message = error.message || ''

  if (
    message.includes('obrigatorio') ||
    message.includes('obrigatoria') ||
    message.includes('palavra-passe') ||
    message.includes('caracter') ||
    message.includes('bytes') ||
    message.includes('Ja existe') ||
    message.includes('role')
  ) {
    return 400
  }

  if (message.includes('nao encontrada')) {
    return 404
  }

  return 500
}

function getDocumentAlertsByPersonId() {
  return getAllPersonDocumentReminders()
    .filter(reminder => reminder.status === 'expired' || reminder.status === 'warning')
    .reduce((alertsMap, reminder) => {
      const personId = Number(reminder.personId)

      if (personId <= 0) {
        return alertsMap
      }

      const currentAlert = alertsMap.get(personId)
      const nextPriority = reminder.status === 'expired' ? 0 : 1
      const currentPriority = currentAlert?.status === 'expired' ? 0 : 1

      if (!currentAlert || nextPriority < currentPriority) {
        alertsMap.set(personId, {
          status: reminder.status,
          statusLabel: reminder.statusLabel,
          count: 1,
          items: [
            {
              id: reminder.id,
              name: reminder.name,
              expirationDate: reminder.expirationDate,
              warningDate: reminder.warningDate,
              warningDaysLabel: reminder.warningDaysLabel,
              status: reminder.status,
              statusLabel: reminder.statusLabel,
            },
          ],
        })
        return alertsMap
      }

      alertsMap.set(personId, {
        ...currentAlert,
        count: currentAlert.count + 1,
        items: [
          ...(Array.isArray(currentAlert.items) ? currentAlert.items : []),
          {
            id: reminder.id,
            name: reminder.name,
            expirationDate: reminder.expirationDate,
            warningDate: reminder.warningDate,
            warningDaysLabel: reminder.warningDaysLabel,
            status: reminder.status,
            statusLabel: reminder.statusLabel,
          },
        ],
      })

      return alertsMap
    }, new Map())
}

function getPeopleListForResponsavel(people) {
  const documentAlertsByPersonId = getDocumentAlertsByPersonId()

  return people.map(person => ({
    id: person.id,
    name: person.name,
    hasDocumentAlert: documentAlertsByPersonId.has(Number(person.id)),
    documentAlertStatus: documentAlertsByPersonId.get(Number(person.id))?.status || null,
    documentAlertLabel: documentAlertsByPersonId.get(Number(person.id))?.statusLabel || '',
    documentAlertCount: documentAlertsByPersonId.get(Number(person.id))?.count || 0,
    documentAlerts: documentAlertsByPersonId.get(Number(person.id))?.items || [],
  }))
}

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'people.read')) {
      return NextResponse.json({ error: 'Sem permissao para consultar pessoas.' }, { status: 403 })
    }

    const people = await getAllPeopleData()

    return NextResponse.json(isResponsavelRole(session.role) ? getPeopleListForResponsavel(people) : people)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter pessoas' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    const canCreateFull = hasPermission(session, 'people.create_full')
    const canCreateBasic = hasPermission(session, 'people.create_basic')

    if (!canCreateFull && !canCreateBasic) {
      return NextResponse.json({ error: 'Sem permissao para criar pessoas.' }, { status: 403 })
    }

    const body = await readProtectedRequestJson(request)
    const { name, price, monthlyPrice, role, accessIdentity } = body

    if (!canCreateFull) {
      if (!String(name || '').trim()) {
        return NextResponse.json({ error: 'Nome obrigatorio.' }, { status: 400 })
      }

      const newPerson = await createPersonData({
        name,
        price: 0,
        monthlyPrice: 0,
        role: DEFAULT_ROLE,
      })

      return NextResponse.json({
        id: newPerson.id,
        name: newPerson.name,
        hasDocumentAlert: false,
        documentAlertStatus: null,
        documentAlertLabel: '',
        documentAlertCount: 0,
        documentAlerts: [],
      }, { status: 201 })
    }

    if (!name || price === undefined || monthlyPrice === undefined) {
      return NextResponse.json({ error: 'Nome, preco e monthlyPrice sao obrigatorios' }, { status: 400 })
    }

    if (Number(price) < 0 || Number(monthlyPrice) < 0) {
      return NextResponse.json({ error: 'Preco e monthlyPrice nao podem ser negativos' }, { status: 400 })
    }

    const newPerson = await createPersonData({ name, price, monthlyPrice, role })

    try {
      await syncAccessIdentityForPerson(newPerson.id, newPerson.role, accessIdentity)
    } catch (error) {
      await deletePersonData(newPerson.id)
      throw error
    }

    return NextResponse.json(newPerson, { status: 201 })
  } catch (error) {
    if (error.message?.includes('protecao') || error.message?.includes('protegido')) {
      return NextResponse.json({ error: 'Pedido sensivel nao protegido.' }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao criar pessoa' }, { status: getErrorStatus(error) })
  }
}
