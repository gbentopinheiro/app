# Bentix Standard Operating Procedures

This document is the official daily operational manual of the Bentix AI Organization. It defines how the organization executes work in practice, how requests move through the system, how specialists collaborate from intake to closure, how approvals and escalations happen, and how operational discipline is maintained across normal delivery, releases, incidents, and continuous improvement.

This document must be interpreted together with the existing Bentix governance set. It does not replace governance, architecture, role authority, or specialist handbooks. Instead, it explains how those documents are used in daily execution.

Primary companion documents:

- [BENTIX_PROJECT_GOVERNANCE.md](../BENTIX_PROJECT_GOVERNANCE.md)
- [AI_TEAM_MANIFEST.md](./AI_TEAM_MANIFEST.md)
- [AI_TEAM_INDEX.md](./AI_TEAM_INDEX.md)
- [AI_TEAM_OPERATING_SYSTEM.md](./AI_TEAM_OPERATING_SYSTEM.md)
- [01_Project_Manager_Chief_Architect.md](./01_Project_Manager_Chief_Architect.md)
- [11_Bentix_Engineering_Director.md](./11_Bentix_Engineering_Director.md)
- all specialist handbooks under `docs/ai-team/`

## Table of Contents

1. [Introduction](#1-introduction)
2. [Purpose of the SOP](#2-purpose-of-the-sop)
3. [How the AI Organization Works](#3-how-the-ai-organization-works)
4. [Daily Engineering Workflow](#4-daily-engineering-workflow)
5. [Request Intake Workflow](#5-request-intake-workflow)
6. [Task Classification](#6-task-classification)
7. [Priority Matrix](#7-priority-matrix)
8. [Engineering Director Workflow](#8-engineering-director-workflow)
9. [Architecture Review Workflow](#9-architecture-review-workflow)
10. [Feature Development Workflow](#10-feature-development-workflow)
11. [Bug Fix Workflow](#11-bug-fix-workflow)
12. [Hotfix Workflow](#12-hotfix-workflow)
13. [Emergency Response Workflow](#13-emergency-response-workflow)
14. [Infrastructure Change Workflow](#14-infrastructure-change-workflow)
15. [Database Change Workflow](#15-database-change-workflow)
16. [Mobile Feature Workflow](#16-mobile-feature-workflow)
17. [UX Improvement Workflow](#17-ux-improvement-workflow)
18. [Documentation Workflow](#18-documentation-workflow)
19. [AI Feature Workflow](#19-ai-feature-workflow)
20. [QA Workflow](#20-qa-workflow)
21. [Release Workflow](#21-release-workflow)
22. [Production Deployment Workflow](#22-production-deployment-workflow)
23. [Rollback Workflow](#23-rollback-workflow)
24. [Incident Response Workflow](#24-incident-response-workflow)
25. [Root Cause Analysis Workflow](#25-root-cause-analysis-workflow)
26. [Postmortem Workflow](#26-postmortem-workflow)
27. [Security Incident Workflow](#27-security-incident-workflow)
28. [Exception Governance Workflow](#28-exception-governance-workflow)
29. [Technical Debt Workflow](#29-technical-debt-workflow)
30. [Refactoring Workflow](#30-refactoring-workflow)
31. [Code Review Workflow](#31-code-review-workflow)
32. [Architecture Review Checklist](#32-architecture-review-checklist)
33. [Release Checklist](#33-release-checklist)
34. [Deployment Checklist](#34-deployment-checklist)
35. [Database Migration Checklist](#35-database-migration-checklist)
36. [Infrastructure Checklist](#36-infrastructure-checklist)
37. [QA Checklist](#37-qa-checklist)
38. [Documentation Checklist](#38-documentation-checklist)
39. [Definition of Ready](#39-definition-of-ready)
40. [Definition of Done](#40-definition-of-done)
41. [Engineering Quality Gates](#41-engineering-quality-gates)
42. [Security Gates](#42-security-gates)
43. [Release Gates](#43-release-gates)
44. [Approval Matrix](#44-approval-matrix)
45. [Decision Matrix](#45-decision-matrix)
46. [Escalation Matrix](#46-escalation-matrix)
47. [Communication Standards](#47-communication-standards)
48. [Meeting Standards](#48-meeting-standards)
49. [Incident Severity Matrix](#49-incident-severity-matrix)
50. [Continuous Improvement](#50-continuous-improvement)
51. [Weekly Engineering Review](#51-weekly-engineering-review)
52. [Monthly Architecture Review](#52-monthly-architecture-review)
53. [Quarterly Governance Review](#53-quarterly-governance-review)
54. [Documentation Maintenance](#54-documentation-maintenance)
55. [Knowledge Management](#55-knowledge-management)
56. [Engineering Metrics](#56-engineering-metrics)
57. [KPI Review](#57-kpi-review)
58. [Future Evolution](#58-future-evolution)
59. [Appendices](#59-appendices)

## 1. Introduction

Bentix operates through a documented AI specialist organization rather than through ad hoc execution. The organization already has formal governance, role handbooks, escalation rules, and operating doctrine. What is still required in daily practice is a single practical manual that explains how those pieces become an operating system used every day by the Bentix Engineering Director, the Chief Architect, and the specialist roles.

This Standard Operating Procedures document is that manual. It explains the difference between authority and execution, between governance and workflow, and between specialist ownership and coordinated delivery. It is intended to reduce ambiguity in everyday work, especially when requests touch multiple domains such as architecture, application code, database behavior, mobile/PWA behavior, infrastructure, security, testing, documentation, or AI workflow design.

For project-level doctrine, see [BENTIX_PROJECT_GOVERNANCE.md](../BENTIX_PROJECT_GOVERNANCE.md). For shared behavioral rules, see [AI_TEAM_MANIFEST.md](./AI_TEAM_MANIFEST.md). For team structure and reporting, see [AI_TEAM_INDEX.md](./AI_TEAM_INDEX.md).

## 2. Purpose of the SOP

The purpose of this SOP is to make Bentix execution repeatable, reviewable, and governable. The organization should not rely on personal memory, hidden assumptions, or improvised coordination. It should rely on a known operating model that allows different contributors to produce consistent outcomes even when requests vary in urgency, technical complexity, or business sensitivity.

This SOP therefore serves five purposes:

- it defines the standard path from request intake to completion
- it clarifies who participates at each step and why
- it establishes consistent approval, escalation, release, and incident practices
- it connects daily work to the existing Bentix governance documents
- it creates a durable reference for onboarding, auditing, and continuous improvement

The document is intentionally operational. It assumes that governance already exists elsewhere and therefore avoids rewriting role philosophy or project doctrine except where operational clarity requires a short summary. When there is any conflict, the formal governance documents remain authoritative and this SOP must be updated to match them.

## 3. How the AI Organization Works

The Bentix AI Organization works through a deliberate separation of operational coordination, technical authority, specialist ownership, and quality validation.

Operationally, all meaningful work enters through the Bentix Engineering Director. The Engineering Director is the single operational entry point for intake, classification, routing, sequencing, follow-up, closure discipline, and cross-specialist coordination. This prevents fragmented execution and ensures that no important request moves through the organization without visible ownership.

Technically, the Project Manager & Chief Architect is the final authority for architecture, engineering governance, technical approval, release approval, and overall security posture. The Chief Architect is not the daily orchestrator. The Chief Architect is the final approver and governance authority when work affects structural direction, risk acceptance, exception approval, security posture, or final release readiness.

Specialists then execute within their domains:

- Infrastructure & DevOps Specialist for runtime environment and operational platform concerns
- Lead Software Engineer for application implementation and engineering structure
- Database Architect for persistence truth, schema semantics, query integrity, and data safety
- Mobile PWA Specialist for mobile routes, PWA behavior, service worker lifecycle, installability, and mobile runtime reliability
- UX UI Specialist for interface clarity, responsive behavior, usability, and interaction quality
- QA Testing Specialist for validation discipline, regression confidence, and release evidence
- Documentation Specialist for durable written truth
- AI Development Specialist for AI system design, prompt discipline, and reusable AI workflows
- Product Business Specialist for business meaning, scope clarification, and acceptance framing

The practical model is therefore:

```text
Request
  |
  v
Engineering Director
  |
  +--> Product clarification if needed
  +--> Chief Architect if architecture or governance is affected
  +--> Specialist execution
  +--> QA validation
  +--> Documentation update
  +--> Final coordination review
```

This model is defined structurally in [AI_TEAM_INDEX.md](./AI_TEAM_INDEX.md) and procedurally in [AI_TEAM_OPERATING_SYSTEM.md](./AI_TEAM_OPERATING_SYSTEM.md). This SOP expands the daily mechanics of that system.

## 4. Daily Engineering Workflow

The standard Bentix working day follows a controlled flow rather than open-ended task switching.

First, the Engineering Director reviews incoming requests, open blockers, active incidents, pending approvals, release candidates, and documentation obligations. This produces the daily operating picture: what is urgent, what is blocked, what is waiting for specialist action, and what must be escalated.

Second, active work is reviewed for scope clarity. If a task is still ambiguous in business meaning, the Product Business Specialist is engaged before implementation continues. If the task has architectural consequences, the Chief Architect is brought in before deeper execution occurs.

Third, specialists execute within clear boundaries. The primary specialist owns the next meaningful step. Supporting specialists are consulted only where needed. The objective is not to maximize parallel activity. The objective is to move the work safely through the minimum necessary set of roles.

Fourth, QA and documentation are treated as delivery stages, not optional end notes. Any work that changes behavior, release risk, operational procedure, or project truth must be validated and documented before it is considered complete.

Finally, the Engineering Director closes the loop by confirming outcome coherence, approval status, residual risk visibility, and next action. This preserves momentum without sacrificing traceability or quality.

## 5. Request Intake Workflow

Every meaningful request begins with intake. Intake is not a clerical step. It is the first control point where Bentix determines what is actually being asked, what the hidden objective is, which domains are affected, and whether the request can move directly to execution or requires clarification, decomposition, escalation, or deferral.

The standard intake flow is:

```text
Receive request
  |
  v
Identify requested outcome
  |
  v
Identify actual problem to solve
  |
  v
Classify domain impact, urgency, and risk
  |
  +--> Clarify with Product Business Specialist if needed
  +--> Escalate to Chief Architect if structural or governance impact exists
  |
  v
Assign primary owner and delivery path
```

At intake, the Engineering Director records at minimum:

- the requested outcome
- the underlying operational or product problem
- the likely affected environment or environments
- the likely affected domains
- the tentative priority
- the required approvals or reviews
- whether the request is a feature, defect, hotfix, incident, documentation change, infrastructure change, or governance-sensitive task

No request should enter active implementation while still unclear about objective, affected surface, or primary ownership. This is aligned with the Bentix Definition of Ready in [AI_TEAM_OPERATING_SYSTEM.md](./AI_TEAM_OPERATING_SYSTEM.md).

## 6. Task Classification

Task classification determines the routing and control posture of the work. The same implementation effort may require different treatment depending on whether it is a small single-domain adjustment, a release-critical fix, or a multi-domain change that affects runtime behavior across environments.

The standard Bentix task classes are:

| Class | Description | Typical Route |
| --- | --- | --- |
| Single-domain task | one specialist owns both the core problem and the core solution | direct assignment with normal review |
| Cross-domain task | more than one specialist must contribute materially to a safe outcome | Engineering Director coordinates sequence |
| Architecture-affecting task | changes boundaries, long-term structure, platform model, or governance posture | Chief Architect review before commitment |
| Release-critical task | can affect deployment confidence, business continuity, or user trust materially | QA and release controls required |
| Incident-driven task | created by active failure, instability, or urgent operational risk | incident workflow |
| Exception-controlled task | proceeds under a documented temporary exception | exception governance workflow |
| Documentation-controlled task | changes project truth, not only implementation | Documentation Specialist involved |

Classification may change during execution. If new facts appear, the Engineering Director must reclassify the task rather than forcing it through an outdated workflow. Reclassification is expected, not treated as failure, provided it is visible and documented.

## 7. Priority Matrix

Priority determines response posture, not only importance. Bentix uses five operational priority levels:

| Priority | Meaning | Typical Example | Initial Response Expectation | Approval/Visibility Expectation |
| --- | --- | --- | --- | --- |
| P0 | live emergency or severe business interruption | production outage, security breach, unusable critical flow | immediate | Engineering Director, Chief Architect, relevant specialists immediately |
| P1 | urgent high-value or release-blocking issue | failed login on shared DEV, broken deployment, critical regression | same working day | Engineering Director plus relevant owner and QA |
| P2 | important planned delivery | scoped feature, controlled refactor, non-urgent defect | scheduled in active delivery cycle | standard routing and review |
| P3 | useful improvement | UX refinement, moderate cleanup, secondary documentation enhancement | backlog or planned slot | handled through normal prioritization |
| P4 | low urgency or exploratory | optional optimization, idea shaping, future process note | backlog only | recorded, not accelerated |

Priority rules:

- `P0` overrides normal sequencing and starts an incident or emergency workflow.
- `P1` means the task can materially block release, validation, or shared operational use.
- `P2` is the default for important planned work that matters but does not require exceptional handling.
- `P3` is appropriate for work that should happen but should not silently displace higher risk items.
- `P4` is explicitly non-urgent and should not consume scarce specialist focus without deliberate approval.

Priority is assigned initially by the Engineering Director. It may be challenged by QA for validation risk, by Product Business for business impact, by Infrastructure for operational risk, or by the Chief Architect for governance or release implications. The final decision on disputed operational priority belongs to the Engineering Director unless the dispute changes project-level risk acceptance or architecture, in which case the Chief Architect decides.

## 8. Engineering Director Workflow

The Bentix Engineering Director operates as the daily control layer of the organization. The role is not to out-specialize the specialists. The role is to ensure that the correct specialists act in the correct sequence, under the correct review and approval conditions, with the correct visibility over blockers and residual risk.

The standard Engineering Director workflow for each task is:

1. receive and interpret the request
2. classify scope, risk, and urgency
3. identify the primary specialist and supporting roles
4. define the expected deliverable and review path
5. monitor progress through explicit check-ins
6. escalate when authority boundaries are reached
7. ensure QA and documentation occur when required
8. confirm that approvals, evidence, and residual risk are visible before closure

The Engineering Director owns the operating cadence, status visibility, specialist sequencing, completion discipline, and handoff integrity. This workflow should be consistent with [11_Bentix_Engineering_Director.md](./11_Bentix_Engineering_Director.md). The Director should never allow a task to drift because ownership is unclear, because review obligations are vague, or because release implications are being assumed rather than confirmed.

## 9. Architecture Review Workflow

Architecture review is required whenever a request changes system boundaries, runtime model, data ownership, environment assumptions, permission structure, long-term maintainability posture, or platform direction. Not every code change is an architecture change. Bentix must therefore review architecture deliberately rather than mechanically.

The architecture review workflow is:

```text
Task identified as architecture-affecting
  |
  v
Engineering Director prepares context
  |
  v
Relevant specialists provide domain input
  |
  v
Chief Architect reviews tradeoffs, risks, and path
  |
  v
Decision recorded and returned to execution
```

Inputs should include:

- the current behavior or structure
- the problem with the current state
- the proposed change
- alternatives considered
- affected domains and environments
- expected benefits
- known risks and rollback posture

The output is not only permission to proceed. The output is a chosen direction, bounded scope, and decision rationale that allows the Engineering Director and specialists to execute without re-litigating foundational choices. See [01_Project_Manager_Chief_Architect.md](./01_Project_Manager_Chief_Architect.md) for architecture authority and decision principles.

## 10. Feature Development Workflow

Feature development begins only after the request is sufficiently clear in user value, workflow intent, scope boundary, affected roles, and acceptance expectations. If any of those are weak, the Product Business Specialist and the relevant technical specialists must clarify them before implementation.

Standard feature workflow:

```text
Intake
  |
  v
Scope clarification
  |
  +--> Product Business Specialist if business meaning is weak
  +--> Chief Architect if structural impact exists
  |
  v
Implementation planning
  |
  v
Specialist execution
  |
  v
QA validation
  |
  v
Documentation update
  |
  v
Final coordination review
```

Feature development usually centers on the Lead Software Engineer, with Database Architect, UX UI Specialist, Mobile PWA Specialist, Infrastructure & DevOps Specialist, or AI Development Specialist added as required. A feature is not complete merely because the code exists. It is complete only when its workflow meaning, validation evidence, documentation impact, and release implications are all controlled.

## 11. Bug Fix Workflow

Bug work starts with disciplined reproduction. Bentix does not treat vague symptom descriptions as a sufficient basis for implementation. The reporting party, QA, or the relevant specialist must first define the observable failure, the expected behavior, the environment, the user role, the relevant data state, and any reproducible steps.

The standard bug workflow is:

1. define the bug clearly
2. classify severity and priority
3. assign the primary fixing specialist
4. implement the smallest correct fix
5. validate in the same conditions where the bug existed
6. update documentation if the defect exposed missing written truth
7. close with explicit residual risk if any remains

Bug fixes should prefer minimal safe change over opportunistic redesign unless the current architecture or repeated recurrence makes a larger change necessary. Where repeated defect patterns suggest structural weakness, the issue must be escalated into architecture or technical debt workflows rather than handled forever as isolated bugs.

## 12. Hotfix Workflow

A hotfix is a controlled urgent change made to restore safe behavior or remove immediate release or production risk without widening scope unnecessarily. Bentix hotfixes are fast, but they are not undisciplined.

Hotfix rules:

- the problem must be clearly stated
- the proposed change must be intentionally narrow
- approvals must be expedited, not skipped
- QA scope must focus on the critical risk path and adjacent regressions
- documentation must record the change and any follow-up obligations

The hotfix workflow is:

```text
Urgent defect identified
  |
  v
Engineering Director classifies as hotfix
  |
  v
Relevant specialist prepares narrow fix
  |
  v
QA validates critical path
  |
  v
Chief Architect or delegated release authority approves if required
  |
  v
Deploy and monitor
```

If the hotfix introduces a known compromise or temporary bypass, it must enter the Exception Governance Workflow immediately with owner, expiry, review cadence, and retirement conditions.

## 13. Emergency Response Workflow

Emergency response is used when Bentix faces immediate operational instability, severe workflow disruption, or material security risk. Its first objective is stabilization, not elegance. Its second objective is fact clarity. Its third objective is a safe return to controlled delivery.

Emergency response posture:

- appoint one incident coordinator through the Engineering Director
- separate facts from assumptions quickly
- stabilize service or user safety first
- narrow the blast radius before broad changes
- involve the Chief Architect early for `SEV-1` or `SEV-2`
- keep an event log of actions, findings, and decisions

The emergency workflow may temporarily suspend lower-priority planned work. Once the emergency is stabilized, remaining remediation should move into bug, hotfix, infrastructure, security incident, or RCA workflows as appropriate. Bentix should not let emergency mode become a permanent excuse for bypassing normal quality, documentation, or governance obligations.

## 14. Infrastructure Change Workflow

Infrastructure changes include modifications to Docker images, deployment mechanics, reverse proxy behavior, SSL/TLS, DNS exposure, caching posture, VPS operations, runtime environment variables, backup or restore procedures, and platform operational topology.

The standard infrastructure workflow is:

1. define the operational change and affected environment
2. identify runtime, security, and rollback implications
3. have the Infrastructure & DevOps Specialist prepare the change
4. involve the Chief Architect if the change affects architecture, security posture, or release approval
5. validate in the appropriate environment
6. update deployment and operational documentation
7. coordinate release or deployment through the Engineering Director

Infrastructure changes should not be merged as opaque operational magic. They must be explainable, reversible where possible, and documented in a way that preserves future recoverability. See [DEPLOYMENT.md](../DEPLOYMENT.md) and the Infrastructure & DevOps handbook for formal scope.

## 15. Database Change Workflow

Database changes include schema evolution, indexing, query semantics, data import or export behavior, database setup scripts, repair procedures, summary correctness, and any change that can alter the meaning, integrity, or performance posture of persisted data.

The standard database workflow is:

```text
Need identified
  |
  v
Database impact review
  |
  v
Database Architect designs safe change
  |
  +--> Chief Architect if semantic or architectural implications exist
  |
  v
Implementation and validation
  |
  v
Documentation and release coordination
```

Any database change must consider:

- data meaning, not only storage structure
- backward compatibility where existing data exists
- setup, import, validation, and rollback posture
- environment-specific risk
- user-visible reporting or summary impact

Bentix currently does not use Prisma migrations as its primary operating model. Operational procedures must therefore be explicit about the actual approved workflow in the current repository and must not imply a migration path that the project does not use. See [DATABASE.md](../DATABASE.md) and the Database Architect handbook.

## 16. Mobile Feature Workflow

Mobile features are part of the same Bentix application and must be treated as first-class operational surfaces rather than second-class adaptations. The Mobile PWA Specialist owns mobile route behavior, installability, update safety, PWA cache lifecycle, and device ergonomics.

The mobile feature workflow is:

1. clarify whether the request is mobile-only, shared, or mobile-sensitive
2. define route behavior, auth behavior, and runtime expectations
3. coordinate with Lead Software Engineer for shared application logic
4. involve UX UI Specialist for phone usability if interaction changes are material
5. validate installed PWA behavior, login/logout, updates, and cache freshness where relevant
6. document any user-facing install or operating changes

Mobile work is complete only when it behaves correctly in browser and installed PWA conditions where relevant, and when stale cache or old service worker behavior has been considered explicitly.

## 17. UX Improvement Workflow

UX improvements begin with workflow clarity, not with visual preference alone. The UX UI Specialist should first define what user friction exists, where it appears, which roles are affected, and what successful behavior looks like afterward.

The standard UX workflow is:

- identify user problem or friction
- confirm product intent with Product Business Specialist if needed
- define affected screens, states, and responsive contexts
- coordinate implementation with Lead Software Engineer and Mobile PWA Specialist where applicable
- validate usability, layout behavior, and regression risk
- ensure screenshots, copy, or guidance are updated when they are part of user truth

Bentix UX changes should preserve business logic while improving clarity, accessibility, responsiveness, and task completion. UX work that silently changes workflow meaning must be reclassified as product or feature work and reviewed accordingly.

## 18. Documentation Workflow

Documentation work is an execution stream, not an afterthought. The Documentation Specialist owns written truth, but every domain specialist owns the truth of their domain and must support documentation updates when reality changes.

The standard documentation workflow is:

1. identify documentation impact during intake or planning
2. identify the authoritative document that must change
3. gather technical truth from the relevant owner
4. update the authoritative source rather than duplicate notes elsewhere
5. validate references, terminology, and links
6. include documentation completion in closure criteria

No operationally relevant change should be considered complete while relying on outdated project truth. This is especially important for architecture, deployment, environment configuration, workflows, AI governance, and setup procedures.

## 19. AI Feature Workflow

AI feature work includes prompt systems, role frameworks, reusable AI workflows, specialist operating logic, AI-related safeguards, and any feature where AI behavior directly affects quality, safety, or user trust.

The AI Development Specialist leads this workflow with support from the Chief Architect for governance-sensitive changes and from Documentation Specialist for durable operating truth.

Standard AI workflow:

- define the user or operational problem the AI capability should solve
- define allowed and prohibited behavior
- define input and data-handling boundaries
- design reusable prompt or workflow structures
- identify evaluation criteria
- validate quality, safety, and maintainability
- document usage, limits, and escalation behavior

All AI work must comply with the AI Data Handling Policy in [AI_TEAM_MANIFEST.md](./AI_TEAM_MANIFEST.md). The organization must be especially careful with screenshots, customer data, production secrets, prompt hygiene, and conversation retention posture.

## 20. QA Workflow

QA is an operating authority, not a ceremonial last step. The QA Testing Specialist participates wherever Bentix needs evidence, regression protection, or release confidence.

The standard QA workflow is:

1. understand the claimed change and its risk
2. define the relevant validation conditions
3. identify critical path and adjacent regression scope
4. execute or coordinate the validation
5. record whether the outcome is proven, partially proven, or unproven
6. escalate blockers, weak evidence, or missing coverage
7. provide sign-off, conditional acceptance, or release block as warranted

QA may block release when critical workflows remain unproven, release-critical regressions remain unresolved, target-environment validation is incomplete, or evidence is insufficient for the claimed outcome. That authority is already defined in the governance set; this SOP defines how it is applied operationally. QA should communicate blockers in concrete, decision-enabling language rather than general concern.

## 21. Release Workflow

Release is the coordinated act of declaring a change safe enough to move forward in the intended environment. Bentix release work should therefore gather code completion, validation evidence, documentation status, infrastructure implications, open risks, and approval posture into one explicit review point.

The release workflow is:

```text
Implementation complete
  |
  v
QA evidence assembled
  |
  v
Documentation status confirmed
  |
  v
Infrastructure/runtime review if needed
  |
  v
Engineering Director prepares release picture
  |
  v
Chief Architect approves release when required
```

Release cannot rely on implied confidence. At minimum, Bentix must know:

- what changed
- which workflows were validated
- what remains risky or unproven
- what documentation changed
- what the rollback posture is
- whether security, mobile, infrastructure, or data concerns remain open

For release gating rules, see [AI_TEAM_OPERATING_SYSTEM.md](./AI_TEAM_OPERATING_SYSTEM.md) and the Chief Architect handbook.

## 22. Production Deployment Workflow

Production deployment is the controlled execution of an approved release into the `PROD` environment. It is coordinated operationally by the Engineering Director, executed through the Infrastructure & DevOps Specialist, validated by QA where appropriate, and approved under the Bentix release authority model.

Production deployment steps are:

1. confirm final approved release scope
2. confirm environment configuration and operational readiness
3. confirm rollback posture and responsible owner
4. execute deployment with visible status communication
5. validate smoke checks and critical workflows
6. monitor for early regressions or runtime anomalies
7. close deployment only after post-deploy confidence exists

Deployment is not finished at container start. It is finished when the deployed system is confirmed to behave acceptably in the intended environment and known risks are visible and accepted.

## 23. Rollback Workflow

Rollback is a controlled reversion to the last known safe operational state when a deployment or urgent change proves unsafe. Rollback planning must exist before risky deployment, not only after failure.

The rollback workflow is:

- identify rollback trigger
- confirm whether rollback is safer than forward-fix
- assign operational owner, usually Infrastructure & DevOps
- communicate rollback decision through Engineering Director
- execute rollback
- validate service restoration
- record whether additional remediation or postmortem is required

Rollback triggers may include broken authentication, deployment instability, severe regression in critical workflows, data-risking behavior, or security-sensitive failure. If rollback is not technically possible, Bentix must use a forward-fix emergency path with equivalent discipline and explicit executive visibility.

## 24. Incident Response Workflow

Incident response is the structured operational handling of active failures or severe degradation. It is broader than bug fixing because it must coordinate communication, ownership, mitigation, investigation, and follow-up under time pressure.

The incident workflow begins when a problem is classified as operationally significant enough to require explicit coordination beyond normal task handling. The Engineering Director assigns incident coordination, the relevant specialist leads technical mitigation, and the Chief Architect is involved according to severity and architectural risk.

Incident response steps:

1. declare incident and severity
2. assign coordinator and primary technical owner
3. stabilize the user or system impact
4. maintain a fact log
5. communicate status and next checkpoints
6. decide between mitigation, rollback, hotfix, or containment
7. close the live incident only when stable
8. open RCA and postmortem if required

Incident handling must be compatible with the severity rules and escalation model already defined in [AI_TEAM_OPERATING_SYSTEM.md](./AI_TEAM_OPERATING_SYSTEM.md).

## 25. Root Cause Analysis Workflow

Root Cause Analysis is required when Bentix needs to move beyond symptom resolution and understand why a failure was possible. RCA is mandatory for `SEV-1` and `SEV-2` incidents and recommended for repeated defects, high-cost regressions, or governance-relevant failures.

An RCA should answer:

- what happened
- when and where it happened
- how it was detected
- what the real root cause was
- which controls failed or were absent
- what immediate mitigation worked
- what follow-up actions prevent recurrence

RCA must avoid blame narratives. The objective is system learning. A good RCA distinguishes triggering event, contributing conditions, latent weaknesses, and missed controls. The Engineering Director ensures the RCA is completed; the relevant specialist owns technical analysis; the Chief Architect reviews system-level implications.

## 26. Postmortem Workflow

The postmortem workflow converts incident learning into organizational improvement. A postmortem is broader than RCA because it includes process, communication, coordination, detection, escalation, and documentation analysis in addition to technical cause.

Every formal postmortem should capture:

- incident summary
- timeline
- severity and user/business impact
- root cause summary
- what went well
- what failed
- lessons learned
- follow-up actions with owners and due dates

Postmortems are not optional narrative exercises. They are control instruments. Follow-up actions from postmortems must enter the normal workload with explicit priority and ownership rather than disappearing into good intentions.

## 27. Security Incident Workflow

Security incidents are handled with heightened containment, data-sensitivity discipline, and approval controls. The Project Manager & Chief Architect is the primary owner of Bentix security posture and must be involved in significant security incidents immediately. Supporting roles depend on the nature of the issue: Infrastructure & DevOps for platform exposure, Lead Software Engineer for application-layer behavior, QA for verification, Documentation for safe written guidance, and AI Development Specialist where AI handling is implicated.

Security incident workflow:

1. classify the event as suspected or confirmed security issue
2. contain exposure or active misuse immediately
3. preserve relevant evidence where feasible
4. limit discussion to need-to-know operational participants
5. assess secrets, customer data, authentication, authorization, or public exposure impact
6. determine mitigation, rotation, rollback, or disabling action
7. communicate safe status updates
8. complete RCA and postmortem with security follow-up actions

All handling must comply with the AI Data Handling Policy and Bentix security principles.

## 28. Exception Governance Workflow

Exceptions are temporary departures from standard rules, protections, or workflows. Bentix allows exceptions only when they are explicit, owned, approved, time-bounded, reviewable, and retired.

Every exception must include:

- exception description
- reason it is needed
- exact scope
- named owner
- technical approval by the Chief Architect
- operational tracking by the Engineering Director
- expiry date
- review cadence
- retirement condition

The workflow is:

```text
Need for exception identified
  |
  v
Owner defines scope and rationale
  |
  v
Chief Architect approves or rejects
  |
  v
Engineering Director tracks active exception
  |
  v
Weekly review until retirement
```

An exception without expiry or owner is not a valid exception. It is uncontrolled debt.

## 29. Technical Debt Workflow

Technical debt work addresses known structural weakness, repeated workaround burden, maintainability erosion, or deferred quality obligations. Technical debt should not be invisible. It should be identified, classified, prioritized, and linked to operational consequences.

Technical debt workflow:

- identify the debt item and why it matters
- define current cost, risk, or drag
- classify whether it is local, cross-domain, or architectural
- route to the appropriate specialist or to the Chief Architect if systemic
- decide whether to fix now, schedule later, or explicitly accept risk
- document linked exceptions, incidents, or recurring defects where relevant

The organization should avoid false debt labeling where ordinary feature work is merely being reframed. Technical debt is real when the current state materially reduces delivery safety, quality, or change velocity.

## 30. Refactoring Workflow

Refactoring is allowed and encouraged when it improves maintainability, clarity, safety, or consistency without changing intended business behavior. It must, however, remain bounded and explainable.

Standard refactoring workflow:

1. define the current code or structure problem
2. define the intended improvement
3. confirm whether behavior must remain identical
4. identify regression-sensitive areas
5. execute controlled change
6. validate behavior preservation
7. document any architectural significance

If a refactor changes behavior, role rules, data meaning, or release risk materially, it is no longer pure refactoring and must follow the appropriate feature, architecture, or database workflow.

## 31. Code Review Workflow

Code review in Bentix is a quality and risk control, not a ceremony. Reviews should verify correctness, layer placement, safety, clarity, configuration discipline, and unintended side effects. They should also confirm that the change belongs where it was implemented and that domain-sensitive surfaces were reviewed by the correct specialist.

The standard review sequence is:

- author or primary specialist prepares change with scope clarity
- domain-appropriate reviewer checks correctness and maintainability
- QA reviews evidence and validation posture where relevant
- Documentation Specialist reviews project-truth impact where relevant
- Engineering Director confirms coherence for cross-domain work
- Chief Architect reviews where architectural, governance, security, or release authority is implicated

Reviews should not devolve into style-only commentary while missing operational risk. Bentix reviews are expected to ask whether the change is safe, scoped, testable, reversible where needed, and consistent with the documented architecture and governance model.

## 32. Architecture Review Checklist

Use this checklist whenever a change may affect architecture:

- Is the problem architectural or merely local?
- Does the change alter boundaries between layers or domains?
- Does it alter environment assumptions?
- Does it change authentication, authorization, or security posture?
- Does it change data ownership or persistence truth?
- Does it introduce new operational burden?
- Does it create or remove coupling?
- Does it require exception handling or risk acceptance?
- Is rollback or forward migration understood?
- Has the Chief Architect reviewed the decision where required?

This checklist supports, but does not replace, the authority model in [01_Project_Manager_Chief_Architect.md](./01_Project_Manager_Chief_Architect.md).

## 33. Release Checklist

Use this checklist before any release candidate is considered ready:

- Is the release scope clearly defined?
- Are all included tasks explicitly listed?
- Has QA validated release-critical workflows?
- Are open issues separated from accepted risks?
- Has documentation been updated where needed?
- Have infrastructure or environment implications been reviewed?
- Have mobile/PWA implications been reviewed where relevant?
- Have data or summary implications been reviewed where relevant?
- Is rollback posture known?
- Has the required release approval been obtained?

If any answer is unclear, the release is not yet operationally ready.

## 34. Deployment Checklist

Use this checklist for controlled deployment:

- Confirm target environment: `DEV` or `PROD`
- Confirm approved release scope
- Confirm correct configuration and environment variables
- Confirm image or artifact source
- Confirm database setup or prerequisite steps
- Confirm cache, manifest, and asset freshness posture where relevant
- Confirm smoke-test owner and validation sequence
- Confirm rollback owner and method
- Confirm communication channel for deployment status
- Confirm post-deploy monitoring period

Deployment should never begin with hidden uncertainty around target, version, or rollback posture.

## 35. Database Migration Checklist

Bentix may use database setup or schema synchronization workflows that differ from conventional migration-heavy models. Use this checklist regardless of the specific mechanism:

- Has the Database Architect reviewed the change?
- Is the exact database operation understood?
- Does existing data remain safe?
- Are setup, import, validation, or repair steps documented?
- Is the order of operations explicit?
- Is rollback or recovery posture defined?
- Have dependent summaries, reports, and exports been reviewed?
- Has the correct environment been identified?
- Has QA been told which data-sensitive behavior to validate?
- Has documentation been updated?

Never assume that a schema change is safe because it looks small.

## 36. Infrastructure Checklist

Use this checklist for infrastructure-sensitive changes:

- Is the runtime impact understood?
- Are security implications understood?
- Are DNS, SSL, proxy, or cache behaviors affected?
- Are Docker build and runtime paths correct?
- Are public assets and static paths included correctly?
- Is environment configuration documented?
- Is monitoring or validation planned after deployment?
- Is rollback possible and defined?

The Infrastructure & DevOps Specialist owns the checklist execution with supporting review where needed.

## 37. QA Checklist

Use this checklist when validating a task:

- What exact claim is being validated?
- Which user roles or permissions matter?
- Which environments matter?
- Which data states matter?
- Which critical path is most important?
- Which adjacent regressions are plausible?
- Is the outcome proven, partially proven, or unproven?
- What evidence exists?
- What remains risky?
- Should release proceed, proceed conditionally, or be blocked?

QA should record the answer in language that leadership and implementers can both act on.

## 38. Documentation Checklist

Use this checklist for documentation-controlled changes:

- Which authoritative document must change?
- Does the document still describe current truth?
- Are related references or links still correct?
- Is terminology consistent with the official organization vocabulary?
- Did any workflow, approval, or environment rule change?
- Does the document create duplicate truth elsewhere?
- Is the change understandable to a future contributor?
- Has obsolete guidance been removed or superseded clearly?

The goal is durable truth, not document volume.

## 39. Definition of Ready

A task is ready to start when Bentix can execute it without avoidable ambiguity. Readiness does not mean every future detail is known. It means enough is known to assign the right owner, begin safely, and understand what must be proven before closure.

A task is ready when:

- the requested outcome is understood
- the underlying problem is understood
- the primary specialist is known
- required supporting specialists are known or likely
- business meaning is clear enough for implementation
- architectural impact is known or explicitly uncertain and escalated
- success conditions are visible
- likely environments are identified
- key risks or missing information are visible

If readiness is weak, the Engineering Director should pause execution and use product clarification, architecture review, or specialist triage rather than allowing uncontrolled implementation.

## 40. Definition of Done

Bentix uses a strict definition of done because "implemented" is not the same as "complete". A task is done only when the organization can responsibly say that the requested outcome has been delivered to the expected quality bar with the required evidence and documentation.

A task is done when:

- the scoped change is implemented
- the relevant specialist has reviewed domain-sensitive correctness
- QA has validated the required scope
- documentation is updated where needed
- approvals have been obtained where required
- release or deployment implications are known
- residual risk is explicit and accepted or resolved
- no mandatory follow-up is being hidden inside closure language

If follow-up is required, it must be tracked explicitly rather than silently absorbed into the definition of done.

## 41. Engineering Quality Gates

Engineering quality gates are the minimum conditions a task must satisfy before the organization treats the output as professionally acceptable.

Core gates:

- the problem and solution are both understandable
- the change lives in the correct layer or domain
- configuration is preferred over hardcoding where appropriate
- maintainability has not been traded away carelessly
- known edge cases were considered proportionally
- validation exists for the risk carried by the change
- documentation reflects any changed operational truth

These gates should be applied proportionally. Bentix should not over-process trivial change, but it also must not use small size as an excuse to skip basic quality discipline. For shared standards, see [AI_TEAM_MANIFEST.md](./AI_TEAM_MANIFEST.md) and [AI_TEAM_OPERATING_SYSTEM.md](./AI_TEAM_OPERATING_SYSTEM.md).

## 42. Security Gates

Security gates apply whenever work can affect confidentiality, integrity, authorization, session safety, public exposure, deployment safety, secret handling, or data protection.

Required security checks include:

- Are secrets protected and absent from prompts or documentation?
- Are customer data and screenshots handled under policy?
- Are authentication and session behaviors safe?
- Are redirects, headers, cookies, permissions, and public endpoints assessed where relevant?
- Does the change widen exposure across environments?
- Has the Chief Architect been involved where security posture changes?
- Has QA validated the security-sensitive behavior that changed?

The Chief Architect is the primary security owner. Infrastructure & DevOps, Lead Software Engineer, QA Testing Specialist, Documentation Specialist, and AI Development Specialist support within their domain responsibilities.

## 43. Release Gates

Release gates define when a change is eligible to move beyond implementation into a release posture. They are stricter than ordinary completion gates because they concern environment-level trust.

Release gates require:

- clear release scope
- QA evidence for release-critical flows
- explicit visibility over unresolved defects or risks
- documentation current enough for safe operation
- infrastructure readiness where applicable
- rollback posture known
- Chief Architect approval where release authority is required
- Engineering Director confirmation that the release picture is coherent

QA sign-off is a formal gate, not a courtesy. If QA blocks release based on defined criteria, the release may proceed only if the blocking condition is removed or a higher-level risk acceptance decision is explicitly made through the proper authority model.

## 44. Approval Matrix

The following matrix defines who approves key operational categories:

| Category | Primary Approver | Required Supporting Roles | Notes |
| --- | --- | --- | --- |
| Architecture | Project Manager & Chief Architect | Engineering Director, affected specialists | final authority |
| Database semantics or schema strategy | Database Architect, with Chief Architect when structural or cross-domain impact exists | Lead Software Engineer, QA as relevant | data meaning matters, not only schema |
| Infrastructure change | Infrastructure & DevOps Specialist, with Chief Architect when security, release, or architecture posture changes | Engineering Director, QA as relevant | operational owner approves execution details |
| Mobile/PWA behavior | Mobile PWA Specialist | Lead Software Engineer, UX UI Specialist, QA as relevant | applies to mobile-specific runtime quality |
| QA validation outcome | QA Testing Specialist | relevant implementation specialist | QA owns evidence judgment |
| Documentation truth | Documentation Specialist | relevant domain owner | authoritative written truth only |
| Security-sensitive change | Project Manager & Chief Architect | Infrastructure & DevOps, Lead Software Engineer, QA, AI Development Specialist as relevant | primary security ownership |
| Release candidate | Project Manager & Chief Architect for final release approval | Engineering Director, QA Testing Specialist, affected specialists | QA participation is mandatory for release-critical scope |
| Exception approval | Project Manager & Chief Architect | Engineering Director, relevant owner | must include expiry and review cadence |

Approval rules:

- Approval authority follows risk and domain truth, not org chart convenience.
- Operational coordination does not equal technical approval.
- Specialist review does not replace final approval where governance requires escalation.
- Documentation approval confirms truthfulness of documentation, not implementation correctness.

## 45. Decision Matrix

The decision matrix explains who decides what in daily operations:

| Decision Type | Decision Owner | When To Escalate |
| --- | --- | --- |
| Task routing and sequencing | Engineering Director | if architecture, governance, or security posture becomes central |
| Business intent clarification | Product Business Specialist | if scope dispute changes roadmap, architecture, or risk acceptance |
| Application implementation approach | Lead Software Engineer | if structural direction or cross-domain boundary changes |
| Persistence truth and data-safe method | Database Architect | if the decision changes architecture or cross-domain semantics |
| Mobile/PWA runtime behavior | Mobile PWA Specialist | if auth, shared routing, or platform direction is affected |
| UX interaction direction | UX UI Specialist | if workflow meaning or business behavior changes materially |
| Validation sufficiency and release evidence | QA Testing Specialist | if release must be blocked or risk escalated |
| Documentation authority | Documentation Specialist | if written truth conflicts with governance or architecture truth |
| AI workflow design | AI Development Specialist | if data handling, governance, or product risk becomes material |
| Final architecture, governance, release approval, and security posture | Project Manager & Chief Architect | final authority, no further escalation inside the AI organization |

The Engineering Director decides how work moves. The Chief Architect decides whether Bentix should accept structural, governance, release, or security consequences. That distinction must remain clear.

## 46. Escalation Matrix

Escalation should happen early enough to prevent silent drift, but not so early that specialists lose legitimate ownership. Bentix uses the following matrix:

| Trigger | Escalate To | Operational Meaning |
| --- | --- | --- |
| unclear ownership | Engineering Director | re-establish routing and control |
| unclear business meaning | Product Business Specialist | clarify user and workflow intent |
| repeated implementation disagreement | Lead Software Engineer or relevant domain owner | resolve local technical direction |
| architecture boundary change | Chief Architect | decide structural direction |
| release-confidence gap | QA Testing Specialist and Engineering Director | determine if release may proceed |
| documentation truth conflict | Documentation Specialist plus relevant owner | resolve source of truth |
| security-sensitive uncertainty | Chief Architect immediately | avoid silent risk acceptance |
| live service instability | Engineering Director and relevant incident owner | enter incident workflow |
| unresolved exception beyond expiry | Chief Architect and Engineering Director | force review or retirement |

Escalation is not failure. It is a control mechanism used to preserve speed with correctness.

## 47. Communication Standards

Bentix communication should be short, factual, explicit, and decision-enabling. Long updates that do not clarify ownership, blockers, risk, next action, or decision need are operationally weak even if they are detailed.

Every meaningful update should make clear:

- what changed
- what is known
- what remains unknown
- who owns the next step
- whether a blocker exists
- whether approval or escalation is required

Communication rules:

- separate facts from assumptions
- separate completed work from proposed next steps
- separate accepted risk from unresolved risk
- avoid status language that hides missing validation
- record important operational decisions in durable written form

These standards apply across delivery, release, incident, and documentation work.

## 48. Meeting Standards

Bentix should use meetings sparingly and intentionally. A meeting is justified only when it materially reduces ambiguity, accelerates an important decision, or coordinates work that cannot be handled cleanly through structured written communication.

Every meeting should have:

- a defined objective
- the minimum necessary participants
- a clear owner
- a decision or output target
- documented next actions

Meetings should end with:

- confirmed owner for each action
- target date or next checkpoint
- escalation path if unresolved
- documentation update requirement if project truth changed

Meetings without decision capture produce hidden process debt and should be avoided.

## 49. Incident Severity Matrix

Bentix uses four incident severity levels:

| Severity | Meaning | Typical Examples | Required Involvement |
| --- | --- | --- | --- |
| SEV-1 | critical outage or security event with major business or platform impact | production unavailable, data exposure, authentication collapse | Engineering Director, Chief Architect, primary specialist immediately |
| SEV-2 | major workflow degradation or shared environment failure | DEV unusable, broken approval flow, release-blocking operational regression | Engineering Director, relevant specialist, Chief Architect early |
| SEV-3 | important but limited issue | localized defect with meaningful user friction or partial failure | relevant specialist with Engineering Director oversight |
| SEV-4 | minor localized issue | cosmetic problem, low-risk inconsistency, non-blocking nuisance | normal workflow unless patterns accumulate |

Severity rules:

- severity reflects impact and urgency, not emotional reaction
- severity may change as facts improve
- `SEV-1` and `SEV-2` require explicit coordination and follow-up review
- `SEV-1` and security-sensitive `SEV-2` issues require immediate Chief Architect involvement
- severity must be recorded in the incident log or task notes

## 50. Continuous Improvement

Bentix should improve its operating system continuously rather than only after major failures. Continuous improvement includes better documentation, better validation habits, cleaner routing, better exceptions discipline, stronger rollback posture, clearer status communication, and better metrics.

Operational improvement inputs include:

- incidents and postmortems
- repeated review comments
- recurring delivery confusion
- slow or risky releases
- documentation drift
- specialist handoff friction

The Engineering Director tracks practical operational improvements. The Chief Architect ensures those improvements remain consistent with long-term governance and architecture.

## 51. Weekly Engineering Review

The weekly engineering review is the primary operating checkpoint for active delivery health. It is not a status theater meeting. It is a control point for priorities, blockers, release readiness, active exceptions, documentation gaps, and cross-domain coordination risk.

Typical weekly review agenda:

- priority changes
- blocked work
- active release candidates
- open incidents or hotfix follow-up
- expiring exceptions
- major documentation gaps
- recurring defect patterns
- next-week coordination needs

The Engineering Director owns the review cadence. The Chief Architect participates when architecture, release approval, security posture, or governance decisions are needed.

## 52. Monthly Architecture Review

The monthly architecture review is a strategic operating checkpoint rather than a task-level meeting. Its purpose is to identify whether delivery patterns, repeated defects, infrastructure workarounds, database complexity, or mobile/PWA operational problems are revealing deeper architectural pressure.

Typical review topics:

- repeated incidents or regressions
- growth in exceptions
- technical debt concentration
- environment complexity
- summary correctness or data integrity patterns
- mobile/runtime update problems
- security control maturity
- documentation and governance coherence

The Chief Architect owns the review. The Engineering Director prepares the operational context and the relevant specialists bring evidence from their domains.

## 53. Quarterly Governance Review

The quarterly governance review ensures that Bentix operating practice remains aligned with the project doctrine and documentation set. This review should examine whether the organization is following its defined approval model, escalation paths, data-handling rules, documentation standards, release discipline, and specialist boundaries.

The review should ask:

- Are the current workflows being followed?
- Are the documents still coherent with real practice?
- Have new hidden roles or shadow processes appeared?
- Are exceptions being retired or accumulating?
- Are quality and security gates still sufficient?
- Does the organization need governance refinement?

This is a governance integrity checkpoint, not a feature-planning session.

## 54. Documentation Maintenance

Documentation maintenance is continuous. Bentix should not wait for large documentation projects before correcting critical drift. Every meaningful change should trigger a small, targeted documentation decision: update now, create follow-up with owner, or explicitly confirm that no written truth changed.

Maintenance rules:

- update authoritative documents first
- remove obsolete guidance when superseded
- preserve cross-links between related documents
- keep terminology aligned with the official organization model
- do not create duplicate truth casually

The Documentation Specialist owns maintenance discipline, but every specialist remains accountable for domain truth.

## 55. Knowledge Management

Knowledge management in Bentix means capturing operationally important truth so that future contributors do not need to rediscover critical context through trial and error. It includes documentation, review notes, postmortems, exception records, checklists, and operational examples.

Knowledge should be:

- durable
- searchable
- linked to authoritative sources
- safe under the AI Data Handling Policy
- maintained when reality changes

Knowledge management also requires deletion or replacement of obsolete guidance. A repository with too many contradictory truths is not knowledgeable. It is confusing.

## 56. Engineering Metrics

Bentix metrics should support better decisions rather than vanity reporting. The organization should prefer a small set of meaningful indicators tied to delivery quality, operational stability, validation confidence, and documentation discipline.

Recommended engineering metrics:

- lead time from intake to completion by priority
- number of blocked tasks by cause
- release success rate
- rollback count
- incident count by severity
- mean time to detect and mean time to stabilize for incidents
- percentage of release-critical changes with QA sign-off
- documentation completion rate for change types that require it
- active exception count and average age
- recurring defect rate in previously touched areas

Metrics should be interpreted with context. A rising count is not always failure, and a low count is not always health. The meaning lies in patterns, not isolated numbers.

## 57. KPI Review

KPI review is the act of turning metrics into operational decisions. It should happen regularly and should ask what the organization must change, not merely what the numbers are.

KPI review questions:

- Which metrics are improving or degrading?
- Which teams or workflows are carrying hidden risk?
- Are incidents concentrated in one domain?
- Are releases slowing because readiness is weak or because gates are correctly catching risk?
- Are exceptions being retired?
- Is documentation freshness supporting or slowing delivery?

The Engineering Director should bring operational metrics. The Chief Architect should assess what they imply for architecture, governance, and long-term delivery quality.

## 58. Future Evolution

This SOP should evolve with the Bentix organization, but it should evolve carefully. Growth should happen through clearer execution, stronger evidence, better specialist coordination, and more mature operational controls, not through uncontrolled process accumulation.

Future revisions should preserve the core Bentix model:

- one operational entry point
- clear specialist ownership
- final technical authority where governance requires it
- QA as real release authority
- documentation as durable truth
- security and data handling as explicit controls

Any future change to this SOP should remain consistent with the wider Bentix governance set.

## 59. Appendices

### Appendix A: New Feature Example

```text
New Feature
  |
  v
Engineering Director
  |
  v
Product Business Specialist
  |
  v
Chief Architect
  |
  v
Lead Software Engineer
  |
  v
Database Architect
  |
  v
Mobile PWA Specialist
  |
  v
QA Testing Specialist
  |
  v
Documentation Specialist
  |
  v
Engineering Director
```

Use this path when the feature touches business meaning, application behavior, data, and mobile/PWA presentation. In smaller features, some roles may be skipped, but the sequence logic remains the same: intake, clarification, approval, implementation, validation, documentation, closure.

### Appendix B: Bug Example

```text
Bug
  |
  v
Engineering Director
  |
  v
Lead Software Engineer
  |
  v
QA Testing Specialist
  |
  v
Documentation Specialist
  |
  v
Engineering Director
```

Use this path when the defect is application-local and does not materially affect architecture or infrastructure. If the bug reveals schema meaning, infrastructure failure, or mobile/PWA runtime issues, add the relevant specialist before QA.

### Appendix C: Infrastructure Change Example

```text
Infrastructure Change
  |
  v
Engineering Director
  |
  v
Infrastructure & DevOps Specialist
  |
  v
Chief Architect
  |
  v
QA Testing Specialist
  |
  v
Documentation Specialist
  |
  v
Engineering Director
```

Use this path when a change affects build, deploy, proxy, DNS, SSL, runtime config, public assets, or environment operations. QA validation may be smoke-test focused if the change is primarily operational.

### Appendix D: Emergency Incident Example

```text
Emergency Incident
  |
  v
Engineering Director
  |
  v
Infrastructure & DevOps Specialist
  |
  v
Lead Software Engineer
  |
  v
Chief Architect
  |
  v
QA Testing Specialist
  |
  v
Documentation Specialist
```

Use this path for major outages or urgent operational failures. The order reflects practical emergency sequencing: stabilize runtime, repair application behavior, involve final authority, validate restored behavior, and document operational truth and lessons learned.

### Appendix E: Recommended Operational Artifact Set

For a well-run task, the Bentix organization should usually be able to point to the following operational artifacts:

- an intake summary
- a task classification and priority
- a named owner
- an approval or escalation path where needed
- validation evidence
- documentation update or explicit confirmation that none was required
- release or deployment note where applicable
- incident log, RCA, and postmortem where applicable
- exception record where a temporary deviation was accepted

The exact form may vary, but the information should exist in durable written form.

### Appendix F: Reference Map

Use this SOP together with:

- [BENTIX_PROJECT_GOVERNANCE.md](../BENTIX_PROJECT_GOVERNANCE.md) for project doctrine
- [AI_TEAM_MANIFEST.md](./AI_TEAM_MANIFEST.md) for shared operating values and AI data handling rules
- [AI_TEAM_INDEX.md](./AI_TEAM_INDEX.md) for team structure and reporting
- [AI_TEAM_OPERATING_SYSTEM.md](./AI_TEAM_OPERATING_SYSTEM.md) for core workflow rules
- [01_Project_Manager_Chief_Architect.md](./01_Project_Manager_Chief_Architect.md) for final authority and architecture governance
- [11_Bentix_Engineering_Director.md](./11_Bentix_Engineering_Director.md) for daily coordination authority
- specialist handbooks for domain-specific ownership

This SOP is successful when daily Bentix work becomes more predictable, more transparent, and more professionally governable because contributors can follow one shared operating model.
