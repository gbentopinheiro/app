'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import PlanningDatePopover from '../components/PlanningDatePopover'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import TrashBinIcon, { trashBinButtonStyle } from '../components/TrashBinIcon'
import {
  ContentFrame,
  FlowStack,
  ResponsiveGrid,
  SurfaceCard,
  ViewportPage,
  ViewportScrollArea,
  ViewportShell,
} from '../components/ViewportLayout.js'
import {
  deletePlanningDraftAssignment,
  getPlanningWorkspaceView,
  initializePlanningWorkspaceDraft,
  publishPlanningWorkspace,
  savePlanningDraftAssignment,
  setPlanningWorkspaceToDraft,
} from '../../frontend/controllers/planning-workspaces-controller.js'
import {
  getPersonDisplayName,
  getWorkDisplayName,
  getWorkDisplayReference,
} from '../../lib/display-names.js'
import { getEntityRoleLabel, getRoleLabel, isChefRole } from '../../lib/roles.js'

const pageStyle = {
  minHeight: '100vh',
  padding: '32px clamp(16px, 3vw, 32px) 56px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
  fontWeight: 600,
}

const shellStyle = {
  minWidth: 0,
  display: 'grid',
  gap: '28px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  borderRadius: '32px',
  padding: '20px clamp(18px, 2.4vw, 28px) 24px',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
  '--vp-surface': 'var(--vp-hero-surface)',
  '--vp-border': 'var(--vp-hero-border)',
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'var(--vp-overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 50,
}

const modalCardStyle = {
  width: 'min(760px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'hidden',
  overflowX: 'hidden',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-modal)',
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '14px',
  flexWrap: 'wrap',
}

const heroActionColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  alignItems: 'stretch',
  width: 'min(100%, 164px)',
}

const topSummaryGridStyle = {
  alignItems: 'stretch',
  marginTop: '24px',
  '--vp-grid-gap': '14px',
}

const topSummaryLabelStyle = {
  fontSize: '12px',
  color: '#425a76',
  textTransform: 'uppercase',
  fontWeight: 800,
  lineHeight: 1.2,
  minHeight: '29px',
}

const topSummaryValueStyle = {
  marginTop: '8px',
  fontSize: '32px',
  lineHeight: 1,
  fontWeight: 900,
  color: '#0f223c',
}

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface-muted)',
  fontSize: '14px',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 700,
}

const workingDayOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 12px',
  borderRadius: '12px',
  background: 'var(--vp-surface-muted)',
  border: '1px solid var(--vp-border)',
  fontWeight: 700,
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'var(--vp-accent)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'transform 160ms ease, filter 160ms ease, box-shadow 160ms ease',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'transform 160ms ease, filter 160ms ease, background-color 160ms ease, box-shadow 160ms ease',
}

const disabledButtonStyle = {
  ...primaryButtonStyle,
  background: 'var(--vp-disabled)',
  cursor: 'not-allowed',
}

