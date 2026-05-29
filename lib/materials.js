import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const materialsFilePath = join(dataDir, 'materials.json')
const allowedUnits = new Set(['un', 'cx', 'kg', 'l', 'm', 'm2', 'm3'])

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeQuantity(value) {
  const parsedValue = Number.parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? Number(parsedValue.toFixed(2)) : 0
}

function normalizeUnit(value) {
  const normalizedUnit = normalizeText(value).toLowerCase() || 'un'
  return allowedUnits.has(normalizedUnit) ? normalizedUnit : 'un'
}

export class Material {
  constructor(data) {
    this.id = data.id
    this.name = normalizeText(data.name)
    this.reference = normalizeText(data.reference)
    this.category = normalizeText(data.category)
    this.unit = normalizeUnit(data.unit)
    this.quantity = normalizeQuantity(data.quantity)
    this.minimumQuantity = normalizeQuantity(data.minimumQuantity)
    this.location = normalizeText(data.location)
    this.supplier = normalizeText(data.supplier)
    this.notes = normalizeText(data.notes)
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || this.createdAt
  }
}

export class MaterialsService {
  constructor(filePath = materialsFilePath) {
    this.filePath = filePath
    this.materials = this.load()
  }

  ensureDataDir() {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  load() {
    this.ensureDataDir()

    if (!existsSync(this.filePath)) {
      return []
    }

    try {
      const rawData = JSON.parse(readFileSync(this.filePath, 'utf8'))
      return normalizeMaterials(rawData)
    } catch (error) {
      console.error('Error loading materials:', error.message)
      return []
    }
  }

  save() {
    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.materials, null, 2), 'utf8')
  }

  refresh() {
    this.materials = this.load()
    return this.materials
  }

  getAll() {
    return this.refresh()
  }

  getById(id) {
    return this.refresh().find(material => material.id === Number.parseInt(id, 10)) || null
  }

  getByReference(reference) {
    const normalizedReference = normalizeText(reference).toLowerCase()

    if (!normalizedReference) {
      return null
    }

    return this.refresh().find(material => material.reference.toLowerCase() === normalizedReference) || null
  }

  getNextId() {
    if (this.materials.length === 0) return 1
    return Math.max(...this.materials.map(material => material.id)) + 1
  }

  create(data) {
    this.refresh()

    const timestamp = new Date().toISOString()
    const material = new Material({
      ...data,
      id: this.getNextId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    this.materials.push(material)
    this.save()
    return material
  }

  update(id, data) {
    this.refresh()

    const materialIndex = this.materials.findIndex(material => material.id === Number.parseInt(id, 10))
    if (materialIndex < 0) return null

    const updatedMaterial = new Material({
      ...this.materials[materialIndex],
      ...data,
      id: this.materials[materialIndex].id,
      createdAt: this.materials[materialIndex].createdAt,
      updatedAt: new Date().toISOString(),
    })

    this.materials[materialIndex] = updatedMaterial
    this.save()
    return updatedMaterial
  }

  delete(id) {
    this.refresh()

    const materialIndex = this.materials.findIndex(material => material.id === Number.parseInt(id, 10))
    if (materialIndex < 0) return false

    this.materials.splice(materialIndex, 1)
    this.save()
    return true
  }
}

function normalizeMaterials(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((material, index) => new Material({
      ...material,
      id: material.id !== undefined ? Number.parseInt(material.id, 10) : index + 1,
    }))
    .filter(material => material.name)
}

const materialsService = new MaterialsService()

export function getAllMaterials() {
  return materialsService.getAll()
}

export function getMaterialById(id) {
  return materialsService.getById(id)
}

export function getMaterialByReference(reference) {
  return materialsService.getByReference(reference)
}

export function createMaterial(data) {
  return materialsService.create(data)
}

export function updateMaterial(id, data) {
  return materialsService.update(id, data)
}

export function deleteMaterial(id) {
  return materialsService.delete(id)
}
