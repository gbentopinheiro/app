import { NextResponse } from 'next/server'
import { resolveCompanyId } from '../../../lib/companies.js'
import { getDefaultHoursForDate } from '../../../lib/default-hours.js'
import { isDailyPlanLocked } from '../../../lib/daily-plan-lock.js'
import {
  createWorkAssignmentData,
  deleteWorkAssignmentData,
  getAllWorkAssignmentsData,
} from '../../../lib/work-assignments.js'
import { createWorkPlanData, getAllWorkPlansData, getWorkPlanByDateData } from '../../../lib/work-plans.js'

export async function GET() {
  try {
    return NextResponse.json(await getAllWorkPlansData())
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter work plans' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { date, clonePreviousDay } = body
    const companyId = resolveCompanyId(body.companyId)
    let sourceWorkPlan = null
    let previousAssignments = []

    if (!date) {
      return NextResponse.json({ error: 'date e obrigatorio' }, { status: 400 })
    }

    if (isDailyPlanLocked(date)) {
      return NextResponse.json(
        { error: 'Depois das 08:00 ja nao e possivel alterar o plano diario deste dia.' },
        { status: 403 },
      )
    }

    if (clonePreviousDay) {
      sourceWorkPlan = await getLatestPreviousWorkPlanWithAssignments(date, companyId)

      if (!sourceWorkPlan) {
        return NextResponse.json(
          { error: 'Nao existe nenhum work plan anterior com work assignments para copiar' },
          { status: 404 },
        )
      }

      previousAssignments = await getAllWorkAssignmentsData({ workPlanId: sourceWorkPlan.id })
    }

    const existingWorkPlan = await getWorkPlanByDateData(date, companyId)
    const workPlan = existingWorkPlan || await createWorkPlanData({ date, companyId })

    if (!clonePreviousDay) {
      let clearedAssignments = 0

      if (existingWorkPlan) {
        const currentAssignments = await getAllWorkAssignmentsData({ workPlanId: existingWorkPlan.id })
        clearedAssignments = currentAssignments.length

        for (const assignment of currentAssignments) {
          await deleteWorkAssignmentData(assignment.id)
        }
      }

      return NextResponse.json(
        {
          ...workPlan,
          clonedAssignments: 0,
          clearedAssignments,
          reusedWorkPlan: Boolean(existingWorkPlan),
        },
        { status: 201 },
      )
    }

    if (existingWorkPlan) {
      const currentAssignments = await getAllWorkAssignmentsData({ workPlanId: existingWorkPlan.id })

      for (const assignment of currentAssignments) {
        await deleteWorkAssignmentData(assignment.id)
      }
    }

    for (const assignment of previousAssignments) {
      await createWorkAssignmentData({
        workPlanId: workPlan.id,
        workId: assignment.workId,
        personId: assignment.personId,
        hours: getDefaultHoursForDate(workPlan.date),
        hourlyCost: assignment.hourlyCost,
        manualHourlyCost: assignment.manualHourlyCost === true,
        notes: assignment.notes,
      })
    }

    return NextResponse.json(
      {
        ...workPlan,
        clonedAssignments: previousAssignments.length,
        clonedFromDate: sourceWorkPlan?.date || null,
        clonedFromWorkPlanId: sourceWorkPlan?.id || null,
        reusedWorkPlan: Boolean(existingWorkPlan),
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error.message || ''
    const status =
      message.includes('Ja existe') || message.includes('data valida')
        ? 400
        : message.includes('Nao existe')
          ? 404
          : 500

    return NextResponse.json({ error: error.message || 'Erro ao criar work plan' }, { status })
  }
}

async function getLatestPreviousWorkPlanWithAssignments(date, companyId) {
  const targetDate = new Date(date)
  const normalizedCompanyId = resolveCompanyId(companyId)
  const workPlans = await getAllWorkPlansData({ companyId: normalizedCompanyId })
  const orderedWorkPlans = workPlans
    .filter(workPlan => new Date(workPlan.date) < targetDate)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())

  for (const workPlan of orderedWorkPlans) {
    const assignments = await getAllWorkAssignmentsData({ workPlanId: workPlan.id })

    if (assignments.length > 0) {
      return workPlan
    }
  }

  return null
}
