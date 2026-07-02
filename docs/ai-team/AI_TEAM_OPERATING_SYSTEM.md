# Bentix AI Team Operating System

This document is the operating manual of the Bentix AI Organization. It explains how work enters the team, how it is routed, how specialist collaboration is governed, and what conditions must be satisfied before work is considered complete.

It should be interpreted together with the team manifest, the Bentix project governance document, the Chief Architect handbook, and the specialist handbooks.

## Table of Contents

- [1. Purpose](#1-purpose)
- [2. Operating Principles](#2-operating-principles)
- [3. How Work Is Received](#3-how-work-is-received)
- [4. Task Classification](#4-task-classification)
- [5. Delegation Process](#5-delegation-process)
- [6. Engineering Workflow](#6-engineering-workflow)
- [7. Architecture Workflow](#7-architecture-workflow)
- [8. Incident Workflow](#8-incident-workflow)
- [9. Release Workflow](#9-release-workflow)
- [10. Bug Workflow](#10-bug-workflow)
- [11. Documentation Workflow](#11-documentation-workflow)
- [12. Decision Approval Process](#12-decision-approval-process)
- [13. Conflict Resolution](#13-conflict-resolution)
- [14. Escalation Model](#14-escalation-model)
- [15. Review Model](#15-review-model)
- [16. Quality Gates](#16-quality-gates)
- [17. Security Gates](#17-security-gates)
- [18. Release Gates](#18-release-gates)
- [19. Engineering Standards](#19-engineering-standards)
- [20. Communication Protocol](#20-communication-protocol)
- [21. Meeting Protocol](#21-meeting-protocol)
- [22. Definition of Ready](#22-definition-of-ready)
- [23. Definition of Done](#23-definition-of-done)
- [24. Continuous Improvement](#24-continuous-improvement)
- [25. Knowledge Management](#25-knowledge-management)

## 1. Purpose

The Bentix AI Team Operating System is the operating manual of the Bentix AI Organization. It defines how work enters the organization, how it is classified, how specialists are selected, how reviews happen, how escalation works, and which gates must be satisfied before work is considered complete.

This document is not a replacement for specialist handbooks. It is the process layer that coordinates those handbooks into one delivery system.

## 2. Operating Principles

- Route work to the right specialist before trying to solve it.
- Keep ownership explicit at every stage.
- Prefer clear sequencing over parallel confusion.
- Treat testing, documentation, and governance as part of delivery, not as optional afterthoughts.
- Escalate uncertainty before it becomes expensive misalignment.

## 3. How Work Is Received

- All significant requests enter through the Bentix Engineering Director.
- The director identifies the stated request, the underlying objective, and the likely domain spread.
- If the request is ambiguous in product meaning, the Product Business Specialist is engaged before implementation starts.
- If the request clearly impacts architecture, engineering governance, technical approval, release approval, or security posture, the Project Manager & Chief Architect is involved early as final authority rather than day-to-day orchestrator.

## 4. Task Classification

| Task Class | Typical Characteristics | Default Routing |
| --- | --- | --- |
| Single-domain implementation | one primary technical owner and limited cross-impact | route directly to the relevant specialist |
| Cross-domain delivery | touches multiple specialist areas or handoff-sensitive workflows | coordinate through the Engineering Director |
| Architecture-impacting change | changes structure, boundaries, or long-term platform direction | escalate to Project Manager & Chief Architect |
| Incident or urgent defect | requires rapid triage or operational stabilization | director coordinates immediate response |
| Documentation or governance change | updates project truth or team operating doctrine | route to Documentation Specialist with supporting owners |

## 5. Delegation Process

```text
Request Intake
    |
    v
Classify Scope and Risk
    |
    v
Select Primary Specialist
    |
    +--> Add supporting specialists if required
    |
    v
Define deliverables, review path, and completion criteria
```

## 6. Engineering Workflow

- Clarify scope and dependencies before code changes begin.
- Assign the Lead Software Engineer when application implementation is involved.
- Bring in the Database Architect, Mobile PWA Specialist, UX UI Specialist, QA Testing Specialist, Documentation Specialist, or Product Business Specialist as required by the request.
- Require validation and documentation updates before the coordinated task is considered complete.

## 7. Architecture Workflow

- Identify early whether the request changes structure, role boundaries, persistence strategy, or environment model.
- Escalate to the Project Manager & Chief Architect before committing to an architectural path.
- Collect specialist input in a structured way so the architecture decision is informed and reviewable.
- Return the chosen direction to the Engineering Director for execution coordination.

## 8. Incident Workflow

- Stabilize the problem definition before solution branching begins.
- Assign a primary incident specialist based on the most likely root domain.
- Keep facts, mitigations, open risks, and next actions visible at all times.
- Classify severity explicitly: `SEV-1` critical outage or security event, `SEV-2` major workflow degradation, `SEV-3` limited but important defect, `SEV-4` minor localized issue.
- Route `SEV-1` and `SEV-2` incidents through the Bentix Engineering Director immediately and involve the Project Manager & Chief Architect as final technical authority.
- Require a post-incident review for `SEV-1` and `SEV-2`: root cause analysis, lessons learned, follow-up actions, owner, and target date.

## 9. Release Workflow

- Confirm implemented scope, validation evidence, and documentation status.
- Review environment-specific implications with Infrastructure when relevant.
- Require formal QA Testing Specialist participation on release-risking changes.
- QA Testing Specialist may block a release when critical workflows remain unproven, release-critical regressions remain unresolved, target-environment validation is incomplete, or evidence is insufficient for the claimed outcome.
- Escalate unresolved blockers rather than carrying them invisibly into release.

## 10. Bug Workflow

- QA or the reporting specialist defines reproduction conditions and expected behavior clearly.
- The Engineering Director assigns the primary fixer based on actual domain ownership.
- The relevant specialist implements the fix with supporting roles where needed.
- QA validates the fix in the same conditions where the bug existed.

## 11. Documentation Workflow

- Identify documentation impact during task planning, not only at the end.
- Route written-truth changes to the Documentation Specialist with the relevant domain owner.
- Update authoritative documents first and use references to avoid duplication.
- Do not close the request if documentation required for future safe work is still missing.

## 12. Decision Approval Process

- Local specialist decisions stay with the relevant specialist.
- Cross-domain sequencing and completion decisions stay with the Engineering Director.
- Architecture, governance, and long-term platform direction decisions escalate to the Project Manager & Chief Architect.
- Product meaning or business-priority ambiguity is clarified with the Product Business Specialist and escalated if unresolved.

**Exception Governance**

- Every exception must have a named domain owner.
- Technical approval belongs to the Project Manager & Chief Architect; operational tracking belongs to the Bentix Engineering Director.
- Every exception must define scope, reason, expiry date, review cadence, and retirement conditions.
- Active exceptions must be reviewed at least weekly until retired.

## 13. Conflict Resolution

- Clarify whether the conflict is about facts, business meaning, implementation, architecture, or priority.
- Use the relevant domain owner for fact and scope truth.
- Escalate to the Project Manager & Chief Architect when the conflict changes architecture or project governance.
- The Engineering Director maintains forward motion by making the unresolved point explicit and routing it properly.

## 14. Escalation Model

| Escalation Trigger | Escalate To | Reason |
| --- | --- | --- |
| architecture or governance impact | Project Manager & Chief Architect | final technical and governance authority |
| cross-domain coordination blockage | Bentix Engineering Director | owns orchestration authority |
| unclear business intent | Product Business Specialist | owns requirement and workflow clarification |
| release confidence gap | QA Testing Specialist and Engineering Director | quality evidence and coordination are both required |
| documentation truth conflict | Documentation Specialist plus relevant owner | written truth must match actual truth |

## 15. Review Model

- Specialists review within their domain for correctness and quality.
- QA reviews for evidence and regression confidence where applicable.
- Documentation reviews for truth and durability where documents change.
- The Engineering Director performs final coherence review across the combined deliverable.

## 16. Quality Gates

- The problem and solution scope are clear.
- The right specialist reviewed the domain-sensitive work.
- Required tests or validation evidence exist.
- Residual risks are explicit.
- The result is coherent with existing Bentix standards.

## 17. Security Gates

- The Project Manager & Chief Architect is the primary owner of Bentix security posture.
- The Infrastructure & DevOps Specialist owns operational security execution, the Lead Software Engineer owns application-layer security execution, the QA Testing Specialist validates security-sensitive regressions, the AI Development Specialist protects AI workflow security, and the Documentation Specialist protects safe written guidance.
- No change silently weakens authentication, authorization, session handling, or secret safety.
- Sensitive operations have appropriate confirmation and validation posture.
- Headers, redirects, cookies, permissions, and destructive paths were assessed when relevant.
- Security-sensitive uncertainty is escalated rather than assumed away.

## 18. Release Gates

- Release-critical workflows have validation evidence.
- QA Testing Specialist sign-off exists for release-critical changes.
- Environment-specific runtime implications are understood.
- Documentation required for safe operation is current.
- Open blockers and known risks are explicitly accepted or resolved.

## 19. Engineering Standards

- Prefer configuration over hardcoding.
- Avoid breaking changes unless explicitly approved.
- Keep business logic in the correct layer.
- Do not trade maintainability for speed without explicit bounded reason.
- Preserve consistency with the current Bentix monorepo architecture.

## 20. Communication Protocol

- Updates should be short, factual, and decision-enabling.
- Ownership, blockers, next actions, and risk must be explicit.
- Facts, assumptions, and recommendations must not be blurred together.
- Status communication should help the next decision happen faster.

## 21. Meeting Protocol

- Hold coordination discussions only when they materially reduce ambiguity or unblock execution.
- Enter with a defined objective, affected roles, and expected decision.
- Leave with ownership, next step, and escalation path if unresolved.
- Convert important meeting outcomes into written project truth when needed.

## 22. Definition of Ready

- The request objective is understood.
- Scope and dependencies are explicit enough to start safely.
- The right specialists are identified.
- Known risks or missing clarifications are visible.

## 23. Definition of Done

- The intended outcome is implemented or resolved.
- Required validation has happened.
- Required documentation is updated.
- Residual risks are explicit and acceptable.
- The Engineering Director can close the work as a coherent deliverable.

## 24. Continuous Improvement

- Convert repeated coordination problems into stronger process rules.
- Turn recurring defects into better review and validation habits.
- Refine specialist boundaries whenever overlap creates noise or delay.
- Keep the operating system adaptive without sacrificing discipline.

## 25. Knowledge Management

- Preserve durable truth in repository documents rather than in transient chat memory.
- Use the Documentation Specialist to maintain clarity over where truth lives.
- Reference authoritative docs rather than cloning them into parallel guidance.
- Apply the AI Data Handling Policy from `AI_TEAM_MANIFEST.md` to every Bentix AI conversation.
- Treat onboarding clarity as an operational advantage, not as optional polish.
