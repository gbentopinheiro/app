# Bentix Button System

This document defines the official shared button system for Bentix.

Status: `IMPLEMENTED`

The goal of this system is not to redesign every page immediately. The goal is to establish one clear, reusable, enterprise-grade button foundation that future UI migrations can adopt progressively.

## Table of Contents

- [1. Philosophy](#1-philosophy)
- [2. Hierarchy](#2-hierarchy)
- [3. Button Types](#3-button-types)
- [4. Sizes](#4-sizes)
- [5. Shared Tokens](#5-shared-tokens)
- [6. Interaction States](#6-interaction-states)
- [7. Icon Buttons](#7-icon-buttons)
- [8. Usage Rules](#8-usage-rules)
- [9. Do and Do Not](#9-do-and-do-not)
- [10. Accessibility](#10-accessibility)
- [11. Migration Strategy](#11-migration-strategy)
- [12. Official Decision Log](#12-official-decision-log)

## 1. Philosophy

Bentix buttons are operational controls, not decorative elements.

They must feel:

- professional
- corporate
- premium
- stable
- easy to scan

The button system follows the broader Bentix design direction:

- one typography system
- limited brand palette
- strong hierarchy
- subtle interaction
- consistency over novelty

Bentix should feel like enterprise product software, not a marketing website.

## 2. Hierarchy

Every page or major section should communicate action priority immediately.

The intended order is:

1. Primary action
2. Secondary action
3. Ghost action
4. Danger action when necessary

There should normally be only one visually dominant primary action in a major section.

## 3. Button Types

### Primary

Purpose:

- publish
- save
- create
- approve

Visual rules:

- Bentix Orange solid background
- white text
- medium radius
- soft shadow
- clear but subtle hover and focus
- no gradients

### Secondary

Purpose:

- cancel
- back
- edit
- copy previous

Visual rules:

- white background
- Bentix Navy border
- Bentix Navy text

### Ghost

Purpose:

- low-priority utility actions
- supportive actions that should not compete with primary or secondary controls

Visual rules:

- transparent background
- no visible border
- Bentix Navy text
- subtle hover background only

### Danger

Purpose:

- delete
- remove
- reset

Visual rules:

- white background
- danger border
- danger text

Filled danger buttons are intentionally not part of the default system and should be used only with explicit design review.

## 4. Sizes

The official system defines three sizes only.

| Size | Height | Typical Usage |
| --- | --- | --- |
| Small | `36px` | Dense utility contexts |
| Medium | `44px` | Standard default |
| Large | `52px` | High-emphasis actions and spacious layouts |

Arbitrary button heights should be avoided.

## 5. Shared Tokens

The shared button foundation is implemented in `app/globals.css`.

### Layout and Motion

- `--btx-button-height-sm`
- `--btx-button-height-md`
- `--btx-button-height-lg`
- `--btx-button-padding-inline-sm`
- `--btx-button-padding-inline-md`
- `--btx-button-padding-inline-lg`
- `--btx-button-radius`
- `--btx-button-radius-icon`
- `--btx-button-gap`
- `--btx-button-shadow-soft`
- `--btx-button-shadow-subtle`
- `--btx-button-shadow-hover`
- `--btx-button-transition`

### Shared State

- `--btx-button-focus-ring`
- `--btx-button-disabled-background`
- `--btx-button-disabled-border`
- `--btx-button-disabled-text`

### Primary Variant

- `--btx-button-primary-background`
- `--btx-button-primary-border`
- `--btx-button-primary-text`
- `--btx-button-primary-hover-background`
- `--btx-button-primary-hover-border`
- `--btx-button-primary-active-background`
- `--btx-button-primary-active-border`

### Secondary Variant

- `--btx-button-secondary-background`
- `--btx-button-secondary-border`
- `--btx-button-secondary-text`
- `--btx-button-secondary-hover-background`
- `--btx-button-secondary-hover-border`
- `--btx-button-secondary-active-background`
- `--btx-button-secondary-active-border`

### Ghost Variant

- `--btx-button-ghost-background`
- `--btx-button-ghost-border`
- `--btx-button-ghost-text`
- `--btx-button-ghost-hover-background`
- `--btx-button-ghost-hover-border`
- `--btx-button-ghost-active-background`
- `--btx-button-ghost-active-border`

### Danger Variant

- `--btx-button-danger-background`
- `--btx-button-danger-border`
- `--btx-button-danger-text`
- `--btx-button-danger-hover-background`
- `--btx-button-danger-hover-border`
- `--btx-button-danger-active-background`
- `--btx-button-danger-active-border`

## 6. Interaction States

### Hover

Hover should be subtle.

Allowed signals:

- small background adjustment
- subtle shadow change
- slight lift

Disallowed signals:

- dramatic motion
- aggressive glow
- exaggerated scaling

### Focus

Buttons must show a visible focus ring.

The current foundation uses a shared Bentix focus token and does not rely on browser defaults alone.

### Disabled

Disabled buttons must:

- look clearly inactive
- stop hover motion
- use neutral disabled colours
- avoid orange emphasis

### Loading

Loading must not cause layout shift.

The shared component preserves button width and overlays the loading spinner instead of changing the measured label width.

## 7. Icon Buttons

Icon buttons are utility buttons with square dimensions and consistent spacing.

Rules:

- perfect square
- same size system as text buttons
- same focus and hover logic
- no arbitrary padding
- no random circular pills without system justification

Icon buttons should still choose a hierarchy variant:

- secondary icon button
- ghost icon button
- danger icon button

## 8. Usage Rules

- Use primary only for the main action of the current context.
- Use secondary for clear alternative actions.
- Use ghost for supportive actions that should not compete visually.
- Use danger only for genuinely destructive operations.
- Keep action groups close to the content they affect.
- Do not make multiple buttons look primary in the same section unless the workflow has explicit design approval.

## 9. Do and Do Not

### Do

- keep one clear primary action
- use the official sizes only
- keep hover and focus subtle but visible
- preserve readable contrast
- use the shared component or shared classes where possible

### Do Not

- redesign every page ad hoc
- introduce gradients in normal buttons
- use orange for secondary actions
- mix multiple button styles in the same area
- hide focus states
- create page-specific button systems without updating the Bentix Design System

## 10. Accessibility

The Bentix Button System must support:

- WCAG AA contrast
- keyboard navigation
- visible focus states
- readable disabled states
- non-colour-only communication when context is critical

Primary orange buttons must remain readable with white text, and secondary / danger buttons must preserve clear border and text contrast against white or light-neutral surfaces.

## 11. Migration Strategy

The button system is intentionally implemented as a shared foundation first.

Current implementation scope:

- shared button tokens in `app/globals.css`
- shared button classes
- reusable `BentixButton` component
- safe migration of selected shared components only

Out of scope for this phase:

- mass replacement of page-level button styles
- redesign of existing workflows
- page-by-page visual cleanup

Future migration phases should progressively move pages and modules onto the shared button system as part of targeted UI work.

## 12. Official Decision Log

| Item | Decision |
| --- | --- |
| Status | IMPLEMENTED |
| Shared Component | `BentixButton` |
| Shared Foundation | `app/globals.css` button tokens and classes |
| Default Hierarchy | Primary, Secondary, Ghost, Danger |
| Default Sizes | Small, Medium, Large |
| Migration Model | Progressive, no mass rewrite |
