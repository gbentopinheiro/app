# Bentix AI Team Index

This document is the official directory of the Bentix AI Organization. It identifies the specialist roles, reporting relationships, communication flow, consultation points, and onboarding path that govern how the team operates.

It should be used together with the individual specialist handbooks and with the foundational governance documents that define Bentix technical doctrine.

## Table of Contents

- [1. Purpose](#1-purpose)
- [2. Organizational Chart](#2-organizational-chart)
- [3. Specialist Directory](#3-specialist-directory)
- [4. Reporting Hierarchy](#4-reporting-hierarchy)
- [5. Interaction Matrix](#5-interaction-matrix)
- [6. Communication Flow](#6-communication-flow)
- [7. When To Consult Each Specialist](#7-when-to-consult-each-specialist)
- [8. Example Scenarios](#8-example-scenarios)
- [9. Onboarding Guide](#9-onboarding-guide)
- [10. Quick Reference Guide](#10-quick-reference-guide)

## 1. Purpose

The Bentix AI Team Index is the official directory of the Bentix AI Organization. It explains who each role is, what it owns, how the organization is structured, when each specialist should be consulted, and how new contributors should navigate the team.

This document does not replace the specialist handbooks. It is the coordination map that helps people move quickly toward the right owner, the right document, and the right decision path.

## 2. Organizational Chart

```text
Bentix Project Manager & Chief Architect
        |
        +-- Bentix Engineering Director
                |
                +-- Infrastructure & DevOps Specialist
                +-- Lead Software Engineer
                +-- Database Architect
                +-- Mobile PWA Specialist
                +-- UX UI Specialist
                +-- QA Testing Specialist
                +-- Documentation Specialist
                +-- AI Development Specialist
                +-- Product Business Specialist
```

## 3. Specialist Directory

| Document | Role | Mission | Primary Ownership | Escalate To |
| --- | --- | --- | --- | --- |
| 01_Project_Manager_Chief_Architect.md | Project Manager & Chief Architect | Protect architecture, roadmap coherence, and final technical governance. | Architecture, cross-domain decisions, long-term technical integrity | Bentix Engineering Director for orchestration conflicts |
| 02_Infrastructure_DevOps_Specialist.md | Infrastructure & DevOps Specialist | Keep Bentix deployable, recoverable, secure, and operationally stable. | Docker, Nginx, Cloudflare, TLS, VPS, backup and deploy operations | Project Manager & Chief Architect for architecture impact |
| 03_Lead_Software_Engineer.md | Lead Software Engineer | Turn architecture into maintainable application code. | Application code quality, implementation patterns, shared engineering discipline | Project Manager & Chief Architect for structural decisions |
| 04_Database_Architect.md | Database Architect | Make Bentix data trustworthy, explainable, and safe to evolve. | Schema design, Prisma governance, query semantics, import/export safety, data integrity | Project Manager & Chief Architect for meaning-changing data decisions |
| 05_Mobile_PWA_Specialist.md | Mobile PWA Specialist | Keep the Bentix mobile and installed PWA experience reliable after every deploy. | Mobile routes, PWA runtime, service worker lifecycle, manifest, public asset freshness, touch ergonomics | Project Manager & Chief Architect for auth or architecture-wide implications |
| 06_UX_UI_Specialist.md | UX UI Specialist | Make Bentix clear, usable, and trustworthy at the point where people touch the product. | Information architecture, responsive UX, interaction design, visual consistency, accessibility, workflow clarity | Project Manager & Chief Architect for cross-domain product trade-offs |
| 07_QA_Testing_Specialist.md | QA Testing Specialist | Protect Bentix by turning assumptions into tested evidence before they become production defects. | Critical-path testing, regression control, release validation, bug evidence, scenario coverage, acceptance confidence | Project Manager & Chief Architect for release-impacting quality risk |
| 08_Documentation_Specialist.md | Documentation Specialist | Keep Bentix understandable, navigable, and governable through durable written truth. | README stewardship, architecture docs, deployment docs, database docs, process docs, knowledge continuity | Project Manager & Chief Architect for authoritative project-truth decisions |
| 09_AI_Development_Specialist.md | AI Development Specialist | Make Bentix AI contribution repeatable, safe, and useful as an engineering capability rather than an ad hoc convenience. | Prompt engineering, AI workflow design, reusable specialist systems, guardrails, automation patterns, AI operating quality | Project Manager & Chief Architect for architecture or governance implications |
| 10_Product_Business_Specialist.md | Product Business Specialist | Turn business intent into clear, bounded, and implementable product direction for Bentix. | Requirements clarity, workflow intent, prioritization support, user-value framing, business rules articulation, acceptance framing | Project Manager & Chief Architect for roadmap or governance-level prioritization decisions |
| 11_Bentix_Engineering_Director.md | Bentix Engineering Director | Coordinate the Bentix AI Organization so the right specialists deliver the right outcome with the right quality bar. | Intake, delegation, coordination, completion governance, review control, executive delivery summaries | Project Manager & Chief Architect for strategy, architecture, and governance escalation |

## 4. Reporting Hierarchy

| Role | Reports Operationally To | Escalates Strategically To |
| --- | --- | --- |
| Infrastructure & DevOps Specialist | Bentix Engineering Director | Project Manager & Chief Architect |
| Lead Software Engineer | Bentix Engineering Director | Project Manager & Chief Architect |
| Database Architect | Bentix Engineering Director | Project Manager & Chief Architect |
| Mobile PWA Specialist | Bentix Engineering Director | Project Manager & Chief Architect |
| UX UI Specialist | Bentix Engineering Director | Project Manager & Chief Architect |
| QA Testing Specialist | Bentix Engineering Director | Project Manager & Chief Architect |
| Documentation Specialist | Bentix Engineering Director | Project Manager & Chief Architect |
| AI Development Specialist | Bentix Engineering Director | Project Manager & Chief Architect |
| Product Business Specialist | Bentix Engineering Director | Project Manager & Chief Architect |
| Bentix Engineering Director | Project Manager & Chief Architect for governance and strategy | Project Manager & Chief Architect |

## 5. Interaction Matrix

| Primary Pairing | Why The Pairing Matters | Typical Trigger |
| --- | --- | --- |
| Lead Software Engineer + Database Architect | Align application behavior with data meaning and query correctness. | summaries, data setup, persistence-sensitive features |
| Lead Software Engineer + UX UI Specialist | Turn product intent into maintainable and usable implementation. | forms, layouts, screen redesign, responsive issues |
| Lead Software Engineer + Mobile PWA Specialist | Keep mobile flows and installed PWA behavior aligned with shared code. | mobile login, PWA updates, route-specific behavior |
| QA Testing Specialist + all implementation specialists | Turn change into evidence and regression confidence. | release preparation, bug fixes, risky changes |
| Documentation Specialist + all specialists | Preserve current truth and reduce future ambiguity. | environment changes, governance changes, new workflows |
| Product Business Specialist + UX UI Specialist | Align user value with interface and workflow clarity. | ambiguous feature requests, workflow changes |
| AI Development Specialist + Documentation Specialist | Keep AI systems explicit, reusable, and discoverable. | new specialist roles, prompt changes, operating-process updates |
| Bentix Engineering Director + all specialists | Coordinate scope, sequence, quality gates, and closure. | cross-domain work, blocked delivery, final review |

## 6. Communication Flow

```text
Request
  |
  v
Bentix Engineering Director
  |
  +--> Product / scope clarification when needed
  +--> Specialist assignment
  +--> Cross-specialist execution
  +--> QA validation
  +--> Documentation update
  +--> Final coordination review
  |
  +--> Escalation to Project Manager & Chief Architect when required
```

## 7. When To Consult Each Specialist

| When The Need Appears | Consult This Role First | Reason |
| --- | --- | --- |
| A request touches schema, queries, aggregates, import/export, summary correctness, or data repairs | Database Architect | This role owns persistence meaning and database-side integrity decisions |
| A request touches mobile login, installed PWA behavior, service workers, manifest assets, or phone usability | Mobile PWA Specialist | This role owns mobile runtime quality and PWA update behavior |
| A request touches layouts, forms, tables, navigation, responsive behavior, interaction friction, or design consistency | UX UI Specialist | This role owns product usability and interface coherence |
| A request touches critical workflows, regressions, release confidence, defect reproduction, or acceptance criteria | QA Testing Specialist | This role owns validation evidence and testing strategy |
| A request changes setup, architecture, workflows, environments, governance, or specialist responsibilities | Documentation Specialist | This role owns durable written truth and documentation coherence |
| A request touches AI prompts, specialist workflows, agent coordination patterns, reusable AI automation, or AI governance implementation | AI Development Specialist | This role owns the engineered use of AI inside the Bentix delivery system |
| A request is ambiguous in business intent, workflow purpose, stakeholder value, scope boundary, or acceptance expectation | Product Business Specialist | This role owns the translation between business need and product-ready clarity |
| A request needs orchestration, specialist selection, sequencing, or final completion control | Bentix Engineering Director | This role owns team-level execution governance |
| A request changes project-wide architecture, sequencing, or long-term direction | Project Manager & Chief Architect | Final technical authority and architecture governor |
| A request needs intake, delegation, and cross-specialist coordination | Bentix Engineering Director | Owns orchestration and completion governance |
| The runtime platform, DNS, SSL, Docker image, or deploy path is at risk | Infrastructure & DevOps Specialist | Owns operational runtime stability |
| Implementation quality, code structure, or layer placement is the main concern | Lead Software Engineer | Owns codebase execution discipline |

## 8. Example Scenarios

| Scenario | Consult First | Likely Supporting Roles |
| --- | --- | --- |
| A login flow works on desktop but fails in installed mobile PWA | Mobile PWA Specialist | Lead Software Engineer, QA Testing Specialist, Infrastructure & DevOps Specialist |
| A summary is showing hours that were not approved | Database Architect | Lead Software Engineer, QA Testing Specialist |
| A feature request is unclear about role behavior and business intent | Product Business Specialist | UX UI Specialist, Lead Software Engineer |
| A deploy works locally but not in DEV because public assets are missing | Infrastructure & DevOps Specialist | Mobile PWA Specialist, Lead Software Engineer |
| Documentation and implementation disagree about environment configuration | Documentation Specialist | Relevant technical specialist, Project Manager & Chief Architect if truth is disputed |

## 9. Onboarding Guide

- Read `BENTIX_PROJECT_GOVERNANCE.md` to understand project-wide doctrine.
- Read `AI_TEAM_MANIFEST.md` to understand the shared operating culture of the AI organization.
- Read `01_Project_Manager_Chief_Architect.md` to understand final technical authority.
- Read `AI_TEAM_OPERATING_SYSTEM.md` to understand how work actually moves through the team.
- Read the handbook for the specialist role you will operate under before starting work.
- Use this index to identify which other specialists you will need to coordinate with regularly.

## 10. Quick Reference Guide

| If You Need... | Go To... | Reason |
| --- | --- | --- |
| runtime, deploy, DNS, SSL, Docker | Infrastructure & DevOps Specialist | owns operational environment truth |
| code structure or implementation quality | Lead Software Engineer | owns application engineering discipline |
| schema, query meaning, import, summaries | Database Architect | owns persistence truth |
| mobile installability or PWA update behavior | Mobile PWA Specialist | owns mobile runtime quality |
| layout, responsiveness, clarity, forms | UX UI Specialist | owns usability and interface coherence |
| validation confidence or regression proof | QA Testing Specialist | owns testing evidence |
| docs, README, architecture or team handbooks | Documentation Specialist | owns written project truth |
| AI prompts, role systems, reusable AI workflows | AI Development Specialist | owns AI operating quality |
| scope ambiguity or product intent | Product Business Specialist | owns business-to-product clarification |
| request routing, coordination, or completion control | Bentix Engineering Director | owns organizational execution governance |
