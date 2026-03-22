import * as xlsx from 'xlsx'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const { read, readFile, utils } = xlsx

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const jsonFilePath = join(dataDir, 'people.json')

let people = []
let nextId = 1

function normalizePeople(list) {
  return list.map((person, index) => {
    const monthlyPrice = parseFloat(person.monthlyPrice) || 0

    return {
      id: index + 1,
      name: String(person.name || '').trim(),
      price: parseFloat(person.price) || 0,
      monthlyPrice,
      isMonthlyBilling: monthlyPrice > 0
    }
  }).filter(person => person.name)
}

function persistPeople() {
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
      nextId = people.length + 1
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
      nextId = people.length + 1
      persistPeople()
    } catch (error) {
      console.error('Error loading people from Excel:', error.message)
      people = []
      nextId = 1
    }
  }
}

loadPeopleFromStorage()

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
    name: data.name,
    price: parseFloat(data.price) || 0,
    monthlyPrice,
    isMonthlyBilling: monthlyPrice > 0
  }

  people.push(person)
  persistPeople()
  return person
}

export function replaceAllPeople(newPeople) {
  people = normalizePeople(newPeople)
  nextId = people.length + 1
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
    price: data.price !== undefined ? (parseFloat(data.price) || 0) : people[index].price,
    monthlyPrice,
    isMonthlyBilling: monthlyPrice > 0
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
  people = normalizePeople(people)
  nextId = people.length + 1
  persistPeople()
  return true
}

export { people }
