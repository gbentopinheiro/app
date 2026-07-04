# Draft / Published Planning Workflow Architecture Review Input

## 1. Changed Files

| Status | Path | Purpose | Type |
| --- | --- | --- | --- |
| Modified | `app/daily-plan/page.js` | Replaces direct published-plan editing with Draft / Published admin UI workflow | React / Next page |
| Added | `app/api/planning-workspace-assignments/route.js` | Creates draft assignments | Next API |
| Added | `app/api/planning-workspace-assignments/[id]/route.js` | Updates and deletes draft assignments | Next API |
| Added | `app/api/planning-workspaces/route.js` | Loads planning workspace view and initializes draft | Next API |
| Added | `app/api/planning-workspaces/[id]/edit/route.js` | Returns a published workspace to Draft | Next API |
| Added | `app/api/planning-workspaces/[id]/publish/route.js` | Publishes a draft workspace | Next API |
| Added | `frontend/controllers/planning-workspaces-controller.js` | Frontend HTTP client for planning workspace endpoints | Frontend controller |
| Modified | `lib/access-identities.js` | Restricts chef work access derivation to published-visible assignments | Domain library |
| Modified | `lib/auth.js` | Adds permission-path mapping for new planning endpoints | Auth / middleware support |
| Modified | `lib/data-management.js` | Exports and measures draft workspace JSON data | Data management |
| Modified | `lib/db/core-mappers.js` | Adds planning workspace mappers and publication state normalization | Prisma mapper |
| Added | `lib/db/planning-workspaces-db.js` | Prisma repository for planning workspace tables | Prisma repository |
| Modified | `lib/db/work-assignments-db.js` | Adds `planningVisible` persistence and filtering on official assignments | Prisma repository |
| Added | `lib/planning-publication.js` | Core business orchestration for draft creation, editing and publish | Domain service |
| Added | `lib/planning-workspaces.js` | JSON/MySQL abstraction for draft workspace persistence | Domain persistence |
| Modified | `lib/work-assignment-policy.js` | Hides non-operational hidden assignments from consumers | Domain policy |
| Modified | `lib/work-assignments.js` | Adds `planningVisible`, operational visibility rules, and planning-only mutation helper | Domain library |
| Modified | `schema.prisma` | Adds planning workspace schema and `planningVisible` on official assignments | Prisma schema |
| Modified | `scripts/import-json-to-mysql.mjs` | Imports new planning workspace entities into MySQL | Import script |
| Modified | `scripts/mysql-migration-utils.mjs` | Includes new planning workspace entities in JSON snapshot/export | Snapshot script |
| Modified | `scripts/mysql-validation-baseline-utils.mjs` | Counts new planning workspace tables in MySQL validation | Validation script |
| Added | `server/controllers/planning-publication-controller.js` | HTTP controller layer for planning publication workflow | Server controller |
| Added | `server/services/planning-publication-service.js` | Permissioned application service for planning publication workflow | Server service |
| Modified | `tests/critical-flows.test.mjs` | Replaces old 08:00 lock coverage with Draft / Published workflow coverage | Test |

Deleted files: none.

## 2. Git Diff

Complete diff file:

- [draft-published-workflow-diff.patch](/C:/Users/gbent/OneDrive/Ambiente%20de%20Trabalho/VILAPLANO/app/.tmp/draft-published-workflow-diff.patch)

Patch size:

- 4003 lines

Contents:

- Modified tracked files diff from `git diff`
- Added untracked files emitted as full `new file` patch blocks
- No code omitted from the patch file

## 3. Prisma

### Complete `schema.prisma` diff

- See section 2 patch file
- Primary schema file: [schema.prisma](/C:/Users/gbent/OneDrive/Ambiente%20de%20Trabalho/VILAPLANO/app/schema.prisma)

### New models

1. `PlanningWorkspace`
2. `PlanningWorkspaceAssignment`

### Modified models

1. `Company`
   Added relation: `planningWorkspaces PlanningWorkspace[]`
2. `Person`
   Added relation: `planningWorkspaceAssignments PlanningWorkspaceAssignment[]`
3. `Work`
   Added relation: `planningWorkspaceAssignments PlanningWorkspaceAssignment[]`
