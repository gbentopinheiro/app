import fs from 'fs/promises'
import path from 'path'
import { getAllPeopleData } from './people.js'
import { getAllWorksData } from './works.js'
import { getAllClientsData } from './clients.js'
import { getAllCompaniesData } from './companies.js'
import { getAllWorkAssignmentsData } from './work-assignments.js'
import { getAllDailyWorkNotesData } from './daily-work-notes.js'
import { getAllWorkPlansData } from './work-plans.js'
import { getAllAdminsData } from './admins.js'
import { getAllDevelopersData } from './developers.js'

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
        people: await getAllPeopleData(),
        companies: await getAllCompaniesData(),
        works: await getAllWorksData(),
        clients: await getAllClientsData(),
        workAssignments: await getAllWorkAssignmentsData(),
        dailyWorkNotes: await getAllDailyWorkNotesData(),
        workPlans: await getAllWorkPlansData(),
        admins: await getAllAdminsData(),
        developers: await getAllDevelopersData(),
      }
    } else if (exportType === 'people') {
      exportData.people = await getAllPeopleData()
    } else if (exportType === 'works') {
      exportData.works = await getAllWorksData()
    } else if (exportType === 'companies') {
      exportData.companies = await getAllCompaniesData()
    } else if (exportType === 'clients') {
      exportData.clients = await getAllClientsData()
    } else if (exportType === 'assignments') {
      exportData.workAssignments = await getAllWorkAssignmentsData()
    } else if (exportType === 'notes') {
      exportData.dailyWorkNotes = await getAllDailyWorkNotesData()
    } else if (exportType === 'plans') {
      exportData.workPlans = await getAllWorkPlansData()
    }

    return exportData
  } catch (error) {
    console.error('Failed to export data:', error)
    throw error
  }
}
