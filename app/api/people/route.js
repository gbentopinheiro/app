import { NextResponse } from 'next/server'
import { createPerson, deletePerson, getAllPeople } from '../../../lib/people.js'
import {
  createAccessIdentity,
  getAccessIdentityByPersonId,
  getAccessIdentityByUsername,
  updateAccessIdentity,
} from '../../../lib/access-identities.js'
import { roleRequiresAppAccess, roleUsesWorkScope } from '../../../lib/roles.js'

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
  const password = String(accessIdentity?.password || '').trim()

  if (!username) {
    throw new Error('username de acesso é obrigatório para o role selecionado')
  }

  if (!password && !existingAccessIdentity?.password) {
    throw new Error('password de acesso é obrigatória para o role selecionado')
  }

  return {
    personId,
    role,
    username,
    password: password || existingAccessIdentity.password,
    works: getIdentityWorks(accessIdentity, existingAccessIdentity, role),
  }
}

function syncAccessIdentityForPerson(personId, role, accessIdentity) {
  const currentAccessIdentity = getAccessIdentityByPersonId(personId)
  const unlinkedIdentityWithUsername = accessIdentity?.username
    ? getAccessIdentityByUsername(accessIdentity.username)
    : null
  const reusableAccessIdentity =
    currentAccessIdentity ||
    (unlinkedIdentityWithUsername && !unlinkedIdentityWithUsername.personId ? unlinkedIdentityWithUsername : null)
  const shouldPersistAccessIdentity =
    roleRequiresAppAccess(role) || Boolean(reusableAccessIdentity) || hasAccessConfiguration(accessIdentity)

  if (!shouldPersistAccessIdentity) {
    return null
  }

  const payload = getAccessPayload(personId, role, accessIdentity, reusableAccessIdentity)

  return reusableAccessIdentity
    ? updateAccessIdentity(reusableAccessIdentity.id, payload)
    : createAccessIdentity(payload)
}

function getErrorStatus(error) {
  const message = error.message || ''

  if (
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('Já existe') ||
    message.includes('role')
  ) {
    return 400
  }

  if (message.includes('não encontrada')) {
    return 404
  }

  return 500
}

export async function GET() {
  try {
    const people = getAllPeople()
    return NextResponse.json(people)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter pessoas' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, price, monthlyPrice, role, accessIdentity } = body

    if (!name || price === undefined || monthlyPrice === undefined) {
      return NextResponse.json({ error: 'Nome, preço e monthlyPrice são obrigatórios' }, { status: 400 })
    }

    if (Number(price) < 0 || Number(monthlyPrice) < 0) {
      return NextResponse.json({ error: 'Preço e monthlyPrice não podem ser negativos' }, { status: 400 })
    }

    const newPerson = createPerson({ name, price, monthlyPrice, role })

    try {
      syncAccessIdentityForPerson(newPerson.id, newPerson.role, accessIdentity)
    } catch (error) {
      deletePerson(newPerson.id)
      throw error
    }

    return NextResponse.json(newPerson, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Erro ao criar pessoa' }, { status: getErrorStatus(error) })
  }
}
