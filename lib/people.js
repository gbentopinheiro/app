import * as xlsx from 'xlsx'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { resolveCompanyId } from './companies.js'
import {
  createPersonDb,
  deletePersonDb,
  getAllPeopleDb,
  getPersonByIdDb,
  updatePersonDb,
} from './db/people-db.js'
import { isMysqlDataSourceEnabled } from './data-source.js'
import { normalizeRole } from './roles.js'

const { read, readFile, utils } = xlsx

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const jsonFilePath = join(dataDir, 'people.json')

let people = []
let nextId = 1

function normalizeNameKey(name) {
  return String(name || '').trim().toLowerCase()
}

function normalizePerson(person, fallbackId) {
  const monthlyPrice = parseFloat(person.monthlyPrice) || 0
  const parsedId = parseInt(person.id)

  return {
    id: Number.isInteger(parsedId) && parsedId > 0 ? parsedId : fallbackId,
    companyId: resolveCompanyId(person.companyId),
    name: String(person.name || '').trim(),
    price: parseFloat(person.price) || 0,
    monthlyPrice,
    isMonthlyBilling: monthlyPrice > 0,
    role: normalizeRole(person.role),
  }
}

function normalizePeople(list) {
  return list
    .map((person, index) => normalizePerson(person, index + 1))
    .filter(person => person.name)
}

function syncNextId() {
  nextId = people.length === 0 ? 1 : Math.max(...people.map(person => person.id)) + 1
}

function persistPeople() {
  if (isMysqlDataSourceEnabled()) {
    return
  }

  writeFileSync(jsonFilePath, JSON.stringify(people, null, 2), 'utf8')
}

function parseWorkbookToPeople(workbook) {
  let sheetIndex = 0

  if (workbook.SheetNames.length >= 3) {
    sheetIndex = 2
  } else if (workbook.SheetNames.length >= 1) {
    sheetIndex = 0
  } else {
    return []
  }

  const sheetName = workbook.SheetNames[sheetIndex]
  const sheet = workbook.Sheets[sheetName]
  const data = utils.sheet_to_json(sheet, { header: 1 })
  const parsedPeople = []

  for (let i = 6; i < data.length; i++) {
    const row = data[i]
    const name = row?.[2]
    const hourlyPrice = parseFloat(row?.[35]) || 0
    const monthlyPrice = parseFloat(row?.[36]) || 0

    if (name && typeof name === 'string' && name.trim()) {
      parsedPeople.push({
        name: name.trim(),
        price: hourlyPrice,
        monthlyPrice
      })
    }
  }

  return normalizePeople(parsedPeople)
}

function loadPeopleFromStorage() {
  if (existsSync(jsonFilePath)) {
    try {
      const jsonData = JSON.parse(readFileSync(jsonFilePath, 'utf8'))
      people = normalizePeople(jsonData)
      syncNextId()
      return
    } catch (error) {
      console.error('Error loading people from JSON:', error.message)
    }
  }

  let dataFilePath = null

  if (existsSync(dataDir)) {
    const files = readdirSync(dataDir).filter(file => file.endsWith('.xlsx'))
    if (files.length > 0) {
      dataFilePath = join(dataDir, files[0])
    }
  }

  if (dataFilePath && existsSync(dataFilePath)) {
    try {
      let workbook
      try {
        workbook = readFile(dataFilePath)
      } catch (err) {
        workbook = read(dataFilePath, { type: 'file' })
      }

      people = parseWorkbookToPeople(workbook)
      syncNextId()
      persistPeople()
    } catch (error) {
      console.error('Error loading people from Excel:', error.message)
      people = []
      nextId = 1
    }
  }
}

loadPeopleFromStorage()

function normalizeDbError(error) {
  if (error?.code === 'P2003') {
    throw new Error('A empresa associada a esta pessoa nao existe')
  }

  throw error
}

function upsertPersonMirror(personData) {
  getAllPeople()

  const normalizedPerson = normalizePerson(personData, nextId)
  const existingIndex = people.findIndex(person => person.id === normalizedPerson.id)

  if (existingIndex >= 0) {
    people[existingIndex] = normalizedPerson
  } else {
    people.push(normalizedPerson)
  }

  syncNextId()
  persistPeople()
  return normalizedPerson
}

