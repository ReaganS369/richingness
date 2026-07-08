# Design System Specification

## Colors
We use a unified dark-mode-first color palette. The baseline colors feel premium, clean, and modern.

### Base Colors
- `bg`: Deep space midnight (`#08080F`)
- `surface`: Card background (`#111118`)
- `surfaceRaised`: Modals and dropdown overlays (`#191924`)
- `border`: Dark border accent (`#252535`)

### Brand Colors (Rich Violet)
- `primary`: `#7C5CFC`
- `primaryLight`: `#A78BFA`
- `primaryDark`: `#5B3FD4`
- `primaryGlow`: `rgba(124, 92, 252, 0.15)`

### Semantic Status
- `success`: Growth, positive cashflow (`#22D3A5`)
- `warning`: Upcoming dues, caution warnings (`#F59E0B`)
- `danger`: Deficit budget, past due bills (`#EF4444`)
- `info`: Information banners (`#3B82F6`)

## Typography
- **Display font**: `Outfit` (used for balances, headings, and numbers)
- **Body font**: `Inter` (used for standard labels, copy, buttons, and navigation)
- **Monospace font**: `JetBrains Mono` (used for code values and decimal formatting alignments)

## Scales

### Spacing Scale (4px base)
- `xs`: 4px | `sm`: 8px | `md`: 12px | `lg`: 16px | `xl`: 20px | `2xl`: 24px | `3xl`: 32px | `4xl`: 40px

### Radius Scale
- `sm`: 4px | `md`: 8px | `lg`: 12px | `xl`: 16px | `full`: 9999px

### Shadow Scale
- `low`: Minimal offset elevation.
- `medium`: Smooth standard modal shadow.
- `high`: Deep, intense card hover elevation.

### Motion Easing
- `standard`: `cubic-bezier(0.4, 0, 0.2, 1)`
- `decelerate`: `cubic-bezier(0, 0, 0.2, 1)`
- `spring`: `cubic-bezier(0.34, 1.56, 0.64, 1)`