4. `WorkPlan`
   Added relation: `publishedPlanningWorkspace PlanningWorkspace?`
5. `WorkAssignment`
   Added column: `planningVisible Boolean @default(true) @map("planning_visible")`

### Removed fields

- None

### New enum

1. `PlanningPublicationState`
   - `draft`
   - `published`

### New indexes

1. `PlanningWorkspace`
   - implicit unique index on `[companyId, date]`
   - implicit unique index on `publishedWorkPlanId`
2. `PlanningWorkspaceAssignment`
   - `@@index([workspaceId])`
   - `@@index([workId])`
   - `@@index([personId])`
   - implicit unique index on `[workspaceId, workId, personId]`

### New constraints

1. `PlanningWorkspace`
   - `@@unique([companyId, date])`
   - `publishedWorkPlanId Int? @unique`
2. `PlanningWorkspaceAssignment`
   - `@@unique([workspaceId, workId, personId])`

### New relations

1. `PlanningWorkspace.company -> Company`
2. `PlanningWorkspace.publishedWorkPlan -> WorkPlan`
3. `PlanningWorkspace.assignments -> PlanningWorkspaceAssignment[]`
4. `PlanningWorkspaceAssignment.workspace -> PlanningWorkspace`
5. `PlanningWorkspaceAssignment.work -> Work`
6. `PlanningWorkspaceAssignment.person -> Person`

### Migrations

- No Prisma migration files were added
- Deployment expectation is `npx prisma db push`

## 4. Database

### Affected tables

1. `work_assignments`
2. `planning_workspaces`
3. `planning_workspace_assignments`
4. Existing relation owners with schema-level back-relations only:
   - `companies`
   - `people`
   - `works`
   - `work_plans`

### New columns

1. `work_assignments.planning_visible BOOLEAN NOT NULL DEFAULT true`
2. `planning_workspaces.company_id`
3. `planning_workspaces.date`
4. `planning_workspaces.state`
5. `planning_workspaces.published_work_plan_id NULL`
6. `planning_workspaces.published_at NULL`
7. `planning_workspaces.created_at`
8. `planning_workspaces.updated_at`
9. `planning_workspace_assignments.workspace_id`
10. `planning_workspace_assignments.work_id`
11. `planning_workspace_assignments.person_id`
12. `planning_workspace_assignments.hourly_cost`
13. `planning_workspace_assignments.manual_hourly_cost`
14. `planning_workspace_assignments.notes NULL`
15. `planning_workspace_assignments.has_work_access`
16. `planning_workspace_assignments.created_at`
17. `planning_workspace_assignments.updated_at`

### Nullable changes

1. `planning_workspaces.published_work_plan_id` is nullable
2. `planning_workspaces.published_at` is nullable
3. `planning_workspace_assignments.notes` is nullable
4. No existing column nullability was changed

### FK changes

1. `planning_workspaces.company_id -> companies.id`
   - `onDelete: Cascade`
   - `onUpdate: Cascade`
2. `planning_workspaces.published_work_plan_id -> work_plans.id`
   - `onDelete: SetNull`
   - `onUpdate: Cascade`
3. `planning_workspace_assignments.workspace_id -> planning_workspaces.id`
   - `onDelete: Cascade`
   - `onUpdate: Cascade`
4. `planning_workspace_assignments.work_id -> works.id`
   - `onDelete: Cascade`
   - `onUpdate: Cascade`
5. `planning_workspace_assignments.person_id -> people.id`
   - `onDelete: Cascade`
   - `onUpdate: Cascade`

### Unique constraints

1. `planning_workspaces(company_id, date)`
2. `planning_workspaces(published_work_plan_id)`
3. `planning_workspace_assignments(workspace_id, work_id, person_id)`

### Indexes

1. Unique index for `planning_workspaces(company_id, date)`
2. Unique index for `planning_workspaces(published_work_plan_id)`
3. Index `planning_workspace_assignments(workspace_id)`
4. Index `planning_workspace_assignments(work_id)`
5. Index `planning_workspace_assignments(person_id)`
6. Existing `work_assignments` indexes unchanged
7. No new index added on `work_assignments.planning_visible`

