# Bentix Color System

This document defines the official colour foundation of the Bentix Design System.

Status: `IMPLEMENTED`

It describes the shared tokens, intended usage, compatibility aliases, and migration rules that support the current Bentix interface without requiring a mass page rewrite.

## Table of Contents

- [1. Purpose](#1-purpose)
- [2. Official Palette](#2-official-palette)
- [3. Core Tokens](#3-core-tokens)
- [4. Semantic Tokens](#4-semantic-tokens)
- [5. Usage Rules](#5-usage-rules)
- [6. Prohibited Usage](#6-prohibited-usage)
- [7. Legacy Compatibility](#7-legacy-compatibility)
- [8. Accessibility Rules](#8-accessibility-rules)
- [9. Progressive Migration Strategy](#9-progressive-migration-strategy)
- [10. Official Decision Log](#10-official-decision-log)

## 1. Purpose

Bentix uses a deliberately limited palette.

The goal is not decorative variety. The goal is operational clarity, long-session comfort, and a professional product character that feels consistent across the entire application.

The shared colour system is built around three foundations:

1. Bentix Navy for structure, text, headings, and corporate identity.
2. Bentix Orange for primary actions and deliberate emphasis.
3. White and light-neutral surfaces for calm, readability, and visual control.

Success, warning, danger, and info colours are semantic states. They are not brand colours.

## 2. Official Palette

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Bentix Navy | `--btx-color-navy` | `#183B5B` | Structure, headings, identity |
| Bentix Navy Strong | `--btx-color-navy-strong` | `#102E49` | Primary text, stronger structural emphasis |
| Bentix Navy Soft | `--btx-color-navy-soft` | `#EAF1F6` | Highlight backgrounds, soft selection states |
| Primary Action | `--btx-color-primary` | `#B85E00` | Primary buttons and intentional emphasis |
| Primary Hover | `--btx-color-primary-hover` | `#AF5A00` | Hover state for primary actions |
| Primary Active | `--btx-color-primary-active` | `#A85700` | Pressed state for primary actions |
| Primary Soft | `--btx-color-primary-soft` | `#FFF1E3` | Soft emphasis and selected support states |
| Background | `--btx-color-background` | `#F6F8FA` | Global application background |
| Surface | `--btx-color-surface` | `#FFFFFF` | Panels, cards, forms, dialogs |
| Surface Subtle | `--btx-color-surface-subtle` | `#F7FAFC` | Secondary surface separation |
| Text Primary | `--btx-color-text-primary` | `#102E49` | Default body text and strong headings |
| Text Secondary | `--btx-color-text-secondary` | `#556C86` | Labels, metadata, secondary text |
| Text Muted | `--btx-color-text-muted` | `#60758E` | Support text, quieter UI text |
| Text Inverse | `--btx-color-text-inverse` | `#FFFFFF` | Text on dark or primary action backgrounds |
| Border | `--btx-color-border` | `#DCE4EA` | Default borders and separators |
| Border Strong | `--btx-color-border-strong` | `#C8D3DC` | Stronger borders when needed |
| Focus | `--btx-color-focus` | `rgba(24, 59, 91, 0.28)` | Shared focus ring and focus outline |

## 3. Core Tokens

The official shared tokens live in `app/globals.css`.

### Brand and Structure

- `--btx-color-navy`
- `--btx-color-navy-strong`
- `--btx-color-navy-soft`

### Action

- `--btx-color-primary`
- `--btx-color-primary-hover`
- `--btx-color-primary-active`
- `--btx-color-primary-soft`

### Surfaces

- `--btx-color-background`
- `--btx-color-surface`
- `--btx-color-surface-subtle`

### Text

- `--btx-color-text-primary`
- `--btx-color-text-secondary`
- `--btx-color-text-muted`
- `--btx-color-text-inverse`

### Borders and Focus

- `--btx-color-border`
- `--btx-color-border-strong`
- `--btx-color-focus`

## 4. Semantic Tokens

Semantic tokens exist for meaning only.

| Role | Token | Value | Soft Token | Soft Value |
| --- | --- | --- | --- | --- |
| Success | `--btx-color-success` | `#1F7A45` | `--btx-color-success-soft` | `#EBF7EF` |
| Warning | `--btx-color-warning` | `#B7791F` | `--btx-color-warning-soft` | `#FFF4E5` |
| Danger | `--btx-color-danger` | `#B42318` | `--btx-color-danger-soft` | `#FEF3F2` |
| Info | `--btx-color-info` | `#1D4ED8` | `--btx-color-info-soft` | `#EBF2FF` |

These colours should communicate:

- success: confirmed, approved, safe
- warning: pending, draft, caution
- danger: destructive, failed, high-risk
- info: neutral guidance and informational emphasis

## 5. Usage Rules

### Bentix Navy

Use navy for:

- page structure
- headings
- primary text
- strong UI framing
- corporate identity moments

Do not use unrelated decorative blues across the product.

### Bentix Orange

Use orange for:

- one clear primary action per page or major section
- intentional emphasis
- selected high-priority action states

Do not use orange for large background areas, dense content panels, or ordinary text.

### White and Light Neutral

Use white and light neutrals for:

- application backgrounds
- panels
- cards
- forms
- calm reading surfaces

Bentix should feel like operational software, not a marketing landing page.

## 6. Prohibited Usage

Do not:

- use semantic colours as decoration
- use multiple unrelated blues in the same area
- introduce black as the main text colour
- rely on pale text over pale surfaces
- create page-specific accent systems without updating the Bentix Design System
- make orange the dominant background colour of a page
- use gradients as the default colour treatment of everyday components

## 7. Legacy Compatibility

Bentix still contains a broad set of existing `--vp-*` variables across pages and components.

To avoid regression risk during migration, the shared foundation keeps compatibility aliases.

### Current Compatibility Aliases

| Legacy Token | Alias Target |
| --- | --- |
| `--vp-text` | `--btx-color-text-primary` |
| `--vp-text-muted` | `--btx-color-text-secondary` |
| `--vp-text-soft` | `--btx-color-text-muted` |
| `--vp-border` | `--btx-color-border` |
| `--vp-border-strong` | `--btx-color-border-strong` |
| `--vp-accent` | `--btx-color-primary` |
| `--vp-accent-strong` | `--btx-color-primary-hover` |
| `--vp-surface` | `--btx-color-surface` |
| `--vp-surface-alt` | `--btx-color-surface-subtle` |
| `--vp-surface-muted` | `--btx-color-surface-subtle` |
| `--vp-highlight` | `--btx-color-navy-soft` |
| `--vp-highlight-text` | `--btx-color-navy-strong` |

These aliases allow the application to migrate progressively rather than through a risky mass colour rewrite.

## 8. Accessibility Rules

The colour system must preserve readability under real working conditions.

Rules:

- primary body text must meet WCAG AA against default surfaces
- secondary and muted text must remain clearly readable
- orange primary actions must remain readable with white text
- focus indicators must remain obvious
- colour must never be the only way to communicate critical state
- status colours should be paired with copy, iconography, or layout cues when needed

## 9. Progressive Migration Strategy

Bentix Design Tokens V1 intentionally updates the shared foundation first.

This phase includes:

- global colour tokens in `app/globals.css`
- compatibility aliases for existing `--vp-*` variables
- shared body background and default text colour
- shared surface and border defaults where already centrally controlled
- documentation alignment

This phase does not require:

- rewriting every page colour
- replacing every hardcoded colour immediately
- redesigning components or layouts

Future migration phases should progressively remove hardcoded colours from:

- page-level inline styles
- component-specific gradients
- developer-only tools
- legacy highlights and status treatments

## 10. Official Decision Log

| Item | Decision |
| --- | --- |
| Status | IMPLEMENTED |
| Official Structural Colour | `#183B5B` / `#102E49` |
| Official Action Colour | `#B85E00` |
| Official Background Strategy | `#F6F8FA` background with white / light-neutral surfaces |
| Legacy Compatibility | Preserved through `--vp-*` aliases |
| Implementation | `app/globals.css` and `app/layout.js` shared colour foundation |
