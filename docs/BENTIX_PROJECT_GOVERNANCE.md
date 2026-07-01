# Bentix Project Governance

This document is the primary governance reference for Bentix. It is the starting point for any developer, AI assistant, reviewer, or project stakeholder who needs to understand how the project should evolve, how decisions should be made, and how work should be coordinated.

It is intentionally not a README and not a low-level technical manual. Detailed implementation guidance remains in the technical documentation set referenced throughout this document.

When lightweight notes or legacy materials conflict with this governance document and the current architecture documents, this governance set should be treated as the project baseline until the conflicting material is reconciled.

## Table of Contents

- [1. Project Vision](#1-project-vision)
- [2. Architecture Overview](#2-architecture-overview)
- [3. Supported Environments](#3-supported-environments)
- [4. Development Principles](#4-development-principles)
- [5. Application Domains](#5-application-domains)
- [6. Technology Stack](#6-technology-stack)
- [7. Documentation Map](#7-documentation-map)
- [8. AI Specialist Team](#8-ai-specialist-team)
- [9. Development Workflow](#9-development-workflow)
- [10. Quality Gates](#10-quality-gates)
- [11. Coding Standards](#11-coding-standards)
- [12. Future Vision](#12-future-vision)

# 1. Project Vision

Bentix is an operational management platform for coordinating people, works, planning, daily execution, and control workflows in a single product.

The project addresses recurring operational problems such as:

- fragmented planning across teams and works
- disconnected people, works, and client information
- weak visibility over daily execution
- manual or inconsistent time submission and approval
- operational decisions being split across spreadsheets, ad hoc notes, and disconnected tools

Bentix serves several types of users:

- administrators and technical operators
- operational managers and supervisors
- chiefs and field leaders
- office users responsible for planning, approvals, and oversight
- developers and maintainers of the platform itself

The product philosophy is pragmatic and disciplined:

- one coherent application instead of multiple disconnected products
- operational clarity over feature noise
- configuration over hardcoded behavior
- security and data integrity as defaults, not optional extras
- mobile access as a first-class experience, but still part of the same product

# 2. Architecture Overview

Bentix currently runs as a single monorepo application with a shared codebase for:

- the web interface
- the mobile/PWA experience
- the REST API
- the server-side application logic
- the MariaDB-backed persistence layer

At a high level, the system connects as follows:

```text
Browser
   |
   v
Next.js application
   |
   v
REST API boundary
   |
   v
Service and domain layer
   |
   v
Prisma
   |
   v
MariaDB
```

The mobile experience is not a separate application. It is a product surface of the same Next.js application, exposed through mobile routes and the PWA layer.

The current deployment model publishes the same codebase under different hostnames depending on environment, with Nginx and Cloudflare providing the external access layer.

This document does not duplicate the detailed technical architecture. The detailed references are:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ARCHITECTURE.en.md](./ARCHITECTURE.en.md)
- [DATABASE.md](./DATABASE.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

# 3. Supported Environments

The official supported environments are:

- `LOCAL`
- `DEV`
- `PROD`

Their roles are distinct and must remain distinct.

## LOCAL

`LOCAL` exists for development, debugging, technical experimentation, and rapid iteration on a developer machine.

Expected role:

- local coding
- local verification
- safe experimentation before promotion

It is not a shared validation environment.

## DEV

`DEV` is the shared online technical validation environment.

Expected role:

- team validation
- integration verification
- deploy and infrastructure checks
- browser, mobile, PWA, and environment-specific validation

It is not the final production environment, but it must behave as closely as practical to real deployment conditions.

## PROD

`PROD` is the live operational environment.

Expected role:

- real users
- real business operations
- stable and controlled releases

It is never the place for exploratory development.

## Environment Rule

The official promotion path is:

```text
LOCAL -> DEV -> PROD
```

Anything outside this model should be treated as transitional or unsupported unless explicitly adopted into project governance.

# 4. Development Principles

The following rules are mandatory:

- Never change business logic unless the change is necessary and clearly justified.
- Avoid breaking changes whenever possible.
- Prefer configuration over hardcoded values.
- Maintain backward compatibility unless a deliberate breaking decision is approved.
- Put security first.
- Keep the code simple.
- Respect performance and avoid unnecessary complexity.
- Document relevant changes whenever architecture, operations, configuration, or behavior materially change.

Additional project-wide expectations:

- preserve stable contracts across UI, API, and data flows
- favor incremental change over disruptive rewrites
- protect production behavior from experimental shortcuts
- use the existing architecture before introducing parallel patterns

# 5. Application Domains

Bentix is organized into a set of major application domains. These are product-level domains, not implementation details.

## Authentication

Login, logout, session handling, protected payload transport, password management, and access boundaries.

## Users

Technical users, operational identities, access profiles, and permission assignment.

## People

Workforce records, pricing context, role classification, documents, and people-level activity views.

## Clients

Client entities, administrative ownership, and the commercial parent context for works.

## Works

Construction or operational works, their identifiers, status, cost configuration, and structure.

## Planning

Daily plans, assignment preparation, planning locks, and planning coordination workflows.

## Daily Hours

Operational recording of hours, team execution visibility, and daily submission workflows.

## Approvals

Administrative approval flows, validation of submitted hours, and controlled sign-off actions.

## Materials

Material management and related operational support records.

## Calendar

Calendar events, planning visibility, and date-driven operational coordination.

## Notifications

Notification state, reminders, and user-facing operational prompts.

## Developer Area

Technical administration, diagnostics, audit visibility, feature flags, data utilities, and internal tools.

## Mobile

Mobile-first operational usage, especially for chiefs and field-oriented workflows.

## PWA

Installable mobile access, manifest-driven app behavior, and platform-specific mobile launch behavior.

# 6. Technology Stack

Bentix currently relies on the following primary stack:

| Layer | Technology |
| --- | --- |
| Application framework | `Next.js 16` |
| UI library | `React 19` |
| Runtime | `Node.js 22` |
| Data access | `Prisma 7` |
| Database | `MariaDB 11.4` |
| Containerization | `Docker` |
| Reverse proxy | `Nginx` |
| DNS / edge proxy | `Cloudflare` |
| API contract | `OpenAPI` and internal `Swagger UI` |
| Test runner | `node:test` |
| Deployment automation | `GitHub Actions` plus VPS-based Docker deployment |

Important architectural notes:

- Bentix is a monorepo.
- Web, mobile, and API live in the same application.
- Prisma is the persistence abstraction layer for MariaDB.
- Environment-specific publication is handled by Docker, Nginx, and Cloudflare.

# 7. Documentation Map

This section maps the most important existing documentation sources.

## Primary Governance and High-Level Context

- [BENTIX_PROJECT_GOVERNANCE.md](./BENTIX_PROJECT_GOVERNANCE.md)  
  Primary governance and coordination document for the project.

- [ROADMAP.md](./ROADMAP.md)  
  Current strategic direction and near-term priorities.

## Architecture and Platform

- [ARCHITECTURE.en.md](./ARCHITECTURE.en.md)  
  Primary detailed technical architecture reference in English.

- [ARCHITECTURE.md](./ARCHITECTURE.md)  
  Portuguese architecture reference.

- [DATABASE.md](./DATABASE.md)  
  Current database model, migration approach, and data-source posture.

- [DEPLOYMENT.md](./DEPLOYMENT.md)  
  Deployment model, environment variables, and promotion expectations.

## API and Runtime Interface

- [API.md](./API.md)  
  High-level API surface summary.

- Runtime OpenAPI JSON: `/api/docs/openapi.json`
- Internal Swagger UI: `/developer/api-docs`

## Infrastructure and Operations

- [../infra/README.md](../infra/README.md)  
  Infrastructure layout, ports, docker-compose usage, and operational setup notes.

- [mysql-local-setup.md](./mysql-local-setup.md)  
  Local MySQL/MariaDB setup guidance and legacy-to-MySQL bootstrap notes.

## Repository Entry and Transitional Material

- [../README.md](../README.md)  
  Repository root entry point. It exists, but should not be treated as the primary architecture or governance source when it diverges from the Bentix documentation set.

- [bentix-technical-docs.zip](./bentix-technical-docs.zip)  
  Packaged archive artifact. Useful as a bundled snapshot, but not the preferred living source of truth.

## Practical Documentation Rule

Use the documents in this order when context is needed:

```text
Governance
   ->
Architecture / Database / Deployment
   ->
API / Infrastructure / Setup guides
   ->
README and transitional materials
```

# 8. AI Specialist Team

Bentix adopts a formal AI specialist model. Each specialist has clear responsibilities, clear scope, and explicit boundaries.

## Bentix Project Manager & Chief Architect

### Responsibilities

- architecture direction
- roadmap definition
- prioritization
- cross-specialist coordination
- technical decision-making
- risk management
- project governance

### Scope

- define the target solution shape
- protect architectural consistency
- sequence work across specialists
- approve major technical direction
- decide when changes are local, cross-cutting, or risky

### Out of Scope

- implementing large standalone feature sets end-to-end
- acting as the default executor for every domain task
- replacing specialist-level deep work

This role coordinates the work. It should not become the main implementation role for large features.

## Infrastructure Specialist

### Responsibilities

- Docker
- deploy workflows
- Cloudflare
- Nginx
- SSL / TLS
- backups and restore operations
- VPS operations
- Git and deployment safety

### Scope

- environment provisioning
- reverse proxy configuration
- build and container topology
- deployment automation
- operational resilience and recovery posture

### Out of Scope

- feature-specific business logic
- application UI design
- domain-level data modeling not driven by infrastructure requirements

## Backend Specialist

### Responsibilities

- REST API
- business logic
- services
- authentication

### Scope

- controllers, services, and server-side behavior
- permission enforcement
- request validation
- session and access behavior
- stable API contracts

### Out of Scope

- infrastructure ownership
- final database tuning strategy outside backend needs
- primary ownership of design systems or frontend interaction design

## Frontend Specialist

### Responsibilities

- React
- Next.js
- layouts
- components

### Scope

- application pages and flows
- component structure
- SSR / client component behavior
- integration with frontend controllers and API consumption
- route-level user experience

### Out of Scope

- business-rule ownership
- database optimization
- infrastructure deployment logic

## Database Specialist

### Responsibilities

- MariaDB
- Prisma
- performance
- indexes
- queries
- import / export

### Scope

- schema integrity
- query behavior
- migration and import safety
- performance of persistence flows
- data validation and baseline logic

### Out of Scope

- browser UX
- routing and UI state
- deployment topology outside database implications

## Mobile/PWA Specialist

### Responsibilities

- PWA
- manifest
- mobile layout
- Android
- iPhone

### Scope

- mobile route behavior
- installability
- mobile navigation and viewport behavior
- touch-oriented experience
- mobile login and mobile session flow

### Out of Scope

- non-mobile business rules
- backend contract ownership
- infrastructure configuration unless required for mobile delivery

## UX/UI Specialist

### Responsibilities

- design
- usability
- responsive behavior
- accessibility

### Scope

- visual direction
- interaction clarity
- accessibility standards
- responsive consistency across desktop, tablet, and mobile

### Out of Scope

- application security logic
- infrastructure deployment
- ownership of database behavior

## QA Specialist

### Responsibilities

- testing
- regression control
- validation

### Scope

- test coverage expectations
- regression risk analysis
- release validation
- acceptance criteria verification

### Out of Scope

- owning architecture direction
- changing product priorities
- rewriting implementation details unless required to unblock quality

## Documentation Specialist

### Responsibilities

- README
- architecture documents
- deployment documents
- database documents
- developer-facing documentation

### Scope

- keep documents aligned with the implemented system
- remove ambiguity in setup and operational guidance
- ensure key decisions are captured in writing
- preserve a usable documentation map for humans and AI

### Out of Scope

- owning functional implementation
- making architecture decisions in isolation
- replacing technical review with documentation alone

## Collaboration Rule

Specialists may collaborate across domains, but cross-domain changes should not silently redefine another specialist's area of ownership. When a change affects multiple domains, coordination must return to the Project Manager & Chief Architect.

# 9. Development Workflow

The official Bentix workflow is:

```text
Idea
  |
  v
Project Manager & Chief Architect
  |
  v
Relevant Specialist
  |
  v
Implementation
  |
  v
Tests
  |
  v
Documentation
  |
  v
Review
  |
  v
DEV
  |
  v
PROD
```

## Workflow Meaning

### Idea

A need, bug, improvement, risk, or operational change is identified.

### Project Manager & Chief Architect

The work is classified, scoped, prioritized, and assigned to the correct specialist or combination of specialists.

### Relevant Specialist

The specialist works within domain boundaries and escalates cross-domain impact when necessary.

### Implementation

The change is implemented with minimal disruption and explicit awareness of architecture, security, and compatibility.

### Tests

Critical automated validation must run, and any domain-specific regression risk must be checked.

### Documentation

If the change affects architecture, environment behavior, setup, operations, or contributor expectations, the relevant documentation must be updated.

### Review

Review is both technical and governance-based. The question is not only "does it work?" but also "does it fit Bentix?"

### DEV

The shared technical validation environment is the checkpoint before real operation.

### PROD

Only validated, documented, and reviewed changes should reach production.

# 10. Quality Gates

Before any merge or equivalent promotion, the following gates must be satisfied:

- `npm run build` passes
- critical tests pass
- relevant documentation is updated
- no hardcoded public URLs are introduced where configuration should be used
- no credentials, secrets, or unsafe tokens are committed
- no breaking changes are introduced unless explicitly approved

Additional required checks:

- redirects must remain safe and internal when user-controlled
- authentication, cookie, and access behavior must remain deliberate
- environment assumptions must match `LOCAL`, `DEV`, and `PROD`
- mobile and responsive behavior must not regress when affected surfaces are changed

# 11. Coding Standards

Bentix coding standards are intentionally practical and architecture-oriented.

## Core Standards

- keep route handlers thin
- keep business logic in services and domain helpers
- prefer reuse over parallel implementations
- prefer configuration over duplicated constants
- avoid hidden side effects
- preserve existing contracts unless a controlled change is approved
- keep environment handling explicit
- add or adjust tests when behavior changes

## Structural Conventions

- UI routes belong in `app/`
- frontend transport logic belongs in `frontend/controllers/` and `frontend/api/`
- HTTP boundary logic belongs in `server/controllers/`
- application orchestration belongs in `server/services/`
- reusable domain and persistence helpers belong in `lib/` and `lib/db/`
- public environment configuration belongs in `config/`

## Change Discipline

- avoid large refactors without strong justification
- do not introduce a second pattern when an accepted one already exists
- do not move logic across layers without reason
- do not bypass configuration with environment-specific hardcoding
- do not weaken security to simplify implementation

# 12. Future Vision

This document should evolve together with Bentix.

Its purpose is to become and remain:

- the most important document in the repository
- the default starting context for any AI conversation about the project
- the coordination baseline for all specialists
- a tool to reduce technical debt through consistent decision-making
- a safeguard for the long-term Bentix architecture

As the project grows, this document should be revised whenever there are material changes in:

- architecture direction
- environment strategy
- delivery workflow
- specialist boundaries
- governance rules

The goal is not to freeze the project. The goal is to let Bentix evolve without losing coherence.
