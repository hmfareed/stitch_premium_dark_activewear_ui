---
name: High-Performance Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#ffb59a'
  on-secondary: '#5a1b00'
  secondary-container: '#ff5e07'
  on-secondary-container: '#531900'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb59a'
  on-secondary-fixed: '#370e00'
  on-secondary-fixed-variant: '#802a00'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  headline-xl:
    fontFamily: Lexend
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is engineered for a premium fitness activewear brand, evoking feelings of power, precision, and elite performance. The aesthetic sits at the intersection of **High-Contrast Bold** and **Minimalism**, stripping away non-essential elements to focus on movement and intensity.

The target audience consists of dedicated athletes and high-end consumers who value technical excellence. The UI must feel like a piece of high-performance gear: sleek, responsive, and durable. Visually, this is achieved through deep blacks that provide an infinite canvas for electric accents, creating a "glow" effect that mimics the energy of a high-intensity workout.

## Colors

The color strategy for this design system is built on a "void and spark" philosophy. The foundation is a pure black (`#000000`) to maximize contrast and focus. 

- **Primary (Electric Lime):** Used for primary actions, success states, and critical performance data. It is the visual "pulse" of the interface.
- **Secondary (Neon Orange):** Used for alerts, secondary highlights, or to differentiate product categories (e.g., "High-Heat" gear).
- **Surface Tiers:** Deep Charcoal (`#121212`) and Graphite (`#1A1A1A`) are used to create structural depth without losing the dark-mode immersion.
- **Typography:** Pure white is reserved for high-priority headers, while a muted silver is used for secondary text to reduce eye strain in high-contrast environments.

## Typography

Typography in this design system is used as a graphic element. **Lexend** provides an athletic, wide-track feel for headlines that communicates stability and speed. For maximum impact, large headlines should use "Extra Bold" or "Black" weights with tight letter spacing.

**Inter** is utilized for body copy and technical specifications. Its neutral, systematic nature ensures that even complex product details or workout data remain legible at high speeds. We use an all-caps label style for metadata and categories to reinforce the utilitarian, performance-driven nature of the brand.

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop to maintain a premium, editorial feel, while transitioning to a fluid model for mobile. A strict 8px base unit drives all spacing decisions, ensuring a mathematical rhythm that feels intentional and "engineered."

Layouts should lean heavily into whitespace (or "blackspace"). Elements are given significant breathing room to emphasize their importance. Large margins (48px+) are encouraged between major sections to prevent the UI from feeling cluttered, maintaining a sleek, high-end appearance.

## Elevation & Depth

To maintain the high-end, modern feel, this design system avoids traditional drop shadows. Depth is instead communicated through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** Pure Black (#000000).
- **Level 1 (Cards/Sections):** Deep Charcoal (#121212) with a 1px border of #1A1A1A.
- **Level 2 (Modals/Overlays):** Graphite (#1A1A1A) with a subtle "Glassmorphism" effect (20px backdrop blur and 10% opacity white tint).
- **Interactions:** When an element is hovered, its border should transition to the Primary Accent (Electric Lime) to signify high energy.

## Shapes

The shape language is defined by **Precision**. We utilize a "Soft" roundedness (0.25rem / 4px) which provides a subtle modern touch without sacrificing the aggressive, sharp edge of performance gear. 

Buttons and interactive containers should feel structural and rigid. Large containers, such as product cards or hero sections, can scale up to 8px (rounded-lg) for a slightly more approachable feel, but the core aesthetic remains focused on straight lines and tight corners to reflect the technical nature of activewear construction.

## Components

### Buttons
- **Primary:** Electric Lime background, black text, 4px radius. High impact, high visibility.
- **Ghost:** Transparent background, 2px Electric Lime border, lime text.
- **Interaction:** On press, buttons should scale down slightly (98%) to provide a tactile, mechanical feel.

### Cards
Cards use the Level 1 elevation (Charcoal background). Imagery within cards should have a desaturated or high-contrast treatment to match the dark aesthetic. Use subtle top-to-bottom gradients to lead the eye toward the "Buy" or "View" action.

### Data Displays
For performance metrics (e.g., heart rate, speed), use the **Headline-XL** typography in Electric Lime. These should be treated as the "hero" of the layout when present.

### Form Inputs
Inputs should be "Underlined" or "Minimal Box" style. Instead of a full box, use a bottom border that glows Electric Lime when focused. Labels should use the **label-caps** style for a technical look.

### Additional Components
- **Progress Bars:** Thin, neon lines against a charcoal track to visualize workout goals.
- **Performance Tags:** Small, pill-shaped chips with a secondary accent (Neon Orange) to highlight features like "Waterproof" or "Reflective."