### Transactions

- No business transaction was added to the Draft / Published publish path
- `publishPlanningWorkspaceData()` performs sequential writes without `prisma.$transaction`

### Optimistic locking

- None

## 5. Business Flow

### Create Draft

API:

1. `POST /api/planning-workspaces`

Code path:

1. `app/api/planning-workspaces/route.js`
2. `server/controllers/planning-publication-controller.js`
3. `server/services/planning-publication-service.js`
4. `lib/planning-publication.js`

Tables changed:

1. `planning_workspaces`
2. `planning_workspace_assignments`

Records created:

1. If no workspace exists for `(companyId, date)`, one `planning_workspaces` row is created
2. If `clonePreviousDay=true`, N `planning_workspace_assignments` rows are created from the latest previous published plan
3. If an existing published plan exists for the same date and no workspace exists yet, `ensureWorkspaceSeededFromPublishedPlan()` creates one workspace row and seeds draft rows from published official assignments

Database operations:

1. `getPlanningWorkspaceByDateData(date, companyId)`
2. Optional backfill:
   - `getWorkPlanByDateData(date, companyId)`
   - `createPlanningWorkspaceData({... state: 'published' ...})`
   - `getAllWorkAssignmentsData({ workPlanId })`
   - `replacePlanningWorkspaceAssignmentsData(workspace.id, publishedAssignments)`
3. If `clonePreviousDay=true`:
   - `getAllWorkPlansData({ companyId })`
   - for each previous plan candidate: `getAllWorkAssignmentsData({ workPlanId })`
   - `replacePlanningWorkspaceAssignmentsData(workspace.id, clonedAssignments)`
4. If `clonePreviousDay=false`:
   - `replacePlanningWorkspaceAssignmentsData(workspace.id, [])`
5. `updatePlanningWorkspaceData(workspace.id, { state: 'draft' })`

### Edit Draft

APIs:

1. `POST /api/planning-workspace-assignments`
2. `PUT /api/planning-workspace-assignments/:id`
3. `DELETE /api/planning-workspace-assignments/:id`
4. `POST /api/planning-workspaces/:id/edit`

What happens:

1. Only draft tables change
2. Official published tables do not change
3. Chef access star is normalized inside the draft workspace per work
4. Published workspace must be explicitly returned to Draft before assignment edits are allowed

Entities changed:

1. `planning_workspace_assignments`
2. `planning_workspaces.state`

Database operations:

1. Create draft assignment:
   - `getPlanningWorkspaceByIdData`
   - `createPlanningWorkspaceAssignmentData`
   - one or more `updatePlanningWorkspaceAssignmentData` calls during chef access normalization
   - `updatePlanningWorkspaceData(state='draft')`
2. Update draft assignment:
   - `getPlanningWorkspaceAssignmentByIdData`
   - `getPlanningWorkspaceByIdData`
   - `updatePlanningWorkspaceAssignmentData`
   - one or more `updatePlanningWorkspaceAssignmentData` calls during chef access normalization
   - `updatePlanningWorkspaceData(state='draft')`
3. Delete draft assignment:
   - `getPlanningWorkspaceAssignmentByIdData`
   - `deletePlanningWorkspaceAssignmentData`
   - optional `updatePlanningWorkspaceAssignmentData` during chef access normalization
   - `updatePlanningWorkspaceData(state='draft')`
4. Return published workspace to draft:
   - `getPlanningWorkspaceByIdData`
   - if draft rows are empty and `publishedWorkPlanId` exists:
     - `getAllWorkAssignmentsData({ workPlanId })`
     - `replacePlanningWorkspaceAssignmentsData(...)`
   - `updatePlanningWorkspaceData(state='draft')`

### Publish

API:

1. `POST /api/planning-workspaces/:id/publish`

Transaction:

- None

Exact database flow:

1. Load draft workspace:
   - `getPlanningWorkspaceByIdData(workspaceId)`
2. Assert state is `draft`
3. Load draft assignments:
   - `getPlanningWorkspaceAssignmentsData({ workspaceId })`
