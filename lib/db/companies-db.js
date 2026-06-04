import { prisma } from '../prisma.js'
import { mapCompanyRecord, slugifyCompanyName, toPositiveInt, toRequiredString } from './core-mappers.js'

export async function getAllCompaniesDb() {
  const companies = await prisma.company.findMany({
    orderBy: { id: 'asc' },
  })

  return companies.map(mapCompanyRecord)
}

export async function getCompanyByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const company = await prisma.company.findUnique({
    where: { id: normalizedId },
  })

  return mapCompanyRecord(company)
}

export async function getCompanyBySlugDb(slug) {
  const normalizedSlug = toRequiredString(slug).toLowerCase()

  if (!normalizedSlug) {
    return null
  }

  const company = await prisma.company.findUnique({
    where: { slug: normalizedSlug },
  })

  return mapCompanyRecord(company)
}

export async function createCompanyDb(data) {
  const name = toRequiredString(data?.name)

  const company = await prisma.company.create({
    data: {
      id: toPositiveInt(data?.id) || undefined,
      holdingId: toPositiveInt(data?.holdingId, 1),
      name,
      slug: toRequiredString(data?.slug) || slugifyCompanyName(name),
      countryCode: toRequiredString(data?.countryCode || 'PT').toUpperCase(),
      documentMark: toRequiredString(data?.documentMark) || null,
      documentLabel: toRequiredString(data?.documentLabel || name),
      documentLogoUrl: toRequiredString(data?.documentLogoUrl) || null,
      active: data?.active !== false,
    },
  })

  return mapCompanyRecord(company)
}

export async function updateCompanyDb(id, data) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentCompany = await prisma.company.findUnique({
    where: { id: normalizedId },
  })

  if (!currentCompany) {
    return null
  }

  const nextName = data?.name !== undefined ? toRequiredString(data.name) : currentCompany.name

  const company = await prisma.company.update({
    where: { id: normalizedId },
    data: {
      holdingId: data?.holdingId !== undefined ? toPositiveInt(data.holdingId, currentCompany.holdingId) : currentCompany.holdingId,
      name: nextName,
      slug: data?.slug !== undefined ? toRequiredString(data.slug) : currentCompany.slug,
      countryCode: data?.countryCode !== undefined ? toRequiredString(data.countryCode).toUpperCase() : currentCompany.countryCode,
      documentMark: data?.documentMark !== undefined ? toRequiredString(data.documentMark) || null : currentCompany.documentMark,
      documentLabel: data?.documentLabel !== undefined ? toRequiredString(data.documentLabel) || nextName : currentCompany.documentLabel,
      documentLogoUrl: data?.documentLogoUrl !== undefined ? toRequiredString(data.documentLogoUrl) || null : currentCompany.documentLogoUrl,
      active: data?.active !== undefined ? data.active !== false : currentCompany.active,
    },
  })

  return mapCompanyRecord(company)
}

export async function deleteCompanyDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return false
  }

  try {
    await prisma.company.delete({
      where: { id: normalizedId },
    })
    return true
  } catch (error) {
    return false
  }
}
