# Design Direction (DESIGN.md)

## Product Identity & Audience
- **Name:** Inai (A digital helper that gently takes care of Mom's daily routine)
- **Target Audience:** A mother around 55 years old managing maintenance medicines, meals, and blood pressure.
- **Atmosphere & Emotional Direction:** Warmth, care, trust, calmness, familiarity, comfort, maturity, and simplicity.
- **What it is NOT:** A hospital management system, clinical medical dashboard, SaaS template, fitness tracker, or flashy startup app.

## Dials
Dial: ENERGY 1 / RHYTHM 2 / MOTION 1
- **ENERGY 1 (Calm):** Gentle, comforting, soothing greeting and clear hierarchy without visual noise or aggression.
- **RHYTHM 2 (Consistent with breaks):** Predictable routine cards (morning, afternoon, evening) with intentional breaks for the single next focal action.
- **MOTION 1 (Purposeful & Subtle):** Subtle press feedback, clear check/toggle confirmations. Zero bouncing, spinning, or distracting animations.

## Visual Constraints
- **NO GRADIENTS:** Strict prohibition on linear, radial, or mesh gradients. Clean solid surfaces, subtle borders, and soft shadows only.
- **Surface Elevation:** Flat or single subtle card border (`border-stone-200`) with soft ground plane. No floating or heavy glassmorphism.
- **Border Radius:** Deliberate hierarchy (e.g. `rounded-2xl` for cards, `rounded-xl` for buttons/inputs, `rounded-full` strictly for small status badges).

## Color Palette (Warm & Mature)
- **Background:** Soft warm ivory / cream (`#FAF8F5` light, `#1C1A18` dark)
- **Surface / Cards:** Pure clean ivory (`#FFFFFF` light, `#272421` dark) with warm stone border (`#EFEAE4`)
- **Primary Brand:** Muted calming sage (`#4A6B5D`) or gentle terracotta (`#C26D53`)
- **Text & Foreground:** Deep warm slate / charcoal (`#2D2824` primary, `#6A635B` secondary)
- **Status (Always paired with iconography & text):**
  - Taken / Completed: Soft muted forest (`#2E6B4A`)
  - Pending / Upcoming: Warm ochre (`#A96C25`)
  - Skipped / Missed / Alert: Muted brick (`#A13E34`)

## Typography & Readability
- Large, legible headings (`text-xl` to `text-2xl`), generous line-heights (`leading-relaxed`), comfortable body text (`text-base`).
- Never use small unreadable text (<14px) for critical information.
- Clear, descriptive labels on all controls.

## Touch & Accessibility (Craftsmanship)
- Minimum touch target: 44 x 44 px for all buttons, tabs, and toggles.
- High-contrast text meeting WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text).
- Resilient UI states: every screen must have clear Empty, Loading, and Error states with warm, reassuring copy.
- Never communicate status via color alone.