4. Resolve published official work plan:
   - `getWorkPlanByIdData(workspace.publishedWorkPlanId)` if present
   - otherwise `getWorkPlanByDateData(workspace.date, workspace.companyId)`
   - otherwise `createWorkPlanData({ companyId, date })`
5. Load existing official published-layer assignments:
   - `getAllWorkAssignmentsData({ workPlanId: publishedWorkPlan.id })`
6. Build key map by `(workId, personId)`
7. For every official assignment missing from draft:
   - `updateWorkAssignmentPlanningData(officialAssignment.id, { hasWorkAccess: false, planningVisible: false })`
   - No delete
   - No archive table
8. For every draft assignment not yet existing officially:
   - `createWorkAssignmentData({ workPlanId, workId, personId, hours: getDefaultHoursForDate(date), hourlyCost, manualHourlyCost, notes, hasWorkAccess, planningVisible: true })`
9. For every draft assignment already existing officially:
   - `updateWorkAssignmentPlanningData(officialAssignment.id, { notes, hasWorkAccess, planningVisible: true, hourlyCost?, manualHourlyCost? })`
   - `hourlyCost` and `manualHourlyCost` are updated only when no committed hours exist
10. Final workspace state update:
    - `updatePlanningWorkspaceData(workspace.id, { state: 'published', publishedWorkPlanId, publishedAt })`

Copy:

- Draft rows are copied into official assignments only on publish

Update:

- Existing official assignments are updated in place

Replace:

- No official row replacement table-wide
- Matching official rows are updated

Delete:

- No official assignments deleted during publish

Archive:

- No archive table

### Mobile Read

Endpoint:

1. `GET /api/work-assignments?includeDefaults=true&date=YYYY-MM-DD`

Client path:

1. `app/mobile/chef/ChefMobileDailyHoursClient.js`
2. `frontend/controllers/chef-daily-hours-controller.js`

Repository query:

1. `getWorkAssignmentsListService(session, searchParams)`
2. `getAllWorkAssignmentsData({ date, ... })`
3. MySQL path:
   ```js
   prisma.workAssignment.findMany({
     where: {
       ...(date ? { workPlan: { date } } : {}),
       ...(workPlanId ? { workPlanId } : {}),
       ...(workId ? { workId } : {}),
       ...(personId ? { personId } : {}),
       ...(planningVisible !== undefined ? { planningVisible } : {}),
     },
     include: getWorkAssignmentIncludes(),
     orderBy: [{ workPlanId: 'asc' }, { workId: 'asc' }, { id: 'asc' }],
   })
   ```

How Draft is excluded:

1. Mobile never queries `planning_workspaces`
2. Mobile only reads `work_assignments`
3. Draft changes remain in `planning_workspace_assignments` until publish
4. Hidden old official rows are filtered by `filterAssignmentsForSession()` and `isAssignmentOperationallyVisible()`

### Admin Read

Endpoint:

1. `GET /api/planning-workspaces?date=YYYY-MM-DD`

Repository queries:

1. `getPlanningWorkspaceByDateData(date, companyId)`
2. Optional backfill from official layer:
   - `getWorkPlanByDateData(date, companyId)`
   - `getAllWorkAssignmentsData({ workPlanId })`
3. `getPlanningWorkspaceAssignmentsData({ workspaceId })`
4. `getAssignmentDefaultsData()`

MySQL queries:

1. `prisma.planningWorkspace.findUnique({ where: { companyId_date: { companyId, date } } })`
2. `prisma.planningWorkspaceAssignment.findMany({ where: { workspaceId }, include: getPlanningWorkspaceAssignmentIncludes(), orderBy: [...] })`

How Draft is loaded:

1. Admin `/daily-plan` now reads only the planning workspace view endpoint
2. The endpoint returns `workspace`, `items`, and `defaults`
3. `workspace.state` determines badge and action buttons

## 6. API Changes

