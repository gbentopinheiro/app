import { NextResponse } from 'next/server'
import { createWorkPlan, getAllWorkPlans, getWorkPlanByDate } from '../../../lib/work-plans.js'
import { createWorkAssignment, deleteWorkAssignment, getAllWorkAssignments } from '../../../lib/work-assignments.js'
import { getDefaultHoursForDate } from '../../../lib/default-hours.js'

export async function GET() {
  try {
    return NextResponse.json(getAllWorkPlans())
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter work plans' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { date, clonePreviousDay } = body
    let sourceWorkPlan = null
    let previousAssignments = []

    if (!date) {
      return NextResponse.json({ error: 'date é obrigatório' }, { status: 400 })
    }

    if (clonePreviousDay) {
      sourceWorkPlan = getLatestPreviousWorkPlanWithAssignments(date)

      if (!sourceWorkPlan) {
        return NextResponse.json(
          { error: 'Não existe nenhum work plan anterior com work assignments para copiar' },
          { status: 404 }
        )
      }

      previousAssignments = getAllWorkAssignments({ workPlanId: sourceWorkPlan.id })
    }

    const existingWorkPlan = getWorkPlanByDate(date)
    const workPlan = existingWorkPlan || createWorkPlan({ date })

    if (!clonePreviousDay) {
      return NextResponse.json({
        ...workPlan,
        clonedAssignments: 0,
        reusedWorkPlan: Boolean(existingWorkPlan),
      }, { status: 201 })
    }

    if (existingWorkPlan) {
      const currentAssignments = getAllWorkAssignments({ workPlanId: existingWorkPlan.id })

      for (const assignment of currentAssignments) {
        deleteWorkAssignment(assignment.id)
      }
    }

    for (const assignment of previousAssignments) {
      createWorkAssignment({
        workPlanId: workPlan.id,
        workId: assignment.workId,
        personId: assignment.personId,
        hours: getDefaultHoursForDate(workPlan.date),
        hourlyCost: assignment.hourlyCost,
        notes: assignment.notes,
      })
    }

    return NextResponse.json({
      ...workPlan,
      clonedAssignments: previousAssignments.length,
      clonedFromDate: sourceWorkPlan?.date || null,
      clonedFromWorkPlanId: sourceWorkPlan?.id || null,
      reusedWorkPlan: Boolean(existingWorkPlan),
    }, { status: 201 })
  } catch (error) {
    const message = error.message || ''
    const status =
      message.includes('Já existe') || message.includes('data válida')
        ? 400
        : message.includes('Não existe')
          ? 404
          : 500
    return NextResponse.json({ error: error.message || 'Erro ao criar work plan' }, { status })
  }
}

function getLatestPreviousWorkPlanWithAssignments(date) {
  const targetDate = new Date(date)

  return getAllWorkPlans()
    .filter(workPlan => new Date(workPlan.date) < targetDate)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .find(workPlan => getAllWorkAssignments({ workPlanId: workPlan.id }).length > 0) || null
}
