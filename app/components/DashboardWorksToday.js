import Link from 'next/link'
import { getAllWorkAssignmentsData } from '../../lib/work-assignments.js'
import { getAllWorksData } from '../../lib/works.js'
import { shouldAssignmentBehaveAsPlanningAssignment } from '../../lib/assignment-purpose.js'
import { isChefRole, isWorkerRole } from '../../lib/roles.js'
import styles from './DashboardWorksToday.module.css'

export default async function DashboardWorksToday({ date }) {
  const [assignments, works] = await Promise.all([
    getAllWorkAssignmentsData({ date }),
    getAllWorksData(),
  ])
  const peopleByWorkId = new Map()
  // Match the existing work-level submission rule in buildOperationalWorkStatuses.
  const submittedWorkIds = new Set(
    assignments.filter(assignment => assignment.submitted).map(assignment => String(assignment.workId)),
  )

  assignments.filter(assignment => assignment.planningVisible !== false && shouldAssignmentBehaveAsPlanningAssignment(assignment)).forEach(assignment => {
    const workId = String(assignment.workId)
    const people = peopleByWorkId.get(workId) || new Set()
    if (assignment.person && (isWorkerRole(assignment.person.role) || isChefRole(assignment.person.role))) {
      people.add(String(assignment.personId))
    }
    peopleByWorkId.set(workId, people)
  })

  const todaysWorks = works.filter(work => peopleByWorkId.has(String(work.id)))
  const numberFormat = new Intl.NumberFormat('pt-PT')

  return (
    <section className={styles.section} aria-labelledby="works-today-title">
      <div className={styles.header}>
        <h2 id="works-today-title" className={styles.title}>Obras de hoje</h2>
      </div>

      {todaysWorks.length > 0 ? (
        <ul className={styles.list}>
          {todaysWorks.map(work => {
            const peopleCount = peopleByWorkId.get(String(work.id)).size
            const submitted = submittedWorkIds.has(String(work.id))
            const statusLabel = submitted ? 'Submetido' : 'Não submetido'
            return (
              <li key={work.id} className={styles.row}>
                <div className={styles.workCopy}>
                  <h3 className={styles.workName}>{work.name}</h3>
                  <p className={styles.client}>{work.client?.name || 'Sem cliente associado'}</p>
                </div>
                <span className={styles.people} aria-label={`${peopleCount} trabalhadores afetados`}>
                  {numberFormat.format(peopleCount)}
                  <span className={styles.peopleLabel}>{peopleCount === 1 ? 'trabalhador' : 'trabalhadores'}</span>
                </span>
                <span className={`${styles.status} ${submitted ? styles.submitted : styles.notSubmitted}`} aria-label={`Estado: ${statusLabel}`}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  {statusLabel}
                </span>
                <Link href={`/works/${work.id}`} className={styles.openWork} aria-label={`Abrir obra ${work.name}`} title={`Abrir obra ${work.name}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="M5 12h14m-5-5 5 5-5 5" />
                  </svg>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className={styles.empty}>Nenhuma obra com afetações neste dia.</p>
      )}
    </section>
  )
}