| Method | Path | Request | Response | Permissions |
| --- | --- | --- | --- | --- |
| `GET` | `/api/planning-workspaces` | Query: `date`, optional `companyId` | `{ workspace, items, defaults }` | `work_plans.read` |
| `POST` | `/api/planning-workspaces` | `{ date, companyId?, clonePreviousDay? }` | `{ workspace, clonedAssignments, clonedFromDate, clearedAssignments, reusedWorkspace, items }` | `work_plans.create`, plus `work_plans.copy_previous` when cloning |
| `POST` | `/api/planning-workspaces/:id/publish` | none | updated workspace `{ id, companyId, date, state, publishedWorkPlanId, publishedAt, createdAt, updatedAt }` | `work_plans.update` |
| `POST` | `/api/planning-workspaces/:id/edit` | none | updated workspace `{ id, companyId, date, state, publishedWorkPlanId, publishedAt, createdAt, updatedAt }` | `work_plans.update` |
| `POST` | `/api/planning-workspace-assignments` | `{ workspaceId, workId, personId, hourlyCost?, manualHourlyCost?, notes?, hasWorkAccess? }` | created draft assignment with embedded `person` and `work` | `work_assignments.create` |
| `PUT` | `/api/planning-workspace-assignments/:id` | `{ workId?, personId?, hourlyCost?, manualHourlyCost?, notes?, hasWorkAccess? }` | updated draft assignment with embedded `person` and `work` | `work_assignments.update` |
| `DELETE` | `/api/planning-workspace-assignments/:id` | none | `{ message: 'Afetacao de draft removida com sucesso' }` | `work_assignments.delete` |
| Behavioral change | `/api/work-assignments` `GET` | existing query params | unchanged shape; hidden stale official rows no longer returned | existing route permissions unchanged |

## 7. Services

Modified server service files:

1. `server/services/planning-publication-service.js`

Complete source code:

```js
import { resolveCompanyId } from '../../lib/companies.js'
import { hasPermission } from '../../lib/permissions.js'
import {
  createPlanningDraftAssignmentData,
  deletePlanningDraftAssignmentData,
  getPlanningWorkspaceViewData,
  initializePlanningWorkspaceDraftData,
  publishPlanningWorkspaceData,
  setPlanningWorkspaceToDraftData,
  updatePlanningDraftAssignmentData,
} from '../../lib/planning-publication.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message = 'Sem permissao para gerir o planeamento diario.') {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

function toPlanningMutationError(error, fallbackMessage) {
  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status =
    message.includes('nao encontrado') || message.includes('Nao existe')
      ? 404
      : message.includes('obrigatorio') ||
          message.includes('Ja existe') ||
          message.includes('data valida') ||
          message.includes('negativo') ||
          message.includes('voltar a draft')
        ? 400
        : 500

  return new HttpError(status, message)
}

export async function getPlanningWorkspaceViewService(session, searchParams) {
  ensurePermission(session, 'work_plans.read', 'Sem permissao para consultar o planeamento diario.')

  const date = searchParams.get('date')
  const companyId = resolveCompanyId(searchParams.get('companyId'))

  if (!date) {
    throw new HttpError(400, 'date e obrigatorio')
  }

  return getPlanningWorkspaceViewData({ date, companyId })
}

export async function initializePlanningWorkspaceDraftService(session, body) {
  ensurePermission(session, 'work_plans.create')

  const date = body?.date
  const clonePreviousDay = body?.clonePreviousDay === true
  const companyId = resolveCompanyId(body?.companyId)

  if (!date) {
    throw new HttpError(400, 'date e obrigatorio')
  }

  if (clonePreviousDay) {
    ensurePermission(
      session,
      'work_plans.copy_previous',
      'Sem permissao para copiar o planeamento anterior.',
    )
  }

  try {
    return await initializePlanningWorkspaceDraftData({
      date,
      companyId,
      clonePreviousDay,
    })
  } catch (error) {
    throw toPlanningMutationError(error, 'Erro ao preparar draft do planeamento')
  }
}

export async function publishPlanningWorkspaceService(session, workspaceId) {
  ensurePermission(session, 'work_plans.update')

  try {
    return await publishPlanningWorkspaceData(workspaceId)
  } catch (error) {
    throw toPlanningMutationError(error, 'Erro ao publicar planeamento')
  }
}

export async function setPlanningWorkspaceToDraftService(session, workspaceId) {
  ensurePermission(session, 'work_plans.update')

  try {
    return await setPlanningWorkspaceToDraftData(workspaceId)
  } catch (error) {
    throw toPlanningMutationError(error, 'Erro ao voltar o planeamento para draft')
  }
}

export async function createPlanningDraftAssignmentService(session, body) {
  ensurePermission(session, 'work_assignments.create', 'Sem permissao para criar afetacoes no draft.')

  const workspaceId = Number(body?.workspaceId)
  const workId = Number(body?.workId)
  const personId = Number(body?.personId)

  if (!workspaceId || !workId || !personId) {
    throw new HttpError(400, 'workspaceId, workId e personId sao obrigatorios')
  }

  try {
    return await createPlanningDraftAssignmentData(workspaceId, body || {})
  } catch (error) {
    throw toPlanningMutationError(error, 'Erro ao criar afetacao no draft')
  }
}

export async function updatePlanningDraftAssignmentService(session, assignmentId, body) {
  ensurePermission(session, 'work_assignments.update', 'Sem permissao para editar afetacoes no draft.')

  try {
    const assignment = await updatePlanningDraftAssignmentData(assignmentId, body || {})

    if (!assignment) {
      throw new HttpError(404, 'Afetacao de draft nao encontrada')
    }

    return assignment
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toPlanningMutationError(error, 'Erro ao atualizar afetacao no draft')
  }
}

export async function deletePlanningDraftAssignmentService(session, assignmentId) {
  ensurePermission(session, 'work_assignments.delete', 'Sem permissao para remover afetacoes do draft.')

  try {
    const deleted = await deletePlanningDraftAssignmentData(assignmentId)

    if (!deleted) {
      throw new HttpError(404, 'Afetacao de draft nao encontrada')
    }

    return { message: 'Afetacao de draft removida com sucesso' }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toPlanningMutationError(error, 'Erro ao remover afetacao do draft')
  }
}
```

