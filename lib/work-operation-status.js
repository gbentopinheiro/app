import { WorkStatus } from './works.js'

export function buildOperationalWorkStatuses(works = [], todayAssignments = []) {
  const assignmentsByWorkId = new Map()

  ;(Array.isArray(todayAssignments) ? todayAssignments : []).forEach(assignment => {
    const workId = Number(assignment?.workId)

    if (!Number.isInteger(workId)) {
      return
    }

    const scopedAssignments = assignmentsByWorkId.get(workId) || []
    scopedAssignments.push(assignment)
    assignmentsByWorkId.set(workId, scopedAssignments)
  })

  return (Array.isArray(works) ? works : [])
    .filter(work => work?.status !== WorkStatus.COMPLETED)
    .filter(work => assignmentsByWorkId.has(Number(work?.id)))
    .slice(0, 5)
    .map(work => {
      const workAssignments = assignmentsByWorkId.get(Number(work.id)) || []

      return {
        id: work.id,
        name: work.name,
        submitted: workAssignments.some(assignment => assignment?.submitted),
      }
    })
}
