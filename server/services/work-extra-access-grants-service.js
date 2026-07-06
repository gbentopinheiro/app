import { resolveCompanyId } from '../../lib/companies.js'
import { getAllPeopleData } from '../../lib/people.js'
import { hasPermission } from '../../lib/permissions.js'
import { isChefRole } from '../../lib/roles.js'
import {
  buildWorkExtraAccessSelectionsByPerson,
  getAllWorkExtraAccessGrantsData,
  replaceWorkExtraAccessSelectionsData,
} from '../../lib/work-extra-access-grants.js'
import { getAllWorksData } from '../../lib/works.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message) {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

function normalizeSelectionMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([personId, workIds]) => [String(personId), Array.isArray(workIds) ? workIds : []]),
  )
}

export async function getWorkExtraAccessSelectionsService(session, searchParams) {
  ensurePermission(session, 'work_plans.update', 'Sem permissao para gerir acessos extra as obras.')

  const companyId = resolveCompanyId(searchParams.get('companyId'))
  const [people, works, grants] = await Promise.all([
    getAllPeopleData(),
    getAllWorksData(),
    getAllWorkExtraAccessGrantsData(),
  ])
  const allowedChefIds = new Set(
    people
      .filter(person => Number(person.companyId) === Number(companyId))
      .filter(person => isChefRole(person.role))
      .map(person => Number(person.id)),
  )
  const allowedWorkIds = new Set(
    works
      .filter(work => Number(work.companyId) === Number(companyId))
      .map(work => Number(work.id)),
  )
  const scopedGrants = grants.filter(
    grant =>
      allowedChefIds.has(Number(grant.personId)) &&
      allowedWorkIds.has(Number(grant.workId)),
  )

  return {
    selectionsByPersonId: buildWorkExtraAccessSelectionsByPerson(scopedGrants),
  }
}

export async function replaceWorkExtraAccessSelectionsService(session, body) {
  ensurePermission(session, 'work_plans.update', 'Sem permissao para gerir acessos extra as obras.')

  const companyId = resolveCompanyId(body?.companyId)
  const selectionsByPersonId = normalizeSelectionMap(body?.selectionsByPersonId)
  const [people, works] = await Promise.all([getAllPeopleData(), getAllWorksData()])
  const peopleById = new Map(
    people
      .filter(person => Number(person.companyId) === Number(companyId))
      .map(person => [Number(person.id), person]),
  )
  const worksById = new Map(
    works
      .filter(work => Number(work.companyId) === Number(companyId))
      .map(work => [Number(work.id), work]),
  )
  const normalizedSelections = {}

  for (const [personIdValue, workIds] of Object.entries(selectionsByPersonId)) {
    const personId = Number.parseInt(personIdValue, 10)
    const person = peopleById.get(personId)

    if (!Number.isInteger(personId) || !person) {
      throw new HttpError(400, `Pessoa ${personIdValue} nao encontrada.`)
    }

    if (!isChefRole(person.role)) {
      throw new HttpError(400, `${person.name} nao pode receber acessos extra a obras.`)
    }

    normalizedSelections[personId] = Array.from(
      new Set(
        (Array.isArray(workIds) ? workIds : [])
          .map(workIdValue => Number.parseInt(workIdValue, 10))
          .filter(workId => Number.isInteger(workId) && worksById.has(workId)),
      ),
    ).sort((left, right) => left - right)
  }

  const savedGrants = await replaceWorkExtraAccessSelectionsData(normalizedSelections)
  const scopedSavedGrants = savedGrants.filter(
    grant =>
      peopleById.has(Number(grant.personId)) &&
      worksById.has(Number(grant.workId)),
  )

  return {
    selectionsByPersonId: buildWorkExtraAccessSelectionsByPerson(scopedSavedGrants),
  }
}