## 8. Repository / Database Layer

### New Prisma queries

File: `lib/db/planning-workspaces-db.js`

1. `prisma.planningWorkspace.findUnique({ where: { id } })`
2. `prisma.planningWorkspace.findMany({ where: companyId ? { companyId } : undefined, orderBy: [{ date: 'asc' }, { id: 'asc' }] })`
3. `prisma.planningWorkspace.findUnique({ where: { companyId_date: { companyId, date } } })`
4. `prisma.planningWorkspace.create({ data })`
5. `prisma.planningWorkspace.update({ where: { id }, data })`
6. `prisma.planningWorkspaceAssignment.findMany({ where, include: getPlanningWorkspaceAssignmentIncludes(), orderBy: [{ workspaceId: 'asc' }, { workId: 'asc' }, { id: 'asc' }] })`
7. `prisma.planningWorkspaceAssignment.findUnique({ where: { id }, include: getPlanningWorkspaceAssignmentIncludes() })`
8. `prisma.planningWorkspaceAssignment.create({ data, include: getPlanningWorkspaceAssignmentIncludes() })`
9. `prisma.planningWorkspaceAssignment.update({ where: { id }, data, include: getPlanningWorkspaceAssignmentIncludes() })`
10. `prisma.planningWorkspaceAssignment.delete({ where: { id } })`
11. `prisma.planningWorkspaceAssignment.deleteMany({ where: { workspaceId } })`

### Modified Prisma queries

File: `lib/db/work-assignments-db.js`

1. `toWorkAssignmentMutation(data)` now writes `planningVisible`
2. `mapWorkAssignmentRecord(record)` now maps `planningVisible`
3. `prisma.workAssignment.findMany(...)` now conditionally includes:
   ```js
   ...(planningVisible !== undefined ? { planningVisible } : {})
   ```

### Non-Prisma repository changes

1. `lib/work-assignments.js`
   - Added `updateWorkAssignmentPlanningData(id, data)` helper
   - Added planning-only submitted-row update allowance
2. `lib/planning-workspaces.js`
   - Added JSON persistence mirror for draft workspace entities

## 9. Permissions

### Who can create Draft

1. Admin profile
2. Permission: `work_plans.create`
3. Path guard:
   - `proxy.js`
   - `lib/auth.js`
   - `/api/planning-workspaces` mapped under work plan permissions

### Who can edit Draft

