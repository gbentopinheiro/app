import {
  createAccessIdentityData,
  deleteAccessIdentityByPersonIdData,
  getAccessIdentityByPersonIdData,
  getAccessIdentityByUsernameData,
  updateAccessIdentityData,
} from '../../lib/access-identities.js'
import { getAllPersonDocumentRemindersData } from '../../lib/person-document-reminders.js'
import {
  createPersonData,
  deletePersonData,
  getAllPeopleData,
  getPersonByIdData,
  updatePersonData,
} from '../../lib/people.js'
import { hasPermission } from '../../lib/permissions.js'
import { normalizePersonPricingInput } from '../../lib/person-pricing.js'
import {
  DEFAULT_ROLE,
  normalizeChefCategory,
  normalizeRole,
  isResponsavelRole,
  roleRequiresAppAccess,
  roleSupportsChefCategory,
  roleUsesWorkScope,
} from '../../lib/roles.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message) {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

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

async function syncAccessIdentityForPerson(personId, role, accessIdentity, { removeWhenNotRequired = false } = {}) {
  if (!roleRequiresAppAccess(role)) {
    if (removeWhenNotRequired) {
      await deleteAccessIdentityByPersonIdData(personId)
    }
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

function getPeopleMutationStatus(error) {
  const message = String(error?.message || '')

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

function toPeopleMutationError(error, fallbackMessage) {
  if (error instanceof HttpError) {
    return error
  }

  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  return new HttpError(getPeopleMutationStatus(error), message)
}

function normalizeChefCategoryForRole(role, chefCategory) {
  const normalizedRole = normalizeRole(role)
  const normalizedChefCategory = normalizeChefCategory(chefCategory)

  if (!roleSupportsChefCategory(normalizedRole)) {
    if (normalizedChefCategory) {
      throw new HttpError(400, 'A especializacao de chefe so pode ser usada no role Chefe de segunda.')
    }

    return null
  }

  if (!normalizedChefCategory) {
    throw new HttpError(400, 'Seleciona a especializacao do Chefe de segunda.')
  }

  return normalizedChefCategory
}

async function getDocumentAlertsByPersonId() {
  return (await getAllPersonDocumentRemindersData())
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

async function getPeopleListForResponsavel(people) {
  const documentAlertsByPersonId = await getDocumentAlertsByPersonId()

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

export async function getPeopleListService(session) {
  ensurePermission(session, 'people.read', 'Sem permissao para consultar pessoas.')

  const people = await getAllPeopleData()

  return isResponsavelRole(session.role) ? getPeopleListForResponsavel(people) : people
}

export async function createPersonService(session, body) {
  const canCreateFull = hasPermission(session, 'people.create_full')
  const canCreateBasic = hasPermission(session, 'people.create_basic')

  if (!canCreateFull && !canCreateBasic) {
    throw new HttpError(403, 'Sem permissao para criar pessoas.')
  }

  const { name, price, monthlyPrice, role, chefCategory, accessIdentity } = body || {}
  const normalizedPricing = normalizePersonPricingInput({ price, monthlyPrice })

  if (!canCreateFull) {
    if (!String(name || '').trim()) {
      throw new HttpError(400, 'Nome obrigatorio.')
    }

    const newPerson = await createPersonData({
      name,
      price: 0,
      monthlyPrice: 0,
      role: DEFAULT_ROLE,
    })

    return {
      id: newPerson.id,
      name: newPerson.name,
      hasDocumentAlert: false,
      documentAlertStatus: null,
      documentAlertLabel: '',
      documentAlertCount: 0,
      documentAlerts: [],
    }
  }

  if (!String(name || '').trim()) {
    throw new HttpError(400, 'Nome obrigatorio.')
  }

  if (normalizedPricing.price < 0 || normalizedPricing.monthlyPrice < 0) {
    throw new HttpError(400, 'Preco e monthlyPrice nao podem ser negativos')
  }

  try {
    const normalizedRole = normalizeRole(role)
    const normalizedChefCategory = normalizeChefCategoryForRole(normalizedRole, chefCategory)
    const newPerson = await createPersonData({
      name,
      price: normalizedPricing.price,
      monthlyPrice: normalizedPricing.monthlyPrice,
      role: normalizedRole,
      chefCategory: normalizedChefCategory,
    })

    try {
      await syncAccessIdentityForPerson(newPerson.id, newPerson.role, accessIdentity)
    } catch (error) {
      await deletePersonData(newPerson.id)
      throw error
    }

    return newPerson
  } catch (error) {
    throw toPeopleMutationError(error, 'Erro ao criar pessoa')
  }
}

export async function getPersonByIdService(session, id) {
  ensurePermission(session, 'people.read_full', 'Sem permissao para consultar esta pessoa.')

  const person = await getPersonByIdData(id)

  if (!person) {
    throw new HttpError(404, 'Pessoa nao encontrada')
  }

  return person
}

export async function updatePersonService(session, id, body) {
  ensurePermission(session, 'people.update_full', 'Sem permissao para atualizar pessoas.')

  const { name, price, monthlyPrice, role, chefCategory, accessIdentity } = body || {}
  const currentPerson = await getPersonByIdData(id)

  if (!currentPerson) {
    throw new HttpError(404, 'Pessoa nao encontrada')
  }

  const normalizedPrice = price !== undefined ? normalizePersonPricingInput({ price }).price : undefined
  const normalizedMonthlyPrice = monthlyPrice !== undefined ? normalizePersonPricingInput({ monthlyPrice }).monthlyPrice : undefined

  if (normalizedPrice !== undefined && normalizedPrice < 0) {
    throw new HttpError(400, 'Preco nao pode ser negativo')
  }

  if (normalizedMonthlyPrice !== undefined && normalizedMonthlyPrice < 0) {
    throw new HttpError(400, 'monthlyPrice nao pode ser negativo')
  }

  try {
    const nextRole = role !== undefined ? normalizeRole(role) : currentPerson.role
    const nextChefCategoryInput = chefCategory !== undefined ? chefCategory : currentPerson.chefCategory
    const nextChefCategory = normalizeChefCategoryForRole(nextRole, nextChefCategoryInput)
    const updatedPerson = await updatePersonData(id, {
      name,
      price: normalizedPrice,
      monthlyPrice: normalizedMonthlyPrice,
      role: nextRole,
      chefCategory: nextChefCategory,
    })

    if (!updatedPerson) {
      throw new HttpError(404, 'Pessoa nao encontrada')
    }

    try {
      await syncAccessIdentityForPerson(updatedPerson.id, updatedPerson.role, accessIdentity, {
        removeWhenNotRequired: true,
      })
    } catch (error) {
      await updatePersonData(id, {
        name: currentPerson.name,
        price: currentPerson.price,
        monthlyPrice: currentPerson.monthlyPrice,
        role: currentPerson.role,
        chefCategory: currentPerson.chefCategory,
      })
      throw error
    }

    return updatedPerson
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toPeopleMutationError(error, 'Erro ao atualizar pessoa')
  }
}

export async function deletePersonService(session, id) {
  ensurePermission(session, 'people.delete', 'Sem permissao para remover pessoas.')

  const person = await getPersonByIdData(id)

  if (!person) {
    throw new HttpError(404, 'Pessoa nao encontrada')
  }

  await deleteAccessIdentityByPersonIdData(id)
  const deleted = await deletePersonData(id)

  if (!deleted) {
    throw new HttpError(404, 'Pessoa nao encontrada')
  }

  return { message: 'Pessoa removida com sucesso' }
}
