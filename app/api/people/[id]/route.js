import { NextResponse } from 'next/server'
import { deletePersonData, getPersonByIdData, updatePersonData } from '../../../../lib/people.js'
import {
  createAccessIdentityData,
  deleteAccessIdentityByPersonIdData,
  getAccessIdentityByPersonIdData,
  getAccessIdentityByUsernameData,
  updateAccessIdentityData,
} from '../../../../lib/access-identities.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { roleRequiresAppAccess, roleUsesWorkScope } from '../../../../lib/roles.js'
import { getServerSession } from '../../../../lib/server-session.js'
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
    await deleteAccessIdentityByPersonIdData(personId)
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

export async function GET(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'people.read_full')) {
      return NextResponse.json({ error: 'Sem permissao para consultar esta pessoa.' }, { status: 403 })
    }

    const { id } = await params
    const person = await getPersonByIdData(id)

    if (!person) {
      return NextResponse.json({ error: 'Pessoa nao encontrada' }, { status: 404 })
    }

    return NextResponse.json(person)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter pessoa' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'people.update_full')) {
      return NextResponse.json({ error: 'Sem permissao para atualizar pessoas.' }, { status: 403 })
    }

    const { id } = await params
    const body = await readProtectedRequestJson(request)
    const { name, price, monthlyPrice, role, accessIdentity } = body
    const currentPerson = await getPersonByIdData(id)

    if (!currentPerson) {
      return NextResponse.json({ error: 'Pessoa nao encontrada' }, { status: 404 })
    }

    if (price !== undefined && Number(price) < 0) {
      return NextResponse.json({ error: 'Preco nao pode ser negativo' }, { status: 400 })
    }

    if (monthlyPrice !== undefined && Number(monthlyPrice) < 0) {
      return NextResponse.json({ error: 'monthlyPrice nao pode ser negativo' }, { status: 400 })
    }

    const updatedPerson = await updatePersonData(id, { name, price, monthlyPrice, role })

    if (!updatedPerson) {
      return NextResponse.json({ error: 'Pessoa nao encontrada' }, { status: 404 })
    }

    try {
      await syncAccessIdentityForPerson(updatedPerson.id, updatedPerson.role, accessIdentity)
    } catch (error) {
      await updatePersonData(id, {
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
      return NextResponse.json({ error: 'Pedido sensivel nao protegido.' }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao atualizar pessoa' }, { status: getErrorStatus(error) })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'people.delete')) {
      return NextResponse.json({ error: 'Sem permissao para remover pessoas.' }, { status: 403 })
    }

    const { id } = await params
    const person = await getPersonByIdData(id)

    if (!person) {
      return NextResponse.json({ error: 'Pessoa nao encontrada' }, { status: 404 })
    }

    await deleteAccessIdentityByPersonIdData(id)
    const deleted = await deletePersonData(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Pessoa nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Pessoa removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover pessoa' }, { status: 500 })
  }
}
