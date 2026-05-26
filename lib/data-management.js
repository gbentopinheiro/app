import fs from 'fs/promises'
import path from 'path'
import { getAllPeople } from './people.js'
import { getAllWorks } from './works.js'
import { getAllClients } from './clients.js'
import { getAllCompanies } from './companies.js'
import { getAllWorkAssignments } from './work-assignments.js'
import { getAllDailyWorkNotes } from './daily-work-notes.js'
import { getAllWorkPlans } from './work-plans.js'
import { getAllAdmins } from './admins.js'
import { getAllDevelopers } from './developers.js'

const DATA_DIR = path.join(process.cwd(), 'data')

export async function getDataStats() {
  try {
    const files = [
      'people.json',
      'companies.json',
      'works.json',
      'clients.json',
      'work-assignments.json',
      'daily-work-notes.json',
      'developers.json',
      'admins.json',
      'work-plans.json',
    ]

    const stats = {
      files: {},
      totalSizeMB: 0,
      entityCounts: {},
    }

    for (const file of files) {
      try {
        const filePath = path.join(DATA_DIR, file)
        const fileStats = await fs.stat(filePath)
        const data = await fs.readFile(filePath, 'utf8')
        const parsed = JSON.parse(data)
        const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length

        const sizeMB = (fileStats.size / 1024 / 1024).toFixed(3)
        stats.files[file] = {
          sizeKB: Math.round(fileStats.size / 1024),
          sizeMB: parseFloat(sizeMB),
          lastModified: new Date(fileStats.mtimeMs).toISOString(),
          count: count,
        }

        stats.totalSizeMB += parseFloat(sizeMB)
        stats.entityCounts[file] = count
      } catch (error) {
        stats.files[file] = { error: error.message }
      }
    }

    stats.totalSizeMB = parseFloat(stats.totalSizeMB.toFixed(3))

    return stats
  } catch (error) {
    console.error('Failed to get data stats:', error)
    throw error
  }
}

export async function exportData(exportType = 'full') {
  try {
    let exportData = {}

    if (exportType === 'full' || exportType === 'all') {
      exportData = {
        people: await getAllPeople(),
        companies: await getAllCompanies(),
        works: await getAllWorks(),
        clients: await getAllClients(),
        workAssignments: await getAllWorkAssignments(),
        dailyWorkNotes: await getAllDailyWorkNotes(),
        workPlans: await getAllWorkPlans(),
        admins: await getAllAdmins(),
        developers: await getAllDevelopers(),
      }
    } else if (exportType === 'people') {
      exportData.people = await getAllPeople()
    } else if (exportType === 'works') {
      exportData.works = await getAllWorks()
    } else if (exportType === 'companies') {
      exportData.companies = await getAllCompanies()
    } else if (exportType === 'clients') {
      exportData.clients = await getAllClients()
    } else if (exportType === 'assignments') {
      exportData.workAssignments = await getAllWorkAssignments()
    } else if (exportType === 'notes') {
      exportData.dailyWorkNotes = await getAllDailyWorkNotes()
    } else if (exportType === 'plans') {
      exportData.workPlans = await getAllWorkPlans()
    }

    return exportData
  } catch (error) {
    console.error('Failed to export data:', error)
    throw error
  }
}
