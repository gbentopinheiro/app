import { NextResponse } from 'next/server'
import { createWorkPlan, getAllWorkPlans } from '../../../lib/work-plans.js'
import { createWorkAssignment, getAllWorkAssignments } from '../../../lib/work-assignments.js'

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
      return NextResponse.json({ error: 'date e obrigatorio' }, { status: 400 })
    }

    if (clonePreviousDay) {
      sourceWorkPlan = getLatestPreviousWorkPlanWithAssignments(date)

      if (!sourceWorkPlan) {
        return NextResponse.json(
          { error: 'Nao existe nenhum work plan anterior com work assignments para clonar' },
          { status: 404 }
        )
      }

      previousAssignments = getAllWorkAssignments({ workPlanId: sourceWorkPlan.id })
    }

    const workPlan = createWorkPlan({ date })

    if (!clonePreviousDay) {
      return NextResponse.json({
        ...workPlan,
        clonedAssignments: 0,
      }, { status: 201 })
    }

    for (const assignment of previousAssignments) {
      createWorkAssignment({
        workPlanId: workPlan.id,
        workId: assignment.workId,
        personId: assignment.personId,
        hours: assignment.hours,
        hourlyCost: assignment.hourlyCost,
        notes: assignment.notes,
      })
    }

    return NextResponse.json({
      ...workPlan,
      clonedAssignments: previousAssignments.length,
      clonedFromDate: sourceWorkPlan?.date || null,
      clonedFromWorkPlanId: sourceWorkPlan?.id || null,
    }, { status: 201 })
  } catch (error) {
    const status =
      error.message?.includes('Ja existe') || error.message?.includes('data valida')
        ? 400
        : error.message?.includes('Nao existe')
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