function removePersonMirror(id) {
  getAllPeople()

  const normalizedId = parseInt(id, 10)
  const existingIndex = people.findIndex(person => person.id === normalizedId)

  if (existingIndex === -1) {
    return false
  }

  people.splice(existingIndex, 1)
  syncNextId()
  persistPeople()
  return true
}

export function getAllPeople() {
  if (existsSync(jsonFilePath)) {
    loadPeopleFromStorage()
  }

  return people
}

export function getPersonById(id) {
  return getAllPeople().find(person => person.id === parseInt(id))
}

export function createPerson(data) {
  getAllPeople()

  const monthlyPrice = parseFloat(data.monthlyPrice) || 0
  const person = {
    id: nextId++,
    companyId: resolveCompanyId(data.companyId),
    name: String(data.name || '').trim(),
    price: parseFloat(data.price) || 0,
    monthlyPrice,
    isMonthlyBilling: monthlyPrice > 0,
    role: normalizeRole(data.role),
  }

  people.push(person)
  persistPeople()
  return person
}

export function replaceAllPeople(newPeople) {
  getAllPeople()

  const existingPeopleByName = new Map()

  for (const person of people) {
    const key = normalizeNameKey(person.name)
    const currentBucket = existingPeopleByName.get(key) || []
    currentBucket.push(person)
    existingPeopleByName.set(key, currentBucket)
  }

  let nextAvailableId = people.length === 0 ? 1 : Math.max(...people.map(person => person.id)) + 1

  people = newPeople
    .map(person => {
      const key = normalizeNameKey(person.name)
      const matchingPeople = existingPeopleByName.get(key) || []
      const existingPerson = matchingPeople.shift() || null

      return normalizePerson(
        {
          ...person,
          id: existingPerson?.id ?? nextAvailableId++,
          role: existingPerson?.role ?? person.role,
        },
        existingPerson?.id ?? nextAvailableId,
      )
    })
    .filter(person => person.name)

  syncNextId()
  persistPeople()
  return people
}

export function updatePerson(id, data) {
  getAllPeople()

  const index = people.findIndex(person => person.id === parseInt(id))
  if (index === -1) return null

  const monthlyPrice = data.monthlyPrice !== undefined ? (parseFloat(data.monthlyPrice) || 0) : people[index].monthlyPrice
  const updatedPerson = {
    ...people[index],
    ...data,
    companyId: data.companyId !== undefined ? resolveCompanyId(data.companyId) : people[index].companyId,
    name: data.name !== undefined ? String(data.name || '').trim() : people[index].name,
    price: data.price !== undefined ? (parseFloat(data.price) || 0) : people[index].price,
    monthlyPrice,
    isMonthlyBilling: monthlyPrice > 0,
    role: data.role !== undefined ? normalizeRole(data.role) : people[index].role,
  }

  people[index] = updatedPerson
  persistPeople()
  return updatedPerson
}

export function deletePerson(id) {
  getAllPeople()

  const index = people.findIndex(person => person.id === parseInt(id))
  if (index === -1) return false

  people.splice(index, 1)
  syncNextId()
  persistPeople()
  return true
}

export async function getAllPeopleData(filters = {}) {
  if (!isMysqlDataSourceEnabled()) {
    const companyId = filters.companyId !== undefined ? resolveCompanyId(filters.companyId) : null
    const role = filters.role !== undefined ? normalizeRole(filters.role) : null

    return getAllPeople().filter(person => {
      if (companyId !== null && Number(person.companyId) !== Number(companyId)) {
        return false
      }

      if (role !== null && person.role !== role) {
        return false
      }

      return true
    })
  }

  return getAllPeopleDb(filters)
}

export async function getPersonByIdData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return getPersonById(id)
  }

  return getPersonByIdDb(id)
}

export async function createPersonData(data) {
  if (!isMysqlDataSourceEnabled()) {
    return createPerson(data)
  }

  try {
    return await createPersonDb(data)
  } catch (error) {
    normalizeDbError(error)
  }
}

export async function updatePersonData(id, data) {
  if (!isMysqlDataSourceEnabled()) {
    return updatePerson(id, data)
  }

  try {
    return await updatePersonDb(id, data)
  } catch (error) {
    normalizeDbError(error)
  }
}

export async function deletePersonData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return deletePerson(id)
  }

  return deletePersonDb(id)
}

export { people }