const compactActionButtonStyle = {
  minWidth: '148px',
  minHeight: '38px',
  padding: '8px 16px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}

const statusPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  borderRadius: '999px',
  padding: '8px 14px',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const planningHeaderStyle = {
  marginTop: '22px',
  display: 'grid',
  justifyItems: 'center',
  gap: '6px',
  textAlign: 'center',
}

const closeButtonStyle = {
  border: '1px solid var(--vp-border)',
  borderRadius: '999px',
  width: '38px',
  height: '38px',
  background: 'var(--vp-surface)',
  color: 'var(--vp-text)',
  fontSize: '22px',
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

const chefAccessStarButtonStyle = (selected, disabled = false) => ({
  border: 'none',
  background: 'transparent',
  padding: 0,
  margin: 0,
  color: selected ? '#f59e0b' : 'var(--vp-text-soft)',
  fontSize: '20px',
  lineHeight: 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.45 : 1,
})

const personListStyle = {
  margin: '20px 0 0',
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gap: '10px',
  maxHeight: 'min(52vh, 420px)',
  overflowY: 'auto',
}

const personListItemStyle = {
  border: '1px solid var(--vp-border)',
  borderRadius: '14px',
  padding: '12px 14px',
  background: 'var(--vp-surface)',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap',
}

const today = new Date().toISOString().slice(0, 10)
const emptyAssignmentForm = {
  id: null,
  personId: '',
  workId: '',
  hourlyCost: '',
  manualHourlyCost: false,
  notes: '',
  hasWorkAccess: false,
}

function capitalizeLabel(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getWorkHourlyCostForPerson(work, person, fallbackCost = 0) {
  const specialPersonCost = work?.specialPersonHourlyCosts?.[String(person?.id)]

  if (specialPersonCost !== undefined && specialPersonCost !== null && specialPersonCost !== '') {
    return Number(specialPersonCost)
  }

  const roleCost = work?.roleHourlyCosts?.[person?.role]

  if (roleCost !== undefined && roleCost !== null && roleCost !== '') {
    return Number(roleCost)
  }

  return Number(work?.defaultHourlyCost ?? fallbackCost ?? 0)
}

function getChefAssignmentsForWork(assignments) {
  return assignments
    .filter(assignment => isChefRole(assignment.person?.role))
    .sort((left, right) => Number(left.id) - Number(right.id))
}

function getChefAccessAssignmentId(assignments) {
  const chefAssignments = getChefAssignmentsForWork(assignments)

  if (chefAssignments.length === 0) {
    return null
  }

  return String((chefAssignments.find(assignment => assignment.hasWorkAccess) || chefAssignments[0]).id)
}

function canRoleUseManualHourlyCost(role) {
  return role === 'chef_primeira' || role === 'chef_segunda' || role === 'gruista'
}

function formatHourlyCostLabel(value) {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function getManualHourlyCostSuggestions(work, person) {
  if (!work || !person) {
    return []
  }

  const suggestions = []
  const specialPersonCost = work.specialPersonHourlyCosts?.[String(person.id)]
  const roleCost = work.roleHourlyCosts?.[person.role]
  const defaultCost = work.defaultHourlyCost

  if (specialPersonCost !== undefined && specialPersonCost !== null && specialPersonCost !== '') {
    suggestions.push({
      key: `special-${person.id}`,
      label: 'Preço especial desta pessoa',
      value: Number(specialPersonCost),
    })
  }

  if (roleCost !== undefined && roleCost !== null && roleCost !== '') {
    suggestions.push({
      key: `role-${person.role}`,
      label: `Preço de ${getEntityRoleLabel(person)}`,
      value: Number(roleCost),
    })
  }

  if (defaultCost !== undefined && defaultCost !== null && defaultCost !== '') {
    suggestions.push({
      key: `default-${work.id}`,
      label: 'Preço base da obra',
      value: Number(defaultCost),
    })
  }

  return suggestions.filter(suggestion => !Number.isNaN(suggestion.value) && suggestion.value >= 0)
}

export default function DailyPlanPage() {
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedPlanningWorkspace, setSelectedPlanningWorkspace] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [defaults, setDefaults] = useState({ people: [], works: [] })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [creatingMode, setCreatingMode] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [switchingToDraft, setSwitchingToDraft] = useState(false)
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showUnassignedPeopleModal, setShowUnassignedPeopleModal] = useState(false)
  const [selectedUnassignedRole, setSelectedUnassignedRole] = useState('all')
  const [selectedMessageWorkIds, setSelectedMessageWorkIds] = useState([])
  const [messageSelectionError, setMessageSelectionError] = useState('')
  const [draggedAssignmentId, setDraggedAssignmentId] = useState(null)
  const [draggedSourceWorkId, setDraggedSourceWorkId] = useState(null)
  const [dropTargetWorkId, setDropTargetWorkId] = useState(null)
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm)
  const [formErrors, setFormErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadDailyPlan(selectedDate)
  }, [selectedDate])

  const groupedAssignments = useMemo(() => {
    const groups = new Map()

    for (const assignment of assignments) {
      const key = assignment.work?.id || assignment.workId
      const existing = groups.get(key)

      if (existing) {
        existing.assignments.push(assignment)
      } else {
        groups.set(key, {
          workId: assignment.work?.id || assignment.workId,
          workNumber: assignment.work?.number || '-',
          workName: getWorkDisplayName(assignment.work, assignment.workId),
          assignments: [assignment],
        })
      }
    }

    return Array.from(groups.values())
      .map(group => ({
        ...group,
        assignments: [...group.assignments].sort((left, right) =>
          String(getPersonDisplayName(left.person, left.personId)).localeCompare(
            String(getPersonDisplayName(right.person, right.personId)),
            'pt-PT',
            { sensitivity: 'base' },
          ),
        ),
      }))
      .sort((left, right) => Number(left.workNumber) - Number(right.workNumber))
  }, [assignments])

  const isDraftPlanning = selectedPlanningWorkspace?.state === 'draft'
  const isPublishedPlanning = selectedPlanningWorkspace?.state === 'published'
  const formattedPlanningDate = useMemo(() => {
    if (!selectedDate) return ''

    const [year, month, day] = selectedDate.split('-').map(Number)

    if (!year || !month || !day) {
      return selectedDate
    }

    const date = new Date(year, month - 1, day, 12)
    const weekday = capitalizeLabel(new Intl.DateTimeFormat('pt-PT', { weekday: 'long' }).format(date))
    const monthLabel = capitalizeLabel(new Intl.DateTimeFormat('pt-PT', { month: 'long' }).format(date))

    return `${weekday} · ${date.getDate()} ${monthLabel} ${date.getFullYear()}`
  }, [selectedDate])
  const planningStatusMeta = useMemo(() => {
    if (isDraftPlanning) {
      return {
        label: 'Rascunho',
        background: 'rgba(245, 158, 11, 0.16)',
        color: '#9a6400',
        border: 'rgba(245, 158, 11, 0.32)',
      }
    }

    if (isPublishedPlanning) {
      return {
        label: 'Publicado',
        background: 'rgba(31, 122, 69, 0.14)',
        color: '#165f37',
        border: 'rgba(31, 122, 69, 0.28)',
      }
    }

    return {
      label: loading ? 'A carregar' : 'Sem planeamento',
      background: 'rgba(148, 163, 184, 0.24)',
      color: '#30475f',
      border: 'rgba(100, 116, 139, 0.36)',
    }
  }, [isDraftPlanning, isPublishedPlanning, loading])
  const activeWorks = useMemo(
    () => defaults.works.filter(work => work.status !== 'completed'),
    [defaults.works],
  )
  const selectedWork = useMemo(
    () => activeWorks.find(work => String(work.id) === String(assignmentForm.workId)),
    [activeWorks, assignmentForm.workId],
  )
  const selectedPerson = useMemo(
    () => defaults.people.find(person => String(person.id) === String(assignmentForm.personId)),
    [defaults.people, assignmentForm.personId],
  )
  const selectedWorkChefAssignments = useMemo(() => {
    if (!assignmentForm.workId) {
      return []
    }

    const currentChefAssignments = assignments.filter(
      assignment =>
        String(assignment.workId) === String(assignmentForm.workId) &&
        isChefRole(assignment.person?.role),
    )

    if (!assignmentForm.id || !selectedPerson || !isChefRole(selectedPerson.role)) {
      return currentChefAssignments
    }

    const currentAssignmentIsAlreadyIncluded = currentChefAssignments.some(
      assignment => String(assignment.id) === String(assignmentForm.id),
    )

    if (currentAssignmentIsAlreadyIncluded) {
      return currentChefAssignments
    }

    return [...currentChefAssignments, { id: assignmentForm.id, personId: assignmentForm.personId, person: selectedPerson }]
  }, [assignmentForm.id, assignmentForm.workId, assignments, selectedPerson])
  const canChooseChefWorkAccessInEdit = Boolean(
    assignmentForm.id &&
    selectedPerson &&
    isChefRole(selectedPerson.role) &&
    selectedWorkChefAssignments.length > 1,
  )
  const canChooseChefWorkAccessOnAdd = Boolean(
    !assignmentForm.id &&
    assignmentForm.workId &&
    selectedPerson &&
    isChefRole(selectedPerson.role) &&
    selectedWorkChefAssignments.length > 0,
  )
  const selectedWorkAccessChef = useMemo(() => {
    const chefAccessAssignmentId = getChefAccessAssignmentId(selectedWorkChefAssignments)

    if (!chefAccessAssignmentId) {
      return null
    }

    return selectedWorkChefAssignments.find(
      assignment => String(assignment.id) === String(chefAccessAssignmentId),
    ) || null
  }, [selectedWorkChefAssignments])
  const shouldSuggestChefAccessOnAdd = Boolean(
    !assignmentForm.id &&
    assignmentForm.workId &&
    selectedPerson &&
    isChefRole(selectedPerson.role) &&
    selectedWorkChefAssignments.some(
      assignment => String(assignment.personId) !== String(selectedPerson.id),
    ),
  )
  const canUseManualHourlyCost = Boolean(
    selectedPerson && canRoleUseManualHourlyCost(selectedPerson.role),
  )
  const selectedHourlyCost = useMemo(() => {
    if (canUseManualHourlyCost && assignmentForm.manualHourlyCost) {
      return Number(assignmentForm.hourlyCost || 0)
    }

    if (!selectedWork || !selectedPerson) {
      return selectedWork ? Number(selectedWork.defaultHourlyCost ?? 0) : 0
    }

    return getWorkHourlyCostForPerson(selectedWork, selectedPerson, 0)
  }, [assignmentForm.hourlyCost, assignmentForm.manualHourlyCost, canUseManualHourlyCost, selectedPerson, selectedWork])
  const selectedHourlyCostSource = useMemo(() => {
    if (canUseManualHourlyCost && assignmentForm.manualHourlyCost) {
      return 'manual na afetação'
    }

    if (!selectedWork || !selectedPerson) {
      return 'default da obra'
    }

    if (selectedWork.specialPersonHourlyCosts?.[String(selectedPerson.id)] !== undefined) {
      return 'preço especial da pessoa nesta obra'
    }

    if (selectedWork.roleHourlyCosts?.[selectedPerson.role] !== undefined) {
      return `role ${getEntityRoleLabel(selectedPerson)}`
    }

    return 'default da obra'
  }, [assignmentForm.manualHourlyCost, canUseManualHourlyCost, selectedPerson, selectedWork])
  const manualHourlyCostSuggestions = useMemo(
    () => getManualHourlyCostSuggestions(selectedWork, selectedPerson),
    [selectedPerson, selectedWork],
  )
  const sortedPeople = useMemo(
    () =>
      [...defaults.people].sort((left, right) =>
        String(getPersonDisplayName(left, left.id)).localeCompare(
          String(getPersonDisplayName(right, right.id)),
          'pt-PT',
          { sensitivity: 'base' },
        ),
      ),
    [defaults.people],
  )
  const activeWorksById = useMemo(
    () => new Map(activeWorks.map(work => [String(work.id), work])),
    [activeWorks],
  )
  const unplannedWorks = useMemo(() => {
    const plannedWorkIds = new Set(groupedAssignments.map(group => String(group.workId)))

    return activeWorks.filter(work => !plannedWorkIds.has(String(work.id)))
  }, [activeWorks, groupedAssignments])
  const duplicateNonChefAssignments = useMemo(() => {
    const peopleMap = new Map()

    assignments.forEach(assignment => {
      const personId = String(assignment.personId || '')
      if (!personId) return

      const existing = peopleMap.get(personId) || {
        personId,
        name: getPersonDisplayName(assignment.person, assignment.personId),
        role: assignment.person?.role || '',
        works: new Map(),
      }

      existing.name = getPersonDisplayName(assignment.person, assignment.personId) || existing.name
      existing.role = assignment.person?.role || existing.role
      existing.works.set(
        String(assignment.workId),
        getWorkDisplayName(
          assignment.work || activeWorksById.get(String(assignment.workId)),
          assignment.workId,
        ),
      )
      peopleMap.set(personId, existing)
    })

    return Array.from(peopleMap.values())
      .filter(person => !isChefRole(person.role) && person.works.size > 1)
      .map(person => ({
        personId: person.personId,
        name: person.name,
        workNames: Array.from(person.works.values()).sort((left, right) =>
          String(left).localeCompare(String(right), 'pt-PT', { sensitivity: 'base' }),
        ),
      }))
      .sort((left, right) =>
        String(left.name).localeCompare(String(right.name), 'pt-PT', { sensitivity: 'base' }),
      )
  }, [activeWorksById, assignments])
  const duplicateNonChefPersonIds = useMemo(
    () => new Set(duplicateNonChefAssignments.map(person => String(person.personId))),
    [duplicateNonChefAssignments],
  )
  const generatedMessage = useMemo(() => {
    if (!selectedPlanningWorkspace || selectedMessageWorkIds.length === 0) return ''

    const selectedGroups = groupedAssignments.filter(group => selectedMessageWorkIds.includes(String(group.workId)))

    if (selectedGroups.length === 0) return ''

    const messageParts = selectedGroups.map(group => {
      const peopleLines = group.assignments
        .map(assignment => `- ${getPersonDisplayName(assignment.person, assignment.personId)}`)
        .join('\n')

      return `${group.workName}\n${peopleLines}`
    })

    return [`Plano do dia ${selectedPlanningWorkspace.date}`, ...messageParts].join('\n\n')
  }, [groupedAssignments, selectedMessageWorkIds, selectedPlanningWorkspace])
  async function loadDailyPlan(date) {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const data = await getPlanningWorkspaceView(
        {
          date,
        },
        'Erro ao carregar plano diário',
      )

      const nextDefaults = data.defaults || { people: [], works: [] }
      setDefaults(nextDefaults)
      setSelectedPlanningWorkspace(data.workspace || null)
      setAssignments(Array.isArray(data.items) ? data.items : [])
    } catch (err) {
      setError(err.message)
      setDefaults({ people: [], works: [] })
      setSelectedPlanningWorkspace(null)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateWorkPlan(clonePreviousDay = false) {
    setCreating(true)
    setCreatingMode(clonePreviousDay ? 'clone' : 'new')
    setError('')
    setSuccess('')

    try {
      const data = await initializePlanningWorkspaceDraft(
        {
          date: selectedDate,
          clonePreviousDay,
        },
        'Erro ao criar plano diário',
      )

      setSuccess(
        clonePreviousDay
          ? data.reusedWorkspace
            ? `Rascunho de ${data.workspace?.date || selectedDate} atualizado com ${data.clonedAssignments} afetações copiadas de ${data.clonedFromDate}.`
            : `Rascunho criado para ${data.workspace?.date || selectedDate} com ${data.clonedAssignments} afetações copiadas de ${data.clonedFromDate}.`
          : data.reusedWorkspace
            ? `Rascunho de ${data.workspace?.date || selectedDate} reiniciado${data.clearedAssignments ? ` e limpo (${data.clearedAssignments} afetações removidas)` : ''}.`
            : `Rascunho criado para ${data.workspace?.date || selectedDate}.`
      )
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
      setCreatingMode('')
    }
  }

  async function handlePublishPlanning() {
    if (!selectedPlanningWorkspace || !isDraftPlanning) return

    setPublishing(true)
    setError('')
    setSuccess('')

    try {
      await publishPlanningWorkspace(
        selectedPlanningWorkspace.id,
        'Erro ao publicar planeamento',
      )
      setSuccess('Planeamento publicado com sucesso. Os chefes já veem esta versão.')
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  async function handleEditPublishedPlanning() {
    if (!selectedPlanningWorkspace || !isPublishedPlanning) return

    setSwitchingToDraft(true)
    setError('')
    setSuccess('')

    try {
      await setPlanningWorkspaceToDraft(
        selectedPlanningWorkspace.id,
        'Erro ao voltar o planeamento para rascunho',
      )
      setSuccess(
        'Planeamento voltou a rascunho. Os chefes continuam a ver a última versão publicada até publicares novamente.',
      )
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setSwitchingToDraft(false)
    }
  }

  function openAddModal() {
    if (!selectedPlanningWorkspace || !isDraftPlanning) return
    setAssignmentForm(emptyAssignmentForm)
    setFormErrors({})
    setError('')
    setSuccess('')
    setShowAddModal(true)
  }

  function openEditModal(assignment) {
    setAssignmentForm({
      id: assignment.id,
      personId: String(assignment.personId),
      workId: String(assignment.workId),
      hourlyCost: String(assignment.hourlyCost ?? ''),
      manualHourlyCost: assignment.manualHourlyCost === true,
      notes: assignment.notes || '',
      hasWorkAccess: assignment.hasWorkAccess === true,
    })
    setFormErrors({})
    setError('')
    setSuccess('')
    setShowAddModal(true)
  }

  function closeAddModal() {
    setShowAddModal(false)
    setAssignmentForm(emptyAssignmentForm)
    setFormErrors({})
  }

  function openMessageModal() {
    if (!selectedPlanningWorkspace || groupedAssignments.length === 0) return

    setSelectedMessageWorkIds(groupedAssignments.map(group => String(group.workId)))
    setMessageSelectionError('')
    setError('')
    setSuccess('')
    setShowMessageModal(true)
  }

  function closeMessageModal() {
    setShowMessageModal(false)
    setSelectedMessageWorkIds([])
    setMessageSelectionError('')
  }

  function openUnassignedPeopleModal() {
    setSelectedUnassignedRole('all')
    setShowUnassignedPeopleModal(true)
  }

  function closeUnassignedPeopleModal() {
    setSelectedUnassignedRole('all')
    setShowUnassignedPeopleModal(false)
  }

  function handleAssignmentChange(event) {
    const { name, value } = event.target

    setAssignmentForm(current => {
      const nextPersonId = name === 'personId' ? value : current.personId
      const nextWorkId = name === 'workId' ? value : current.workId
      const nextPerson = defaults.people.find(person => String(person.id) === String(nextPersonId))
      const nextWorkChefAssignments = assignments.filter(
        assignment =>
          String(assignment.workId) === String(nextWorkId) &&
          isChefRole(assignment.person?.role) &&
          (!current.id || String(assignment.id) !== String(current.id)),
      )
      const nextForm = {
        ...current,
        [name]: value,
      }

      if (!canRoleUseManualHourlyCost(nextPerson?.role)) {
        nextForm.manualHourlyCost = false
        nextForm.hourlyCost = ''
      }

      if (!current.id) {
        nextForm.hasWorkAccess = isChefRole(nextPerson?.role) ? nextWorkChefAssignments.length === 0 : false
      } else if (name === 'personId') {
        if (!isChefRole(nextPerson?.role)) {
          nextForm.hasWorkAccess = false
        }
      }

      return nextForm
    })

    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function handleManualHourlyCostToggle(event) {
    const checked = event.target.checked

    if (!canUseManualHourlyCost) {
      return
    }

    setAssignmentForm(current => ({
      ...current,
      manualHourlyCost: checked,
      hourlyCost: checked
        ? current.hourlyCost || String(selectedWork && selectedPerson ? getWorkHourlyCostForPerson(selectedWork, selectedPerson, 0) : 0)
        : '',
    }))
  }

  function handleManualHourlyCostChange(event) {
    setAssignmentForm(current => ({
      ...current,
      hourlyCost: event.target.value,
    }))
  }

  function applyManualHourlyCostSuggestion(value) {
    setAssignmentForm(current => ({
      ...current,
      manualHourlyCost: true,
      hourlyCost: String(value),
    }))
    setFormErrors(current => ({ ...current, hourlyCost: '' }))
  }

  function validateAssignmentForm() {
    const nextErrors = {}

    if (!assignmentForm.personId) nextErrors.personId = 'Seleciona uma pessoa.'
    if (!assignmentForm.workId) nextErrors.workId = 'Seleciona uma obra.'
    if (canUseManualHourlyCost && assignmentForm.manualHourlyCost) {
      const numericHourlyCost = Number(assignmentForm.hourlyCost)
      if (assignmentForm.hourlyCost === '' || Number.isNaN(numericHourlyCost) || numericHourlyCost < 0) {
        nextErrors.hourlyCost = 'O preço manual tem de ser um número igual ou maior que 0.'
      }
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleMessageWorkToggle(workId) {
    const normalizedWorkId = String(workId)

    setSelectedMessageWorkIds(current =>
      current.includes(normalizedWorkId)
        ? current.filter(item => item !== normalizedWorkId)
        : [...current, normalizedWorkId]
    )
    setMessageSelectionError('')
  }

  function selectAllMessageWorks() {
    setSelectedMessageWorkIds(groupedAssignments.map(group => String(group.workId)))
    setMessageSelectionError('')
  }

  function clearMessageWorks() {
    setSelectedMessageWorkIds([])
    setMessageSelectionError('')
  }

  async function handleCopyMessage() {
    if (!generatedMessage.trim()) {
      setMessageSelectionError('Seleciona pelo menos uma obra para criar a mensagem.')
      return
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedMessage)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = generatedMessage
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setSuccess('Mensagem copiada com sucesso.')
      closeMessageModal()
    } catch (err) {
      setMessageSelectionError('Não foi possível copiar a mensagem.')
    }
  }

  async function handleCreateAssignment(event) {
    event.preventDefault()

    if (!selectedPlanningWorkspace || !isDraftPlanning || !validateAssignmentForm()) {
      return
    }

    setSavingAssignment(true)
    setError('')
    setSuccess('')

    try {
      const payload = assignmentForm.id
        ? {
            workId: Number(assignmentForm.workId),
            personId: Number(assignmentForm.personId),
            manualHourlyCost: assignmentForm.manualHourlyCost === true,
            hourlyCost: assignmentForm.manualHourlyCost ? selectedHourlyCost : undefined,
            notes: assignmentForm.notes,
            hasWorkAccess: selectedPerson && isChefRole(selectedPerson.role) ? assignmentForm.hasWorkAccess === true : false,
          }
        : {
            workspaceId: selectedPlanningWorkspace.id,
            workId: Number(assignmentForm.workId),
            personId: Number(assignmentForm.personId),
            manualHourlyCost: assignmentForm.manualHourlyCost === true,
            hourlyCost: assignmentForm.manualHourlyCost ? selectedHourlyCost : undefined,
            notes: assignmentForm.notes,
            hasWorkAccess: selectedPerson && isChefRole(selectedPerson.role) ? assignmentForm.hasWorkAccess === true : false,
          }

      const data = await savePlanningDraftAssignment(
        assignmentForm.id,
        payload,
        'Erro ao guardar afetação no rascunho',
      )

      setSuccess(
        assignmentForm.id
          ? `Afetação do rascunho atualizada para ${getPersonDisplayName(data.person)}.`
          : `Afetação criada no rascunho para ${getPersonDisplayName(data.person)}.`
      )
      closeAddModal()
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingAssignment(false)
    }
  }

  async function handleDeleteAssignment(assignment) {
    if (!isDraftPlanning) return

    const confirmed = window.confirm(
      `Pretendes realmente eliminar a afetação de ${getPersonDisplayName(assignment.person, assignment.personId)} do rascunho atual?`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      await deletePlanningDraftAssignment(assignment.id, 'Erro ao eliminar afetação do rascunho')

      setSuccess('Afetação removida do rascunho com sucesso.')
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleAssignmentDragStart(event, assignment) {
    if (!isDraftPlanning || savingAssignment) return

    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.setData('text/plain', String(assignment.id))
    }

    setDraggedAssignmentId(String(assignment.id))
    setDraggedSourceWorkId(String(assignment.workId))
    setDropTargetWorkId(null)
    setError('')
    setSuccess('')
  }

  function handleAssignmentDragEnd() {
    setDraggedAssignmentId(null)
    setDraggedSourceWorkId(null)
    setDropTargetWorkId(null)
  }

  function handleWorkDragOver(event, workId) {
    event.preventDefault()
    if (event?.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    if (!draggedAssignmentId) return
    if (String(workId) === String(draggedSourceWorkId)) {
      setDropTargetWorkId(null)
      return
    }
    setDropTargetWorkId(String(workId))
  }

  function handleWorkDragLeave(workId) {
    return
  }

  async function handleWorkDrop(event, targetWorkId) {
    event.preventDefault()

    const assignment = assignments.find(item => String(item.id) === String(draggedAssignmentId || ''))
    const targetWork = activeWorksById.get(String(targetWorkId))
    const targetPerson = assignment?.person || defaults.people.find(person => Number(person.id) === Number(assignment?.personId))

    setDraggedAssignmentId(null)
    setDraggedSourceWorkId(null)
    setDropTargetWorkId(null)

    if (!selectedPlanningWorkspace || !isDraftPlanning || !assignment || !targetWork || String(assignment.workId) === String(targetWorkId)) {
      return
    }

    setSavingAssignment(true)
    setError('')
    setSuccess('')

    try {
      await savePlanningDraftAssignment(
        assignment.id,
        {
          workId: Number(targetWorkId),
          personId: Number(assignment.personId),
          manualHourlyCost: false,
          hourlyCost: getWorkHourlyCostForPerson(targetWork, targetPerson, assignment.hourlyCost),
          notes: assignment.notes || '',
          hasWorkAccess: assignment.hasWorkAccess === true,
        },
        'Erro ao mover afetação no rascunho',
      )

      setSuccess(
        `${getPersonDisplayName(assignment.person, assignment.personId)} movido(a) para a obra ${getWorkDisplayReference(targetWork, targetWork.id)}.`,
      )
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingAssignment(false)
    }
  }

  const assignedPersonIds = useMemo(
    () => new Set(assignments.map(assignment => String(assignment.personId))),
    [assignments],
  )
  const totalAssignedPeople = assignedPersonIds.size
  const unassignedPeople = useMemo(
    () => defaults.people
      .filter(person => !assignedPersonIds.has(String(person.id)))
      .sort((left, right) => (left.name || '').localeCompare(right.name || '', 'pt-PT')),
    [assignedPersonIds, defaults.people],
  )
  const unassignedRoleOptions = useMemo(
    () => Array.from(new Set(unassignedPeople.map(person => person.role).filter(Boolean)))
      .sort((left, right) => getRoleLabel(left).localeCompare(getRoleLabel(right), 'pt-PT')),
    [unassignedPeople],
  )
  const filteredUnassignedPeople = useMemo(() => {
    if (selectedUnassignedRole === 'all') return unassignedPeople
    return unassignedPeople.filter(person => person.role === selectedUnassignedRole)
  }, [selectedUnassignedRole, unassignedPeople])
  const isInitialSummaryLoading = loading && defaults.people.length === 0 && defaults.works.length === 0 && assignments.length === 0
  const totalUnassignedPeople = unassignedPeople.length
  const totalUnplannedWorks = unplannedWorks.length
  const isPlanActionBusy = creating || publishing || switchingToDraft

  return (
    <ViewportPage lockViewport style={pageStyle}>
      <ViewportShell fillHeight style={shellStyle}>
        <ContentFrame width="ultra">
          <section style={heroStyle}>
            <div style={topBarStyle}>
              <div>
                <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
                  Voltar ao menu
                </Link>
                <h1 style={{ margin: '10px 0 8px', fontSize: '44px', lineHeight: 1.05, fontWeight: 900 }}>
                  Plano diário
                </h1>
              </div>
              <div style={heroActionColumnStyle}>
                <button
                  className="vp-planning-action-button"
                  type="button"
                  onClick={() => handleCreateWorkPlan(false)}
                  disabled={isPlanActionBusy}
                  style={
                    isPlanActionBusy
                      ? { ...disabledButtonStyle, ...compactActionButtonStyle, width: '100%' }
                      : { ...primaryButtonStyle, ...compactActionButtonStyle, width: '100%' }
                  }
                >
                  {creating && creatingMode === 'new' ? 'A criar...' : 'Criar novo'}
                </button>
              </div>
            </div>
            <div style={planningHeaderStyle}>
              <PlanningDatePopover
                value={selectedDate}
                displayLabel={formattedPlanningDate}
                onChange={setSelectedDate}
              />
            </div>

            <ResponsiveGrid preset="summary" style={topSummaryGridStyle}>
              <SurfaceCard as="article" variant="stat" style={{ '--vp-card-gap': '0px' }}>
                <div style={topSummaryLabelStyle}>Estado</div>
                <div style={{ marginTop: '10px' }}>
                  <span
                    style={{
                      ...statusPillStyle,
                      background: planningStatusMeta.background,
                      color: planningStatusMeta.color,
                      border: `1px solid ${planningStatusMeta.border}`,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '999px',
                        background: 'currentColor',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    {planningStatusMeta.label}
                  </span>
                </div>
              </SurfaceCard>
              <SurfaceCard as="article" variant="stat" style={{ '--vp-card-gap': '0px' }}>
                <div style={topSummaryLabelStyle}>Pessoas atribuídas</div>
                <div style={topSummaryValueStyle}>
                  {isInitialSummaryLoading ? '—' : totalAssignedPeople}
                </div>
              </SurfaceCard>
              <SurfaceCard
                as="button"
                variant="stat"
                interactive={!isInitialSummaryLoading && totalUnassignedPeople > 0}
                className="vp-planning-action-button"
                type="button"
                onClick={openUnassignedPeopleModal}
                disabled={isInitialSummaryLoading || totalUnassignedPeople === 0}
                style={{
                  '--vp-card-gap': '0px',
                  width: '100%',
                  textAlign: 'left',
                  color: 'inherit',
                  appearance: 'none',
                  font: 'inherit',
                  opacity: !isInitialSummaryLoading && totalUnassignedPeople > 0 ? 1 : 0.72,
                }}
              >
                <div style={topSummaryLabelStyle}>Pessoas não atribuídas</div>
                <div style={topSummaryValueStyle}>
                  {isInitialSummaryLoading ? '—' : totalUnassignedPeople}
                </div>
              </SurfaceCard>
              <SurfaceCard as="article" variant="stat" style={{ '--vp-card-gap': '0px' }}>
                <div style={topSummaryLabelStyle}>Obras pendentes</div>
                <div style={topSummaryValueStyle}>
                  {isInitialSummaryLoading ? '—' : totalUnplannedWorks}
                </div>
              </SurfaceCard>
            </ResponsiveGrid>
          </section>
        </ContentFrame>
        <ViewportScrollArea style={{ '--vp-page-scroll-gap': '24px' }}>
          <ContentFrame width="ultra">
            <FlowStack gap="lg">
              {(error || success || loading || (!selectedPlanningWorkspace && !error && !loading)) && (
                <SurfaceCard as="section" variant="panel">
                  {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
                  {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}
                  {loading && <p style={{ margin: 0 }}>A carregar plano diário...</p>}
                  {!selectedPlanningWorkspace && !error && !loading && (
                    <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                      Ainda não existe planeamento para este dia. Cria um novo plano para começar.
                    </p>
                  )}
                </SurfaceCard>
              )}

              {!loading && selectedPlanningWorkspace && (
                <SurfaceCard as="section" variant="panel" className="vp-planning-assignments-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontWeight: 900, fontSize: '22px' }}>Afetações do planeamento</h2>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {isDraftPlanning ? (
                        <>
                          <button
                            className="vp-planning-action-button"
                            type="button"
                            onClick={openAddModal}
                            disabled={savingAssignment || publishing}
                            style={
                              savingAssignment || publishing
                                ? { ...disabledButtonStyle, ...compactActionButtonStyle }
                                : { ...primaryButtonStyle, ...compactActionButtonStyle }
                            }
                          >
                            Adicionar
                          </button>
                          <button
                            className="vp-planning-action-button"
                            type="button"
                            onClick={handlePublishPlanning}
                            disabled={publishing || savingAssignment}
                            style={
                              publishing || savingAssignment
                                ? { ...disabledButtonStyle, ...compactActionButtonStyle }
                                : { ...secondaryButtonStyle, ...compactActionButtonStyle }
                            }
                          >
                            {publishing ? 'A publicar...' : 'Publicar'}
                          </button>
                        </>
                      ) : (
                        <button
                          className="vp-planning-action-button"
                          type="button"
                          onClick={handleEditPublishedPlanning}
                          disabled={switchingToDraft}
                          style={
                            switchingToDraft
                              ? { ...disabledButtonStyle, ...compactActionButtonStyle }
                              : { ...secondaryButtonStyle, ...compactActionButtonStyle }
                          }
                        >
                          {switchingToDraft ? 'A voltar...' : 'Editar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {duplicateNonChefAssignments.length > 0 && (
                    <div
                      style={{
                        padding: '16px 18px',
                        borderRadius: '18px',
                        border: '1px solid rgba(191, 106, 36, 0.34)',
                        background: 'rgba(243, 220, 207, 0.78)',
                        color: '#5b3417',
                        display: 'grid',
                        gap: '8px',
                      }}
                    >
                      <strong style={{ fontWeight: 900 }}>Atenção: pessoas afetadas em mais de uma obra</strong>
                      {duplicateNonChefAssignments.map(person => (
                        <span key={person.personId}>
                          {person.name}: {person.workNames.join(', ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {groupedAssignments.length === 0 && (
                    <p style={{ margin: 0 }}>Este plano ainda não tem afetações associadas.</p>
                  )}

                  {groupedAssignments.length > 0 && (
                    <ResponsiveGrid
                      style={{
                        '--vp-grid-gap': '14px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
                      }}
                    >
                      {groupedAssignments.map(group => {
                        const chefAccessAssignmentId = getChefAccessAssignmentId(group.assignments)
                        const totalChefAssignments = getChefAssignmentsForWork(group.assignments).length
                        const isDropActive = isDraftPlanning && (
                          dropTargetWorkId === String(group.workId) ||
                          (draggedSourceWorkId === String(group.workId) && !dropTargetWorkId)
                        )
                        const canReceiveDraggedAssignment =
                          isDraftPlanning &&
                          Boolean(draggedAssignmentId) &&
                          String(group.workId) !== String(draggedSourceWorkId)

                        return (
                          <SurfaceCard
                            as="article"
                            key={group.workId}
                            variant="work"
                            onDragOver={isDraftPlanning ? (event) => handleWorkDragOver(event, group.workId) : undefined}
                            onDragLeave={isDraftPlanning ? () => handleWorkDragLeave(group.workId) : undefined}
                            onDrop={isDraftPlanning ? (event) => handleWorkDrop(event, group.workId) : undefined}
                            style={{
                              '--vp-card-gap': '12px',
                              position: 'relative',
                              padding: '16px',
                              border: isDropActive ? '2px dashed var(--vp-accent)' : '1px solid var(--vp-border)',
                              background: isDropActive ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                            }}
                          >
                            {canReceiveDraggedAssignment && (
                              <div
                                className="vp-planning-work-drop-layer"
                                onDragEnter={(event) => handleWorkDragOver(event, group.workId)}
                                onDragOver={(event) => handleWorkDragOver(event, group.workId)}
                                onDrop={(event) => handleWorkDrop(event, group.workId)}
                                aria-hidden="true"
                              />
                            )}

                            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div>
                                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}>{group.workName}</h3>
                                  <p style={{ margin: '4px 0 0', color: 'var(--vp-text-muted)' }}>
                                    {group.assignments.length} afetações
                                  </p>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gap: '8px' }}>
                                {group.assignments.map(assignment => {
                                  const isChefAssignment = isChefRole(assignment.person?.role)
                                  const hasChefWorkAccess = isChefAssignment && String(assignment.id) === chefAccessAssignmentId
                                  const showChefAccessIndicator = totalChefAssignments > 1 && hasChefWorkAccess

                                  return (
                                    <div
                                      key={assignment.id}
                                      draggable={isDraftPlanning && !savingAssignment}
                                      onDragStart={isDraftPlanning ? (event) => handleAssignmentDragStart(event, assignment) : undefined}
                                      onDragEnd={isDraftPlanning ? handleAssignmentDragEnd : undefined}
                                      style={{
                                        border: '1px solid var(--vp-border)',
                                        borderRadius: '14px',
                                        padding: '10px 12px',
                                        background: 'var(--vp-surface-muted)',
                                        cursor: isDraftPlanning && !savingAssignment ? 'grab' : 'default',
                                        opacity: draggedAssignmentId === String(assignment.id) ? 0.55 : 1,
                                        display: 'grid',
                                        gap: '6px',
                                        userSelect: 'none',
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            {showChefAccessIndicator ? (
                                              <span
                                                style={chefAccessStarButtonStyle(true)}
                                                title="Chefe com acesso a esta obra"
                                                aria-label="Chefe com acesso a esta obra"
                                              >
                                                ★
                                              </span>
                                            ) : null}
                                            <strong style={{ fontWeight: 900 }}>
                                              {getPersonDisplayName(assignment.person, assignment.personId)}
                                            </strong>
                                          </div>
                                          <p style={{ margin: '4px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px', fontWeight: 700 }}>
                                            {getEntityRoleLabel(assignment.person)}
                                          </p>
                                          {duplicateNonChefPersonIds.has(String(assignment.personId)) && (
                                            <p style={{ margin: '4px 0 0', color: '#b45309', fontSize: '13px', fontWeight: 700 }}>
                                              Afetado(a) noutra obra neste dia.
                                            </p>
                                          )}
                                        </div>
                                        {isDraftPlanning && (
                                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <button
                                              type="button"
                                              onClick={() => openEditModal(assignment)}
                                              style={editPencilButtonStyle}
                                              title="Editar afetação"
                                              aria-label="Editar afetação"
                                            >
                                              <EditPencilIcon />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteAssignment(assignment)}
                                              style={trashBinButtonStyle}
                                              title="Eliminar afetação"
                                              aria-label="Eliminar afetação"
                                            >
                                              <TrashBinIcon />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      {assignment.notes && (
                                        <p style={{ margin: 0, color: 'var(--vp-text-soft)' }}>{assignment.notes}</p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </SurfaceCard>
                        )
                      })}
                    </ResponsiveGrid>
                  )}

                  {isDraftPlanning && unplannedWorks.length > 0 && (
                    <FlowStack gap="sm" style={{ marginTop: '4px', '--vp-stack-gap': '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Obras disponíveis para receber pessoas</h3>
                        <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                          Também podes puxar um nome para uma obra que ainda não tenha afetações neste dia.
                        </p>
                      </div>

                      <FlowStack gap="sm" style={{ '--vp-stack-gap': '10px' }}>
                        {unplannedWorks.map(work => (
                          <SurfaceCard
                            as="article"
                            key={work.id}
                            variant="dropzone"
                            onDragOver={(event) => handleWorkDragOver(event, work.id)}
                            onDragLeave={() => handleWorkDragLeave(work.id)}
                            onDrop={(event) => handleWorkDrop(event, work.id)}
                            style={{
                              padding: '14px 16px',
                              border: dropTargetWorkId === String(work.id) ? '2px dashed var(--vp-accent)' : '1px dashed var(--vp-border)',
                              background: dropTargetWorkId === String(work.id) ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                            }}
                          >
                            <strong>{getWorkDisplayReference(work, work.id)}</strong>
                            <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                              Larga aqui para mover uma pessoa para esta obra.
                            </p>
                          </SurfaceCard>
                        ))}
                      </FlowStack>
                    </FlowStack>
                  )}

                  <div className="vp-planning-secondary-action-bar">
                    <button
                      className="vp-planning-action-button"
                      type="button"
                      onClick={openMessageModal}
                      disabled={groupedAssignments.length === 0}
                      style={
                        groupedAssignments.length === 0
                          ? { ...disabledButtonStyle, ...compactActionButtonStyle }
                          : { ...secondaryButtonStyle, ...compactActionButtonStyle }
                      }
                    >
                      Importar mensagem
                    </button>
                  </div>
                </SurfaceCard>
              )}
            </FlowStack>
          </ContentFrame>
        </ViewportScrollArea>
      </ViewportShell>

      {showUnassignedPeopleModal && (
        <div style={modalBackdropStyle} onClick={closeUnassignedPeopleModal}>
          <section className="vp-modal-card" style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
                  Plano diário
                </p>
                <h2 style={{ margin: '10px 0 0', fontSize: '34px', lineHeight: 1.1 }}>
                  Pessoas não atribuídas
                </h2>
              </div>
              <button type="button" onClick={closeUnassignedPeopleModal} style={closeButtonStyle} aria-label="Fechar">
                ×
              </button>
            </div>

            {unassignedPeople.length > 0 && (
              <div style={{ marginTop: '18px', maxWidth: '260px' }}>
                <label style={labelStyle}>
                  Tipo de pessoa
                  <select
                    value={selectedUnassignedRole}
                    onChange={(event) => setSelectedUnassignedRole(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="all">Todas</option>
                    {unassignedRoleOptions.map(role => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {unassignedPeople.length === 0 ? (
              <p style={{ margin: '20px 0 0', color: 'var(--vp-text-muted)' }}>
                Não há pessoas não atribuídas para este dia.
              </p>
            ) : filteredUnassignedPeople.length === 0 ? (
              <p style={{ margin: '20px 0 0', color: 'var(--vp-text-muted)' }}>
                Não há pessoas não atribuídas com esse tipo.
              </p>
            ) : (
              <ul style={personListStyle}>
                {filteredUnassignedPeople.map(person => (
                  <li key={person.id} style={personListItemStyle}>
                    <strong>{getPersonDisplayName(person, person.id)}</strong>
                    <span style={{ color: 'var(--vp-text-muted)' }}>{getEntityRoleLabel(person)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {showAddModal && selectedPlanningWorkspace && isDraftPlanning && (
        <div style={modalBackdropStyle} onClick={closeAddModal}>
          <section className="vp-modal-card" style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{assignmentForm.id ? 'Editar afetação' : 'Adicionar afetação'}</h2>
                {assignmentForm.id ? (
                  <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px', fontWeight: 700 }}>
                    ID da afetação: {assignmentForm.id}
                  </p>
                ) : null}
              </div>
              <button type="button" onClick={closeAddModal} style={closeButtonStyle} aria-label="Fechar">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} style={{ display: 'grid', gap: '14px', marginTop: '18px', overflow: 'hidden' }}>
              <ResponsiveGrid preset="modal-form" style={{ '--vp-grid-gap': '14px' }}>
                <label style={labelStyle}>
                  Pessoa
                  <select name="personId" value={assignmentForm.personId} onChange={handleAssignmentChange} style={inputStyle}>
                    <option value="">Seleciona uma pessoa</option>
                    {sortedPeople.map(person => (
                      <option key={person.id} value={person.id}>
                        {getPersonDisplayName(person, person.id)} ({getEntityRoleLabel(person)})
                      </option>
                    ))}
                  </select>
                  {formErrors.personId && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.personId}</span>}
                </label>

                <label style={labelStyle}>
                  Obra
                  <select name="workId" value={assignmentForm.workId} onChange={handleAssignmentChange} style={inputStyle}>
                    <option value="">Seleciona uma obra</option>
                    {activeWorks.map(work => (
                      <option key={work.id} value={work.id}>
                        {getWorkDisplayReference(work, work.id)}
                      </option>
                    ))}
                  </select>
                  {formErrors.workId && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.workId}</span>}
                </label>
              </ResponsiveGrid>

              {canChooseChefWorkAccessOnAdd && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: `1px solid ${assignmentForm.hasWorkAccess ? 'var(--vp-accent)' : 'var(--vp-border)'}`,
                    background: assignmentForm.hasWorkAccess ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontWeight: 900 }}>Acesso do chefe à obra</strong>
                    </div>
                    <span style={chefAccessStarButtonStyle(assignmentForm.hasWorkAccess === true)}>
                      {assignmentForm.hasWorkAccess ? '★' : '☆'}
                    </span>
                  </div>

                  {selectedWorkChefAssignments.length > 0 && (
                    <p style={{ margin: 0, color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                      Chefes já nesta obra:{' '}
                      {selectedWorkChefAssignments
                        .map(assignment => getPersonDisplayName(assignment.person, assignment.personId))
                        .join(', ')}.
                    </p>
                  )}

                  <p style={{ margin: 0, color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                    {shouldSuggestChefAccessOnAdd
                      ? `Como estás a preparar mais um chefe para esta obra, por defeito o acesso vai ficar com ${selectedWorkAccessChef?.person ? getPersonDisplayName(selectedWorkAccessChef.person, selectedWorkAccessChef.personId) : 'o chefe que vinha dos dias anteriores'}.`
                      : 'Se este chefe ficar com estrela, será ele a entrar nesta obra na aplicação.'}
                  </p>

                  {assignmentForm.hasWorkAccess ? (
                    <p style={{ margin: 0, color: 'var(--vp-highlight-text)', fontSize: '13px', fontWeight: 700 }}>
                      Este é o chefe que fica com acesso a esta obra.
                    </p>
                  ) : (
                    <div>
                      <button
                        className="vp-planning-action-button"
                        type="button"
                        onClick={() => setAssignmentForm(current => ({ ...current, hasWorkAccess: true }))}
                        style={secondaryButtonStyle}
                      >
                        Dar estrela a este chefe
                      </button>
                      {shouldSuggestChefAccessOnAdd && (
                        <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                          Por defeito, fica selecionado o chefe que já vinha dos dias anteriores nesta obra.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {canChooseChefWorkAccessInEdit && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: `1px solid ${assignmentForm.hasWorkAccess ? 'var(--vp-accent)' : 'var(--vp-border)'}`,
                    background: assignmentForm.hasWorkAccess ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontWeight: 900 }}>Acesso do chefe à obra</strong>
                      <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                        Como existem vários chefes nesta obra, só o chefe com estrela terá acesso a ela na aplicação.
                      </p>
                    </div>
                    <span style={chefAccessStarButtonStyle(assignmentForm.hasWorkAccess === true)}>
                      {assignmentForm.hasWorkAccess ? '★' : '☆'}
                    </span>
                  </div>

                  {assignmentForm.hasWorkAccess ? (
                    <p style={{ margin: 0, color: 'var(--vp-highlight-text)', fontSize: '13px', fontWeight: 700 }}>
                      Este é o chefe que fica com acesso a esta obra.
                    </p>
                  ) : (
                    <div>
                      <button
                        className="vp-planning-action-button"
                        type="button"
                        onClick={() => setAssignmentForm(current => ({ ...current, hasWorkAccess: true }))}
                        style={secondaryButtonStyle}
                      >
                        Dar estrela a este chefe
                      </button>
                      <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                        Por defeito, fica selecionado o chefe que já vinha dos dias anteriores nesta obra.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {canUseManualHourlyCost && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1px solid var(--vp-border)',
                    background: 'var(--vp-surface)',
                    display: 'grid',
                    gap: '12px',
                  }}
                >
                  <label style={{ ...workingDayOptionStyle, marginTop: 0 }}>
                    <input
                      type="checkbox"
                      checked={assignmentForm.manualHourlyCost === true}
                      onChange={handleManualHourlyCostToggle}
                    />
                    Preço manual nesta afetação
                  </label>

                  {assignmentForm.manualHourlyCost ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <span style={labelStyle}>Preço hora manual</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={assignmentForm.hourlyCost}
                        onChange={handleManualHourlyCostChange}
                        style={{ ...inputStyle, maxWidth: '240px', marginTop: 0 }}
                      />
                      {manualHourlyCostSuggestions.length > 0 && (
                        <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--vp-text-muted)', fontWeight: 700 }}>
                            Sugestões desta obra para esta pessoa
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {manualHourlyCostSuggestions.map(suggestion => (
                              <button
                                className="vp-planning-action-button"
                                key={suggestion.key}
                                type="button"
                                onClick={() => applyManualHourlyCostSuggestion(suggestion.value)}
                                style={{
                                  ...secondaryButtonStyle,
                                  padding: '7px 12px',
                                  fontSize: '12px',
                                  lineHeight: 1.2,
                                }}
                              >
                                {suggestion.label}: {formatHourlyCostLabel(suggestion.value)}/h
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {formErrors.hourlyCost && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.hourlyCost}</span>}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                      Preço automático pela hierarquia: pessoa na obra, role da obra, default da obra.
                    </p>
                  )}
                </div>
              )}

              <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--vp-highlight)', color: 'var(--vp-highlight-text)' }}>
                <strong>Resumo:</strong>{' '}
                {selectedPerson ? selectedPerson.name : 'Escolhe uma pessoa'}
                {' | '}
                {selectedWork ? `Obra: ${selectedWork.name}` : 'Escolhe uma obra'}
                {' | '}
                {selectedWork ? `Preço: ${selectedHourlyCost}/h (${selectedHourlyCostSource})` : 'Preço automático pela obra'}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="vp-planning-action-button" type="submit" disabled={savingAssignment} style={primaryButtonStyle}>
                  {savingAssignment ? 'A gravar...' : assignmentForm.id ? 'Guardar alterações' : 'Criar afetação'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showMessageModal && selectedPlanningWorkspace && (
        <div style={modalBackdropStyle} onClick={closeMessageModal}>
          <section className="vp-modal-card" style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Importar mensagem</h2>
              <button type="button" onClick={closeMessageModal} style={closeButtonStyle} aria-label="Fechar">
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
              <button className="vp-planning-action-button" type="button" onClick={selectAllMessageWorks} style={secondaryButtonStyle}>
                Selecionar todas
              </button>
              <button className="vp-planning-action-button" type="button" onClick={clearMessageWorks} style={secondaryButtonStyle}>
                Limpar seleção
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
              {groupedAssignments.map(group => {
                const checked = selectedMessageWorkIds.includes(String(group.workId))

                return (
                  <label
                    key={group.workId}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: `1px solid ${checked ? 'var(--vp-accent)' : 'var(--vp-border)'}`,
                      background: checked ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleMessageWorkToggle(group.workId)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <strong>{group.workName}</strong>
                      <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
                        {group.assignments
                          .map(assignment => getPersonDisplayName(assignment.person, assignment.personId))
                          .join(', ')}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>

            <label style={{ ...labelStyle, marginTop: '18px' }}>
              Pré-visualização da mensagem
              <textarea
                readOnly
                value={generatedMessage}
                rows={12}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
              />
            </label>

            {messageSelectionError && (
              <p style={{ margin: '12px 0 0', color: '#b42318' }}>{messageSelectionError}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
              <button className="vp-planning-action-button" type="button" onClick={handleCopyMessage} style={primaryButtonStyle}>
                Copiar mensagem
              </button>
            </div>
          </section>
        </div>
      )}
    </ViewportPage>
  )
}

