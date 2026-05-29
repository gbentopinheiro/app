import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const companiesFilePath = join(dataDir, 'companies.json')

export const DEFAULT_HOLDING_ID = 1
export const DEFAULT_COMPANY_ID = 1

const defaultCompanyRecord = Object.freeze({
  id: DEFAULT_COMPANY_ID,
  holdingId: DEFAULT_HOLDING_ID,
  name: 'Empresa Principal',
  slug: 'empresa-principal',
  countryCode: 'PT',
  documentMark: 'EP',
  documentLabel: 'Empresa Principal',
  documentLogoUrl: '',
  active: true,
})

export class Company {
  constructor(data) {
    this.id = resolveNumericId(data.id, DEFAULT_COMPANY_ID)
    this.holdingId = resolveNumericId(data.holdingId, DEFAULT_HOLDING_ID)
    this.name = String(data.name || '').trim()
    this.slug = String(data.slug || '').trim()
    this.countryCode = String(data.countryCode || 'PT').trim().toUpperCase()
    this.documentMark = String(data.documentMark || '').trim()
    this.documentLabel = String(data.documentLabel || data.name || '').trim()
    this.documentLogoUrl = String(data.documentLogoUrl || '').trim()
    this.active = data.active !== false
  }
}

export class CompaniesService {
  constructor(filePath = companiesFilePath) {
    this.filePath = filePath
    this.companies = this.load()
  }

  ensureDataDir() {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  load() {
    this.ensureDataDir()

    if (!existsSync(this.filePath)) {
      return [new Company(defaultCompanyRecord)]
    }

    try {
      const rawData = JSON.parse(readFileSync(this.filePath, 'utf8'))
      return ensureDefaultCompany(normalizeCompanies(rawData))
    } catch (error) {
      console.error('Error loading companies:', error.message)
      return [new Company(defaultCompanyRecord)]
    }
  }

  save() {
    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.companies, null, 2), 'utf8')
  }

  refresh() {
    this.companies = this.load()
    return this.companies
  }

  getAll() {
    return this.refresh()
  }

  getById(id) {
    return this.refresh().find(company => company.id === parseInt(id, 10)) || null
  }
}

function resolveNumericId(value, fallback) {
  const parsedValue = parseInt(value, 10)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

function ensureDefaultCompany(companies) {
  if (companies.some(company => company.id === DEFAULT_COMPANY_ID)) {
    return companies
  }

  return [new Company(defaultCompanyRecord), ...companies]
}

function normalizeCompanies(list) {
  if (!Array.isArray(list)) {
    return [new Company(defaultCompanyRecord)]
  }

  return list
    .map((company, index) => new Company({
      ...company,
      id: company.id !== undefined ? company.id : index + 1,
      holdingId: company.holdingId !== undefined ? company.holdingId : DEFAULT_HOLDING_ID,
    }))
    .filter(company => company.name)
}

const companiesService = new CompaniesService()

export function getAllCompanies() {
  return companiesService.getAll()
}

export function getCompanyById(id) {
  return companiesService.getById(id)
}

export function getDefaultCompany() {
  return getCompanyById(DEFAULT_COMPANY_ID) || new Company(defaultCompanyRecord)
}

export function resolveCompanyId(companyId, fallbackCompanyId = DEFAULT_COMPANY_ID) {
  return resolveNumericId(companyId, fallbackCompanyId)
}