1. Admin profile
2. Permissions:
   - `work_assignments.create`
   - `work_assignments.update`
   - `work_assignments.delete`
   - `work_plans.update` for `Edit` state change
3. Path guard:
   - chiefs cannot access `/api/planning-workspaces*`
   - chiefs cannot access `/api/planning-workspace-assignments*` through `canChefAccessPath()`

### Who can publish

1. Admin profile
2. Permission: `work_plans.update`

### Who can delete Draft

1. There is no workspace delete endpoint
2. Draft assignment deletion:
   - Admin profile
   - Permission: `work_assignments.delete`

### Who can view Draft

1. Admin profile
2. Permission: `work_plans.read`

### Who can view Published

1. Admin profile via `/api/work-assignments` and business pages
2. Chef profile via `/api/work-assignments`
3. Reports and dashboard via official assignment reads

### Middleware

Files:

1. `proxy.js`
2. `lib/auth.js`

Relevant changes:

1. `lib/auth.js` now maps:
   - `/api/planning-workspaces`
   - `/api/planning-workspace-assignments`
2. Service-level checks in `server/services/planning-publication-service.js` enforce permissions again

## 10. Reporting

### Reports read Draft

- No

### Reports read Published

- Yes

### Approvals read Draft

- No

### Approvals read Published

- Yes

### Exact query and computation paths

1. Dashboard annual billing:
   - File: `app/page.js`
   - Query:
     ```js
     const yearAssignments = (await getAllWorkAssignmentsData()).filter(...)
     ```
   - Financial source:
     ```js
     const approvedBilling = yearAssignments
       .filter(assignment => isAssignmentApproved(assignment))
       .reduce(...)
     ```
2. Works annual summary:
   - File: `app/works/page.js`
   - API:
     ```js
     listWorkAssignments({}, 'Erro ao carregar afetacoes do resumo anual')
     ```
   - Financial source:
     - `lib/work-financial-summary.js`
     - `getFinancialSummaryHours() -> getApprovedAssignmentHours()`
3. Approval flow:
   - Endpoint family: `/api/work-assignments`
   - Query:
     ```js
     getAllWorkAssignmentsData(filters)
     ```
   - MySQL path:
     ```js
     prisma.workAssignment.findMany({ where, include, orderBy })
     ```
4. Draft tables are not queried by any reporting or approval path

## 11. Mobile

Modified mobile screens:

- None

Existing mobile screen using published data:

1. `app/mobile/chef/ChefMobileDailyHoursClient.js`
2. `frontend/controllers/chef-daily-hours-controller.js`
3. `lib/chef-daily-hours-shared.js`

Controller:

1. `fetchChefDailyHoursData()`

API:

1. `GET /api/work-assignments?includeDefaults=true&date=YYYY-MM-DD`

Component:

1. `ChefMobileDailyHoursClient`

How mobile guarantees only Published plans are visible:

1. Mobile never calls planning workspace endpoints
2. Mobile reads only official `work_assignments`
3. Draft changes remain outside `work_assignments` until publish
4. Hidden stale published rows are filtered out by:
   - `filterAssignmentsForSession()`
   - `isAssignmentOperationallyVisible()`

## 12. Planning UI

Modified React components:

1. `app/daily-plan/page.js`

Draft badge:

1. Controlled by `isDraftPlanning`
2. Rendered with `statusPillStyle`
3. Message:
   - if previously published: chiefs still see last published version
   - if never published: chiefs do not see the plan yet

Published badge:

1. Controlled by `isPublishedPlanning`
2. Rendered with `statusPillStyle`
3. Message:
   - chiefs already see this published version

Publish button:

1. Label: `Confirm / Publish`
2. Handler: `handlePublishPlanning()`
3. API:
   - `publishPlanningWorkspace(selectedPlanningWorkspace.id)`

Save Draft button:

- No explicit Save Draft button exists
- Draft mutations are persisted immediately through:
  - create draft assignment
  - update draft assignment
  - delete draft assignment
  - create/reset draft

Create New:

1. Button label: `Criar novo`
2. Handler: `handleCreateWorkPlan(false)`
3. API:
   - `initializePlanningWorkspaceDraft({ date, clonePreviousDay: false })`

