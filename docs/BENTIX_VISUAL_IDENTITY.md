# Bentix Visual Identity

This document defines the official brand and visual identity of Bentix.

It is not a screen redesign document and it is not a component implementation guide. Its role is to establish the visual direction that should guide every future UI, UX, layout, product, and design system decision across the Bentix platform.

This guide complements the existing [BENTIX_DESIGN_SYSTEM.md](./BENTIX_DESIGN_SYSTEM.md). The Design System explains reusable patterns and interface rules. This document defines the visual character, brand logic, and aesthetic discipline that those patterns must follow.

## Table of Contents

- [1. Brand Personality](#1-brand-personality)
- [2. Design Philosophy](#2-design-philosophy)
- [3. Official Colour Palette](#3-official-colour-palette)
- [4. Typography](#4-typography)
- [5. Spacing Philosophy](#5-spacing-philosophy)
- [6. Corner Radius](#6-corner-radius)
- [7. Elevation](#7-elevation)
- [8. Icons](#8-icons)
- [9. Buttons](#9-buttons)
- [10. Inputs](#10-inputs)
- [11. Cards](#11-cards)
- [12. Tables](#12-tables)
- [13. Forms](#13-forms)
- [14. Dashboard Philosophy](#14-dashboard-philosophy)
- [15. Motion](#15-motion)
- [16. Accessibility](#16-accessibility)
- [17. Responsive Philosophy](#17-responsive-philosophy)
- [18. Do Not](#18-do-not)
- [19. Visual Evolution Roadmap](#19-visual-evolution-roadmap)
- [20. Final Summary](#20-final-summary)

## 1. Brand Personality

Bentix should feel:

- Professional
- Reliable
- Operational
- Modern
- Clear
- Robust
- Minimal
- Calm
- Fast
- Controlled

Bentix is not playful, decorative, trendy, or expressive for its own sake.

It is a platform for people who make operational decisions, track work, manage teams, approve hours, and coordinate execution throughout long working days. Its visual identity must therefore communicate confidence, order, and endurance.

If a user spends eight or ten hours inside Bentix, the interface should still feel stable, legible, and mentally light.

## 2. Design Philosophy

Bentix follows an enterprise product philosophy, not a marketing website philosophy.

Core principles:

- Less decoration, more hierarchy.
- Less novelty, more consistency.
- Less visual noise, more operational clarity.
- One primary action at a time.
- Whitespace is functional, not ornamental.
- Structure should do most of the work.
- The product should feel deliberate, not flashy.

Practical meaning:

- Users should understand the page context in seconds.
- The main action should be obvious without shouting.
- Secondary actions should remain available without competing.
- Information density is acceptable when the hierarchy is strong.
- Beauty in Bentix comes from order, spacing, rhythm, and contrast rather than visual effects.

Bentix should feel closer to Linear, Stripe Dashboard, Notion, and high-quality internal enterprise tools than to consumer apps or marketing-heavy SaaS products.

## 3. Official Colour Palette

Bentix must use a restrained palette. The brand should be recognizable with very few colours used with discipline.

### Official Palette

| Token | Value | Role |
| --- | --- | --- |
| Primary | `#B85E00` | Primary action colour |
| Primary Hover | `#AF5A00` | Hover and pressed state for primary action |
| Primary Light | `#FFF1E3` | Soft emphasis, selected support states, gentle action framing |
| Text Primary | `#102E49` | Main text and structural dark UI tone |
| Text Secondary | `#556C86` | Secondary text, metadata, support labels |
| Background | `#F6F8FA` | Main page background |
| Surface | `#FFFFFF` | Cards, panels, forms, content surfaces |
| Border | `#DCE4EA` | Subtle blue-neutral separators and control borders |
| Success | `#1F7A45` | Confirmed, approved, successful outcomes |
| Warning | `#B7791F` | Caution, draft attention, operational warnings |
| Danger | `#B42318` | Destructive actions, errors, high-risk states |
| Info | `#1D4ED8` | Informational emphasis, neutral guidance, support state |

### Structural Blue

Bentix should use a deep dark blue for text and interface structure instead of relying on dark grey or black as the dominant UI anchor.

Recommended structural blues:

- Bentix Navy: `#183B5B`
- Bentix Navy Strong: `#102E49`

This colour gives Bentix a more distinctive and more enterprise-grade character than neutral grey. It feels more deliberate, more controlled, and more premium without becoming cold.

### Why These Colours

#### Primary: `#B85E00`

Bentix Orange remains the primary action colour because it creates immediate action recognition and gives the product an operational signature while remaining readable with white text in operational interfaces.

Why it works:

- visible without being neon
- energetic without feeling playful
- highly scannable on light surfaces
- clearly different from structural and informational tones

#### Primary Hover: `#AF5A00`

The hover state is slightly deeper and warmer rather than darker in a muddy way. It keeps the action feeling active and premium.

#### Primary Light: `#FFF1E3`

This supports highlights, soft selected states, contextual accents, and gentle action framing without creating visual aggression.

#### Text Primary: `#102E49`

This is the most important identity decision. Bentix should not use dark grey as its dominant visual anchor. A deep blue gives the product a stronger, more ownable, and more enterprise-specific tone.

#### Text Secondary: `#556C86`

Bentix needs softer text for labels, metadata, helper context, and less important content. This blue-grey stays within the same family and preserves cohesion.

#### Background: `#F6F8FA`

The background should feel neutral, calm, and comfortable for long sessions. It should reduce glare without becoming beige, decorative, or visually noisy.

#### Surface: `#FFFFFF`

Surface colour should remain clean and highly readable, with light neutral backgrounds providing enough separation without turning the product into a marketing-style UI.

#### Border: `#DCE4EA`

Bentix should prefer subtle blue-neutral borders over heavy outlines. Borders should separate, not dominate.

#### Success: `#1F7A45`

This green communicates confirmation and trust. It should feel stable and measured, not celebratory.

#### Warning: `#B7791F`

Warnings should be visible and serious without immediately reading as destructive. This amber tone is suitable for draft-related or pending operational states.

#### Danger: `#B42318`

Danger should be used sparingly and only where consequence is real. Bentix must never dilute red by using it for normal attention states.

#### Info: `#1D4ED8`

Info should remain distinct from primary action orange. Blue is the right informational partner because it supports orientation and neutral guidance without competing with action emphasis.

### Palette Rules

- Use blue for structure.
- Use orange for action.
- Use white and light-neutral surfaces for comfort.
- Use semantic colours only for meaning.
- Avoid introducing page-specific accent colours.
- No critical meaning should depend on colour alone.

For the implemented token names, compatibility aliases, semantic state rules, and migration strategy, see [BENTIX_COLOR_SYSTEM.md](./BENTIX_COLOR_SYSTEM.md).

## 4. Typography

### Official Font

Bentix official typeface: `Inter`

### Why Inter

`Inter` is the official Bentix typeface because it is:

- open source and operationally sustainable
- highly readable at interface sizes
- clean without feeling sterile
- modern without looking trendy
- optimized for enterprise UI
- optimized for web and PWA contexts
- excellent for Next.js integration through `next/font/google`
- strong in both labels and headings
- comfortable over long working sessions
- consistent across Windows, macOS, Linux, Android, and iOS

It supports the Bentix personality well: precise, professional, calm, and contemporary.

### Typographic Intent

Bentix typography should feel:

- controlled
- readable
- neutral
- structured

Typography should not be expressive in a branding-first way. It should reduce friction and strengthen clarity.

### Guidance

- Headlines should establish context immediately.
- Section titles should be unmistakable.
- Labels should be compact and legible.
- Card values should be visually stronger than their labels.
- Body text should never feel light or faint in operational views.

For the complete typography specification, implementation philosophy, and hierarchy rules, see the [Bentix Typography Guide](./BENTIX_TYPOGRAPHY_GUIDE.md).

### Official Decision Log

| Item | Decision |
| --- | --- |
| Status | IMPLEMENTED |
| Official Font | `Inter` |
| Reason | Enterprise readability, cross-platform consistency, long-session comfort, open source sustainability, native Next.js optimisation |
| Implementation | `next/font/google` |

## 5. Spacing Philosophy

Spacing in Bentix is operational spacing.

It is not decorative breathing room. It is how the product creates clarity, reduces confusion, and prevents visual collisions.

### Official Spacing Scale

- `4px` micro alignment
- `8px` tight internal spacing
- `12px` compact grouping
- `16px` default control spacing
- `24px` section spacing
- `32px` major block spacing
- `40px` page rhythm spacing
- `48px` hero and structural separation

### Philosophy

- Small spacing is for relationship.
- Medium spacing is for grouping.
- Large spacing is for hierarchy.

Bentix should avoid both extremes:

- cramped density that feels stressful
- over-spaced layouts that waste vertical space

The right Bentix spacing should make the interface feel efficient and breathable at the same time.

## 6. Corner Radius

Bentix should use rounded corners with restraint and consistency.

The product should feel contemporary, but not toy-like.

### Official Radius System

- Buttons: `12px`
- Cards: `20px`
- Inputs: `12px`
- Dialogs: `24px`

### Guidance

- Buttons should feel controlled, not pill-shaped by default.
- Cards should feel soft and modern.
- Dialogs can be slightly more generous to distinguish them as layered surfaces.
- Radius should be a system, not a page-by-page preference.

Pill shapes should be reserved for specific compact actions or status chips when they serve a clear purpose. Bentix should avoid turning every control into a pill.

## 7. Elevation

Bentix should use subtle elevation to organize surfaces.

Shadows are not decoration. They are a depth and hierarchy tool.

### Elevation Levels

#### Card Shadow

Use for default content cards and summary cards.

Intent:

- soft
- wide
- low contrast

#### Hover Shadow

Use only for interactive surfaces that benefit from tactile feedback.

Intent:

- minimal lift
- barely stronger than resting state
- no dramatic glow

#### Modal Shadow

Use for dialogs, overlays, and floating contextual panels.

Intent:

- clearly above the page
- still soft
- clean edge separation

### Shadow Philosophy

- Heavy shadows are not part of Bentix.
- Blurry atmospheric depth is preferred over hard dark shadows.
- Border and contrast should do more work than shadow alone.

## 8. Icons

### Official Icon Family

Recommended icon family: `Lucide`

### Why Lucide

Lucide fits Bentix because it is:

- clean
- geometric
- lightweight
- enterprise-friendly
- highly legible at small sizes

It supports the Bentix tone better than highly decorative or overly rounded icon families.

### Recommended Sizes

- `16px` for inline utility icons
- `18px` for default action icons
- `20px` for standard toolbar icons
- `24px` for larger navigation or hero support icons

### Icon Rules

- Prefer outline icons over filled icons for general UI.
- Keep stroke weight visually consistent.
- Use icons to support labels, not replace them in operational areas.
- Avoid mixing multiple icon families.

Until a unified icon migration happens, existing custom icons may remain in place, but future work should move toward one official family.

## 9. Buttons

Buttons in Bentix must communicate priority instantly.

### Primary

Use for the one key action of the page or flow.

Style:

- Bentix Orange fill
- white text
- strong contrast

### Secondary

Use for useful but non-final actions.

Style:

- white or surface background
- orange outline
- orange text

### Danger

Use only for destructive actions.

Style:

- red outline or red emphasis
- clear danger meaning

### Ghost

Use for subtle utility actions within dense interfaces.

Style:

- no strong fill
- minimal border or no border
- dark blue or muted text

### Icon

Use only when the action is universally clear in context or paired with assistive labeling.

### Button Philosophy

- There should be one obvious primary action.
- Secondary actions should never visually overpower the primary one.
- Disabled buttons must look genuinely disabled.
- Bentix should avoid decorative button styles.

## 10. Inputs

Inputs in Bentix should feel solid, clean, and unambiguous.

### Official Direction

- Height: medium, comfortable, enterprise-grade
- Border: soft but visible
- Focus: clear and calm
- Placeholder: secondary, never primary guidance

### Input Principles

- Inputs should not disappear into the background.
- Borders should remain visible even on light surfaces.
- Focus states must be obvious without being loud.
- Placeholder text should never replace labels.

### Bentix Input Character

Inputs should feel:

- practical
- neutral
- trustworthy
- easy to scan in groups

## 11. Cards

Cards are a central part of Bentix visual identity.

### Card Types

#### Page Panels

Used to group major page sections.

Characteristics:

- soft surface
- medium shadow
- generous radius

#### Summary Cards

Used for counts, status, and high-priority metrics.

Characteristics:

- high value contrast
- compact label hierarchy
- immediate readability

#### Operational Cards

Used for work items, planning units, lists, and execution-focused objects.

Characteristics:

- compact but not cramped
- clear heading
- resilient to long content

#### Dialog Cards

Used for overlays and focused decisions.

Characteristics:

- stronger separation
- clearer elevation
- simplest possible layout

### Card Rules

- Cards should not rely on excessive colour.
- Content should wrap safely.
- A card must communicate its role within seconds.
- Visual consistency matters more than local invention.

## 12. Tables

Bentix tables should follow an enterprise table philosophy.

That means:

- dense but readable
- predictable columns
- strong row scanning
- controlled horizontal overflow only when necessary

### Table Philosophy

- Use tables when comparison matters.
- Use cards when individuality matters.
- Use horizontal scroll only when the data model truly requires it.
- Prefer readable line height over squeezing too much into one row.

### Table Rules

- Headers should be clear and stable.
- Numeric values should align cleanly.
- Actions should be grouped consistently.
- Long text should wrap or truncate deliberately, never break the layout randomly.

Bentix should avoid fake table layouts that collapse unpredictably on narrower screens.

## 13. Forms

Forms in Bentix should feel structured, fast, and low-risk.

### Form Philosophy

- Group by meaning, not by database shape.
- Keep related inputs visually together.
- Show the summary context early.
- Avoid long unstructured form columns when grouping helps understanding.

### Rules

- Labels always visible.
- Validation simple and direct.
- One section should equal one mental topic.
- Actions should appear where the user expects them.

Forms should feel like guided operational data entry, not like a raw admin backend.

## 14. Dashboard Philosophy

Bentix dashboards should feel like command surfaces.

Not noisy. Not overly visual. Not presentation-first.

### A Bentix Dashboard Should Feel

- organized
- calm
- high-signal
- fast to scan
- ready for action

### Dashboard Rules

- Context first.
- Key metrics second.
- Work surfaces third.
- Secondary tools last.

Dashboards should not try to impress through decoration. They should earn trust through clarity and control.

## 15. Motion

Motion in Bentix must be subtle.

### Motion Principles

- short
- meaningful
- calm
- never attention-seeking

### Recommended Timing

- hover transitions: `120ms` to `160ms`
- popovers and small overlays: `150ms` to `180ms`
- modal or surface transitions: `180ms` to `220ms`

### Motion Usage

- hover lift
- focus transitions
- popover entry
- dialog appearance
- lightweight feedback on interactive cards

### Bentix Must Avoid

- bouncy animations
- dramatic spring motion
- long fades
- playful loading sequences
- animation as decoration

## 16. Accessibility

Accessibility is part of the visual identity because legibility and control are part of the brand promise.

### Accessibility Rules

- strong text contrast
- visible keyboard focus
- touch-friendly control sizes
- colour never as the only signal
- consistent language
- reliable interaction states

### Bentix Accessibility Intent

The product should feel usable, not merely compliant.

A user should not need visual effort to understand:

- where they are
- what matters
- what is clickable
- what is disabled
- what is successful
- what is dangerous

## 17. Responsive Philosophy

Bentix is not designed for one ideal screen.

It must feel intentional across real working conditions.

### Desktop

Use width well. Show multiple related zones when helpful. Keep strong hierarchy.

### Laptop

This is a primary target, not a fallback. Layouts must remain efficient and readable around 1366px widths.

### Tablet

Layouts should wrap cleanly. Controls must remain touch-friendly. Split views should collapse gracefully.

### Mobile

Show one clear column when needed. Preserve essential actions. Avoid tiny dense controls. Use content order to preserve context.

### Ultrawide

Use more width, but not infinitely. The page should scale with discipline. Wide screens should gain structure, not emptiness.

### Responsive Rules

- no fixed monitor assumptions
- no unnecessary nested scroll areas
- no accidental horizontal overflow
- no unreadable dense control clusters
- no page should become visually broken just because width changes

## 18. Do Not

Bentix should avoid:

- too many colours
- too many fonts
- rounded pills everywhere
- heavy shadows
- gradient abuse
- inconsistent buttons
- decorative icon mixing
- weak contrast
- oversized empty hero sections
- arbitrary page-specific layouts
- English user-facing text mixed into Portuguese interfaces
- thin grey text on light cards
- mobile treated as an afterthought
- consumer-app gimmicks in operational workflows

If a design decision looks impressive but reduces speed, clarity, or consistency, it is probably wrong for Bentix.

## 19. Visual Evolution Roadmap

Bentix should adopt this identity progressively, not through a single disruptive redesign.

### Phase 1. Foundation

- align page shells
- align spacing rhythm
- align width behaviour
- align card and panel structure

### Phase 2. Action Hierarchy

- apply one-primary-action rule consistently
- reduce visual competition
- normalize secondary and danger actions

### Phase 3. Core Primitives

- formalize page, content, section, grid, card, badge, and popover primitives
- remove local visual inventions

### Phase 4. Module Migration

Migrate high-usage operational areas first:

- Daily Planning
- Daily Hours
- Hours Approval
- People
- Works
- Clients
- Materials

### Phase 5. Mobile and PWA Polish

- align mobile surfaces with the same identity
- preserve clarity under smaller viewports
- make installable mobile routes feel like part of one product

### Migration Rule

No full redesign is required before improvement begins.

Every future UI refactor should adopt this identity in a controlled way, without breaking workflows or introducing inconsistent local interpretations.

## 20. Final Summary

After using Bentix for an entire working day, a user should feel:

- oriented
- in control
- mentally unburdened
- confident in the product
- able to move quickly without rushing
- supported by structure rather than distracted by interface

Bentix should not feel noisy, fragile, trendy, or over-designed.

It should feel like a serious operational platform with modern standards, strong discipline, and visual clarity that holds up over time.

That is the official Bentix visual identity.
