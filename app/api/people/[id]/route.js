import { NextResponse } from 'next/server'
import { deletePerson, getPersonById, updatePerson } from '../../../../lib/people.js'
import {
  createAccessIdentity,
  deleteAccessIdentityByPersonId,
  getAccessIdentityByPersonId,
  getAccessIdentityByUsername,
  updateAccessIdentity,
} from '../../../../lib/access-identities.js'
import { roleRequiresAppAccess, roleUsesWorkScope } from '../../../../lib/roles.js'
import { readProtectedRequestJson } from '../../../../lib/login-transport.js'

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
  if (!roleRequiresAppAccess(role)) {
    deleteAccessIdentityByPersonId(personId)
    return null
  }

  const currentAccessIdentity = getAccessIdentityByPersonId(personId)
  const unlinkedIdentityWithUsername = accessIdentity?.username
    ? getAccessIdentityByUsername(accessIdentity.username)
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
    ? updateAccessIdentity(reusableAccessIdentity.id, payload)
    : createAccessIdentity(payload)
}

function getErrorStatus(error) {
  const message = error.message || ''

  if (
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('palavra-passe') ||
    message.includes('carácter') ||
    message.includes('bytes') ||
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

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const person = getPersonById(id)

    if (!person) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })
    }

    return NextResponse.json(person)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter pessoa' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await readProtectedRequestJson(request)
    const { name, price, monthlyPrice, role, accessIdentity } = body
    const currentPerson = getPersonById(id)

    if (!currentPerson) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })
    }

    if (price !== undefined && Number(price) < 0) {
      return NextResponse.json({ error: 'Preço não pode ser negativo' }, { status: 400 })
    }

    if (monthlyPrice !== undefined && Number(monthlyPrice) < 0) {
      return NextResponse.json({ error: 'monthlyPrice não pode ser negativo' }, { status: 400 })
    }

    const updatedPerson = updatePerson(id, { name, price, monthlyPrice, role })

    if (!updatedPerson) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })
    }

    try {
      syncAccessIdentityForPerson(updatedPerson.id, updatedPerson.role, accessIdentity)
    } catch (error) {
      updatePerson(id, {
        name: currentPerson.name,
        price: currentPerson.price,
        monthlyPrice: currentPerson.monthlyPrice,
        role: currentPerson.role,
      })
      throw error
    }

    return NextResponse.json(updatedPerson)
  } catch (error) {
    if (error.message?.includes('protecao') || error.message?.includes('protegido')) {
      return NextResponse.json({ error: 'Pedido sensível não protegido.' }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao atualizar pessoa' }, { status: getErrorStatus(error) })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const person = getPersonById(id)

    if (!person) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })
    }

    deleteAccessIdentityByPersonId(id)
    const deleted = deletePerson(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Pessoa removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover pessoa' }, { status: 500 })
  }
}
