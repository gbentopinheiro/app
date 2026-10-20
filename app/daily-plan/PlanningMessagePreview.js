import { getPersonDisplayName, getWorkDisplayName } from '../../lib/display-names.js'
import { getPlanningPersonChangeStatus, getSelectedPlanningMessageGroups, PLANNING_CHANGE_LABELS } from '../../lib/planning-message.js'
import styles from './PlanningMessagePreview.module.css'

export function PlanningPersonName({ name, personId, changes, status }) {
  const changeStatus = status || getPlanningPersonChangeStatus(changes, personId)
  const label = PLANNING_CHANGE_LABELS[changeStatus]
  return (
    <span className={changeStatus === 'changed' ? styles.changedName : undefined}>
      {name}
      {label && <span className={styles.badge}>{label}</span>}
    </span>
  )
}

export default function PlanningMessagePreview({ date, groupedAssignments, selectedWorkIds, changes }) {
  const groups = getSelectedPlanningMessageGroups({ groupedAssignments, selectedWorkIds })
  return (
    <div className={styles.previewArea}>
      <div className={styles.preview} role="region" aria-label="Pré-visualização da mensagem" tabIndex={0}>
        {date && groups.length > 0 && (
          <>
            <p className={styles.line}>Plano do dia {date}</p>
            {groups.map(group => (
              <div key={group.workId} className={styles.work}>
                <p className={styles.line}>{group.workName || `Obra ${group.workId}`}</p>
                {group.assignments.map(assignment => (
                  <p key={assignment.personId} className={styles.line}>
                    {'- '}<PlanningPersonName
                      name={getPersonDisplayName(assignment.person, assignment.personId)}
                      personId={assignment.personId}
                      changes={changes}
                    />
                  </p>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
      {changes.removedAssignments.length > 0 && (
        <section className={styles.removals} aria-label="Afetações removidas face ao dia anterior">
          <h3 className={styles.removalsTitle}>Removidos de obras face ao dia anterior</h3>
          <p className={styles.hint}>Estas remoções também entram no texto copiado com o indicador [REMOVIDO].</p>
          <ul className={styles.removedList}>
            {changes.removedAssignments.map(assignment => (
              <li key={`${assignment.personId}:${assignment.workId}`}>
                <PlanningPersonName name={getPersonDisplayName(assignment.person, assignment.personId)} status="removed" />
                <span className={styles.hint}> · Removido de {getWorkDisplayName(assignment.work, assignment.workId)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