Copy Previous:

1. Button label: `Copiar anterior`
2. Handler: `handleCreateWorkPlan(true)`
3. API:
   - `initializePlanningWorkspaceDraft({ date, clonePreviousDay: true })`

Edit button:

1. Label: `Edit`
2. Visible only when state is `Published`
3. Handler: `handleEditPublishedPlanning()`
4. API:
   - `setPlanningWorkspaceToDraft(selectedPlanningWorkspace.id)`

Assignment editing UI:

1. Add button only shown in Draft
2. Edit and delete icons only shown in Draft
3. Drag/drop reassignment only active in Draft

## 13. Tests

### New / updated tests

File:

1. `tests/critical-flows.test.mjs`

Coverage added:

1. `admin edita draft sem publicar e a versao oficial continua vazia`
2. `draft fica invisivel para chefes enquanto nao for publicado`
3. `publicar torna o planeamento visivel para chefes`
4. `Edit devolve o planeamento a draft sem esconder a ultima versao publicada`
5. `ultima versao publicada mantem-se visivel ate nova publicacao`
6. `workflow de submissao continua funcional com planeamento publicado`
7. `workflow de aprovacao continua funcional com planeamento publicado`

Coverage removed/replaced:

1. Temporary 08:00 bypass tests for planning creation and assignment mutation

### Manual validation steps

1. Open `/daily-plan`
2. Pick a date without a plan
3. Click `Criar novo`
4. Add one assignment
5. Confirm chiefs still see no plan for that date
6. Click `Confirm / Publish`
7. Confirm chief daily hours now shows the assignment
8. Return to admin and click `Edit`
9. Change draft assignments
10. Confirm chief still sees the previous published version
11. Publish again
12. Confirm chief sees the new version
13. Submit hours as chief
14. Approve hours as admin

Validation executed:

1. `npm run test:critical`
2. `npm run db:generate`
3. `npm run build`

## 14. Documentation

Updated documentation files:

- None

## 15. Known Limitations

Explicit TODO markers:

- None found in the implementation files

Explicit FIXME markers:

- None found in the implementation files

Known issues / technical debt introduced:

1. Publish path has no database transaction
2. No optimistic locking on draft workspace rows
3. Hidden official assignments are retained instead of deleted, so `work_assignments` can accumulate inactive planning rows over time
4. Legacy `/api/work-plans` and `/api/work-assignments` admin planning mutation routes still exist in the codebase even though `/daily-plan` no longer uses them
5. No dedicated publish audit/event table was introduced
6. No documentation update was added for the new architecture

## 16. Architecture Decisions

Chosen architecture:

1. Keep `work_plans` and `work_assignments` as the canonical published layer
2. Add a separate draft workspace layer:
   - `planning_workspaces`
   - `planning_workspace_assignments`
3. Publish by syncing draft into the canonical official layer
4. Preserve existing hours, approval, payroll and reporting workflows on the canonical layer

Why this architecture was chosen:

1. It isolates admin draft editing from chef-visible planning
2. It avoids breaking existing submitted hours and approvals
3. It keeps mobile and reporting reads on the already stable official assignment layer
4. It minimizes changes to downstream workflows

Alternative architectures considered:

1. Mutate `work_assignments` in place and add only a state flag
2. Create full versioned copies of `work_plans` and `work_assignments` per publication
3. Keep the 08:00 lock and add exceptions

Why they were rejected:

1. In-place mutation with only a state flag would force every consumer of `work_assignments` to become branch-aware and increases regression risk for hours, approvals and reporting
2. Full versioned copies of official plans would add heavier schema and read-path complexity to approvals, payroll and reporting
3. The 08:00 lock no longer matches the required business rule

## 17. Pull Request

PR description:

1. Replace the old administrator 08:00 planning lock with a Draft / Published planning workflow
2. Introduce dedicated draft workspace persistence
3. Keep chiefs, mobile, hours submission, approvals and reporting on the published canonical assignment layer
4. Add publish and edit state transitions in admin daily planning UI
5. Add workflow coverage tests

Commits:

- None created

Commit messages:

- None created

Current state:

1. Working tree change set only
2. No Git commit hash for this implementation
