# Bentix Typography Guide

This document defines the official typography system for Bentix.

It is a visual and interaction specification only. It does not implement fonts, CSS, or components. Its purpose is to establish the typographic logic that every future Bentix page, module, component, and design system decision should follow.

This guide complements:

- [BENTIX_VISUAL_IDENTITY.md](./BENTIX_VISUAL_IDENTITY.md)
- [BENTIX_DESIGN_SYSTEM.md](./BENTIX_DESIGN_SYSTEM.md)

The Visual Identity defines the overall aesthetic and brand character. The Design System defines broader interface patterns. This document defines how text should look, behave, and support work across the Bentix platform.

## Table of Contents

- [1. Typography Philosophy](#1-typography-philosophy)
- [2. Official Font](#2-official-font)
- [3. Font Weights](#3-font-weights)
- [4. Type Scale](#4-type-scale)
- [5. Reading Width](#5-reading-width)
- [6. Numbers](#6-numbers)
- [7. Tables](#7-tables)
- [8. Forms](#8-forms)
- [9. Dashboard](#9-dashboard)
- [10. Mobile](#10-mobile)
- [11. Accessibility](#11-accessibility)
- [12. Do Not](#12-do-not)
- [13. Migration Strategy](#13-migration-strategy)
- [14. Final Summary](#14-final-summary)

## 1. Typography Philosophy

Typography in Bentix is an operational tool.

Its job is not to create personality through decoration. Its job is to make information immediately understandable, prioritised, and comfortable to use over long sessions.

Bentix users spend between six and ten hours a day inside the platform. That makes typography one of the most important productivity layers in the product.

Good Bentix typography should:

- reduce visual fatigue
- make page structure obvious
- speed up recognition of states, labels, and numbers
- help users distinguish context from detail
- support dense enterprise interfaces without feeling cramped

Bentix typography should always answer these questions quickly:

- Where am I?
- What matters most here?
- What is the next action?
- Which numbers or statuses require attention?

The typography system must therefore be:

- highly readable
- quiet rather than expressive
- structured rather than decorative
- stable rather than trendy
- consistent across modules

In Bentix, typography should feel closer to Linear, Stripe Dashboard, Notion, Atlassian, and strong internal enterprise tools than to a landing page, brand campaign, or consumer app.

## 2. Official Font

### Official Font Family

Bentix official font family: `Inter`

Bentix should use one official font family only.

### Why Inter

`Inter` is the official Bentix typeface because it balances:

- open source availability
- high readability
- calm geometry
- professional tone
- modern structure
- strong enterprise UI behaviour
- web and PWA optimisation
- native Next.js integration through `next/font/google`
- cross-platform consistency across Windows, macOS, Linux, Android, and iOS
- long-session comfort

It feels cleaner and more refined than many system defaults while remaining highly usable in operational interfaces. It supports both strong hierarchy and restrained neutrality.

It also performs well across the kinds of text Bentix depends on every day:

- page titles
- section headers
- form labels
- table content
- numeric summaries
- status and action text

### Comparison Against Alternatives

#### Inter

Inter is now the official Bentix font. It is exceptionally strong in product interfaces, renders consistently across platforms, and performs very well in dense operational systems where readability, spacing discipline, and numeric clarity matter every day.

Verdict:

- official Bentix choice
- strongest balance of implementation quality, readability, and operational consistency

#### Manrope

Manrope is modern and visually refined, but it has a more expressive and more rounded character. In dense enterprise interfaces it can feel slightly more stylized than necessary.

Verdict:

- elegant
- less operational and less neutral than Bentix needs

#### IBM Plex Sans

IBM Plex Sans is highly credible in enterprise software and has a strong technical tone. However, it carries more industrial sharpness and can feel a little busier in continuous UI reading.

Verdict:

- serious and capable
- slightly more technical and less calm than ideal for Bentix

#### Source Sans

Source Sans is practical, readable, and dependable. It works well in many interfaces, but it feels more utilitarian and less premium than the Bentix target.

Verdict:

- strong fallback-level reliability
- less distinctive and less refined than the official Bentix direction

#### SF Pro

SF Pro is a reference-quality UI font and one of the strongest interface fonts in existence. However, it is strongly associated with Apple platforms and should be treated as a reference benchmark rather than Bentix's own official typographic choice.

Verdict:

- excellent UI reference
- not the right official Bentix typeface

### Final Decision

Bentix official font: `Inter`

Reason:

It delivers the best mix of readability, hierarchy, calmness, web performance, implementation sustainability, and premium enterprise character for long operational sessions.

It is also the implemented production choice across the Bentix platform.

### Official Decision Log

| Item | Decision |
| --- | --- |
| Status | IMPLEMENTED |
| Official Font | `Inter` |
| Reason | Enterprise readability, cross-platform consistency, long-session comfort, open source sustainability, native Next.js optimisation |
| Implementation | `next/font/google` plus shared typography tokens and shared typography classes |

## 3. Font Weights

Bentix should use a narrow, controlled weight system.

Too many weights reduce consistency and introduce unnecessary visual noise.

### Official Weights

- `400` Regular
- `500` Medium
- `600` Demi Bold
- `700` Bold

### Usage Rules

#### 400 Regular

Use for:

- default body text
- longer descriptions
- helper text
- table cell content
- non-critical supporting information

Purpose:

- comfort
- rhythm
- reduced visual aggression

#### 500 Medium

Use for:

- secondary interface emphasis
- placeholders where needed
- metadata requiring slightly more presence
- compact UI text that must remain clear

Purpose:

- subtle emphasis without becoming headline-heavy

#### 600 Demi Bold

Use for:

- form labels
- section titles
- card titles
- table headers
- buttons
- status text that needs structured clarity

Purpose:

- interface authority
- fast scanning

#### 700 Bold

Use for:

- page titles
- main context titles
- KPI values
- critical numerical emphasis
- selected high-priority labels

Purpose:

- hierarchy
- anchor points
- rapid recognition

### Weight Discipline

- Do not use `300`.
- Do not rely on `800` or `900` in normal UI.
- Do not bold text randomly for attention.
- Use hierarchy, spacing, and placement before increasing weight.

## 4. Type Scale

Bentix needs a complete and explicit hierarchy.

The goal is not to maximise variation. The goal is to make each text role unmistakable.

### Official Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
| --- | --- | --- | --- | --- | --- |
| Display | `40px` | `700` | `48px` | `-0.02em` | Large hero context, high-importance page anchor |
| H1 | `34px` | `700` | `40px` | `-0.02em` | Main page title |
| H2 | `28px` | `700` | `34px` | `-0.015em` | Large section title |
| H3 | `24px` | `700` | `30px` | `-0.01em` | Major subsection title |
| H4 | `20px` | `600` | `26px` | `-0.005em` | Subsection or dialog heading |
| Section Title | `18px` | `600` | `24px` | `-0.005em` | Panel and operational section heading |
| Card Title | `16px` | `600` | `22px` | `-0.003em` | Card heading |
| Body | `15px` | `400` | `22px` | `0` | Standard reading text |
| Body Small | `14px` | `400` | `20px` | `0` | Secondary body text |
| Caption | `12px` | `500` | `16px` | `0.01em` | Metadata, timestamps, minor support text |
| Badge | `12px` | `600` | `16px` | `0.02em` | Status badge text |
| Button | `14px` | `600` | `20px` | `0` | Primary and secondary action labels |
| Form Label | `14px` | `600` | `20px` | `0` | Input and field labels |
| Helper Text | `13px` | `400` | `18px` | `0` | Help and validation support text |
| Table Header | `12px` | `600` | `16px` | `0.04em` | Column labels and small structural headers |
| Table Cell | `14px` | `400` | `20px` | `0` | Row content |

### Scale Principles

- Page titles should feel strong but never cinematic.
- Section titles should create structure, not drama.
- Body text should remain comfortable over long sessions.
- Small text should still be readable, never decorative.
- Labels should be concise, controlled, and stable.

### Heading Rules

- Use display only when the page context genuinely deserves strong emphasis.
- H1 should remain the main page-level anchor.
- H2 and H3 should structure complexity.
- H4 and section title should handle most internal product hierarchy.

### All Caps Usage

All caps may be used selectively for:

- small table headers
- compact metadata labels
- status-adjacent structural labels

Rules:

- only at small sizes
- only with controlled letter spacing
- never for body copy
- never for long headings

## 5. Reading Width

Reading width is essential to enterprise usability.

Text that stretches too wide becomes slower and more tiring to read. Text that is too narrow feels fragmented and inefficient.

### Recommended Reading Widths

#### Paragraphs

Ideal width:

- `60` to `75` characters

Use for:

- documentation-style text
- helper blocks
- longer descriptions

#### Forms

Ideal readable content width:

- approximately `480px` to `720px` for grouped form content

Reason:

- labels and inputs remain visually connected
- scanning is faster
- validation and summary context stay close

#### Cards

Ideal content width:

- compact enough to scan in one glance
- wide enough to avoid awkward line breaks

As a principle:

- cards should favour short, immediate reading
- avoid paragraph-length text inside small cards

#### Tables

Tables may exceed ideal reading width when the data model requires it. However:

- text columns should still be controlled
- numeric columns should remain narrow and aligned
- overflow should be deliberate, not accidental

## 6. Numbers

Numbers in Bentix are first-class content.

Users frequently act on:

- hours
- dates
- money
- KPIs
- totals
- counts

Those values must therefore be easier to scan than ordinary body text.

### Hours

Use:

- `600` or `700` when operationally important
- standard body sizing for inline values
- larger sizing for summaries and approvals

Rules:

- keep hour format consistent
- attach unit clearly
- do not hide hours inside low-contrast text

#### Example intent

- row value: readable and stable
- summary value: bold and immediate

### Dates

Dates should feel structured, calm, and explicit.

Rules:

- avoid overly small dates in high-context areas
- use stronger hierarchy when the date is the main page context
- use regular body hierarchy for secondary timestamps

### Money

Money must feel precise and trustworthy.

Rules:

- use consistent number formatting
- align currency values cleanly in comparative contexts
- give strong enough weight to totals and summary values

### Statistics and KPIs

Statistics must be immediately legible.

Rules:

- use larger sizes than surrounding labels
- use `700` in most KPI contexts
- keep labels significantly lighter than values
- avoid decorative styles that compete with interpretation

### Numeric Consistency

Bentix should prefer consistency over typographic novelty.

If two numbers serve the same role, they should look the same across the product.

## 7. Tables

Tables in Bentix should feel disciplined and efficient.

Typography is central to that.

### Table Headers

Use:

- `12px`
- `600`
- `16px` line height
- `0.04em` letter spacing

Purpose:

- structural clarity
- compact scanability
- distinction from body rows

### Table Rows

Use:

- `14px`
- `400`
- `20px` line height

Purpose:

- stable row scanning
- long-session readability

### Alignment

Rules:

- text fields align left
- numeric columns align right where comparison matters
- status or compact action fields may align center only when structurally justified

### Numeric Columns

Numbers should:

- align consistently
- avoid jitter in weight and size
- be visually stronger when financial or approval-critical

Bentix should never make numeric interpretation harder through decorative formatting.

## 8. Forms

Forms should use typography to reduce hesitation.

### Labels

Use:

- `14px`
- `600`
- `20px` line height

Labels should be:

- explicit
- short
- close to their inputs

### Placeholder

Use:

- `14px`
- `400` or `500`
- secondary contrast

Rules:

- placeholder is support, not instruction replacement
- placeholder should never be stronger than the input value

### Validation

Use:

- `13px`
- `400` or `500`
- clear semantic colour

Rules:

- concise wording
- direct meaning
- no technical phrasing unless genuinely necessary

### Help Text

Use:

- `13px`
- `400`
- controlled secondary contrast

Purpose:

- explain
- reassure
- guide

Help text should never become a competing paragraph block unless the complexity of the task truly requires it.

## 9. Dashboard

Bentix dashboards rely heavily on typography to guide scanning.

### Hero

The hero or page context area should use:

- display or H1 scale
- strong structural weight
- enough spacing to create orientation quickly

### Statistics

KPI cards should use:

- a small label
- a visibly stronger value
- no competing decorative text

Recommended pairing:

- label: `12px` or `13px`, `500` or `600`
- value: `28px` to `34px`, `700`

### Cards

Card headings should feel immediate, not oversized.

Recommended direction:

- title: `16px`, `600`
- support text: `13px` or `14px`, `400`

### Widgets

Widgets should follow the same hierarchy logic:

- context
- key value or task
- supporting detail
- optional action

Typography should make that order obvious without relying on heavy decoration.

## 10. Mobile

Mobile typography should preserve hierarchy while reducing density.

It should not simply scale everything down uniformly.

### Mobile Principles

- keep the most important context large
- reduce less important type first
- preserve comfortable touch readability
- maintain label clarity
- avoid overly small metadata

### Mobile Adaptation Rules

- display and H1 can reduce modestly, not dramatically
- body text should remain readable without zoom
- labels and buttons must remain clear at touch distance
- tables or dense operational rows may shift layout, but typography should remain consistent in role

### Mobile Comfort

On mobile, Bentix should still feel like an enterprise tool, but one that respects limited screen space and short attention windows.

## 11. Accessibility

Typography accessibility is not optional in Bentix.

### Contrast

Text must maintain strong contrast against background and surface colours.

Rules:

- body text must never appear washed out
- labels must not be too pale on light cards
- small text must have stronger contrast than marketing-style UI would tolerate

### Minimum Sizes

Recommended practical minimums:

- body and form text: `14px` minimum
- helper and validation text: `13px` minimum
- caption: `12px` minimum

Bentix should avoid routinely dropping below these values.

### Zoom

Typography must remain usable under browser zoom.

That means:

- hierarchy survives zoom
- text wraps safely
- controls remain associated with labels
- no overlap or hidden context

### Long Sessions

Typography should support long use by:

- keeping contrast stable
- avoiding excessively small text
- using moderate line height
- avoiding visual aggression in headings
- reducing unnecessary font variation

## 12. Do Not

Bentix typography should never fall into these mistakes:

- too many font sizes
- random bold text
- all caps abuse
- low contrast text
- too many font weights
- decorative headline styling
- tiny helper text
- oversized hero text with weak content hierarchy
- inconsistent table headers
- mixing multiple typographic personalities across modules
- using typography to decorate instead of inform

If the user has to work harder to interpret text, the typography is wrong.

## 13. Migration Strategy

Bentix should adopt the typography system progressively.

No big-bang redesign is required.

### Phase 1. Foundation

- align page titles
- align section titles
- align card label and value pairings
- normalize table headers and cells

### Phase 2. High-Usage Operational Areas

Apply the typography system to:

- Daily Planning
- Daily Hours
- Hours Approval
- People
- Works
- Clients
- Materials

### Phase 3. Interaction Consistency

- normalize button labels
- normalize form labels and helper text
- normalize badge and status typography

### Phase 4. Responsive Refinement

- fine-tune mobile and tablet type hierarchy
- ensure zoom and wrapping safety
- remove remaining oversized or undersized legacy text

### Migration Rules

- do not change business logic while applying typography
- do not introduce module-specific text systems
- do not add new weights or sizes without updating this guide
- use shared roles, not local approximations

## 14. Final Summary

After a full working day inside Bentix, the typography should feel:

- calm
- highly readable
- orderly
- low-friction
- non-fatiguing
- professionally structured

It should help users recognize what matters without consciously thinking about type at all.

That is the goal.

The best Bentix typography is typography that makes work feel faster, clearer, and lighter.
