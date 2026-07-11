# Lucida Design Resources

This file is the official resource catalog for building Lucida's **Visual Library** and **Motion Library**.

The purpose is to collect high-quality references, record provenance and license notes, and convert useful principles into original Lucida design and motion packages.

## Priority Levels

- **P0** — Use immediately for the first seed library.
- **P1** — Add after the first working version is stable.
- **P2** — Optional or specialized references.

---

## 1. Visual Library Sources

### P0 — Core Sources

#### Awesome Design MD

- URL: https://github.com/VoltAgent/awesome-design-md
- Category: AI-readable design documentation
- Recommended use:
  - Study how visual systems are described in `DESIGN.md`
  - Extract reusable metadata fields
  - Build agent-readable style packages
- Do not:
  - Copy brand identities directly
  - Present third-party styles as official Lucida styles
- License review: Required before copying any code or files

#### Material Design 3

- URL: https://m3.material.io/
- Category: Design system
- Recommended use:
  - Semantic color roles
  - Typography hierarchy
  - Design tokens
  - Component states
  - Accessibility guidance
  - Responsive layout principles
- Do not:
  - Reproduce Google branding
  - Reuse protected assets without permission
- License review: Required for code, icons, fonts, and assets

#### GitHub Primer

- URL: https://primer.style/
- Category: Product design system
- Recommended use:
  - Foundation and primitive structure
  - Production component patterns
  - Token organization
  - Documentation conventions
  - UI density and technical-product layouts
- Do not:
  - Copy GitHub branding or trademarks
- License review: Required before reusing implementation code

#### Apple Human Interface Guidelines

- URL: https://developer.apple.com/design/human-interface-guidelines/
- Category: Interface and interaction principles
- Recommended use:
  - Hierarchy
  - Clarity
  - Motion restraint
  - Platform-aware interaction
  - Content-focused composition
- Do not:
  - Claim Apple affiliation
  - Copy Apple product visuals or trademarks
- License review: Treat as design guidance unless explicit reuse rights are provided

### P1 — Expansion Sources

#### Atlassian Design System

- URL: https://atlassian.design/
- Category: Enterprise product design
- Recommended use:
  - Dense application layouts
  - Information hierarchy
  - Product component states
  - Content design

#### Tailwind CSS Documentation

- URL: https://tailwindcss.com/docs
- Category: Utility-first styling reference
- Recommended use:
  - Spacing scales
  - Responsive constraints
  - Token-to-class mapping
  - Rapid implementation patterns

#### Radix UI

- URL: https://www.radix-ui.com/
- Category: Accessible component primitives
- Recommended use:
  - Behavior and state modeling
  - Accessibility
  - Headless component architecture

#### shadcn/ui

- URL: https://ui.shadcn.com/
- Category: Component implementation reference
- Recommended use:
  - Composition patterns
  - Token-driven styling
  - Practical React component structure

---

## 2. Motion Library Sources

### P0 — Core Sources

#### Remotion Documentation

- URL: https://www.remotion.dev/docs/
- Category: Frame-based video rendering
- Recommended use:
  - Deterministic frame animation
  - Interpolation
  - Spring utilities
  - Sequence composition
  - Render-safe asset handling
- Role in Lucida:
  - Primary execution model for generated video
- Constraint:
  - Every production preset must be deterministic for the same input and frame

#### Motion for React

- URL: https://motion.dev/docs/react
- Category: Declarative React animation
- Recommended use:
  - Animation vocabulary
  - Transition parameters
  - Orchestration patterns
  - Layout and gesture concepts
- Lucida conversion:
  - Translate relevant patterns into frame-safe Remotion presets
- Constraint:
  - Do not depend on wall-clock behavior for offline rendering

#### React Spring

- URL: https://www.react-spring.dev/docs/getting-started
- Category: Physics-based animation
- Recommended use:
  - Spring parameter vocabulary
  - Tension, friction, damping, mass
  - Natural transition behavior
- Lucida conversion:
  - Convert selected behavior into deterministic frame-based functions

### P1 — Expansion Sources

#### GSAP

- URL: https://gsap.com/docs/v3/
- Category: Timeline animation
- Recommended use:
  - Timeline orchestration
  - Sequencing
  - Transform patterns
  - Text and SVG animation concepts
- Constraint:
  - Reimplement or adapt only when compatible with deterministic rendering and licensing

#### Lottie

- URL: https://airbnb.io/lottie/
- Category: Vector animation format
- Recommended use:
  - Reusable vector animation assets
  - Illustration and icon motion
- Constraint:
  - Every imported animation requires source and license metadata

#### Rive

- URL: https://rive.app/
- Category: Interactive vector animation
- Recommended use:
  - State-machine concepts
  - Reusable animated components
- Constraint:
  - Confirm export and runtime suitability for Remotion

#### Anime.js

- URL: https://animejs.com/
- Category: JavaScript animation
- Recommended use:
  - Lightweight timing and transform patterns
  - SVG animation concepts
- Constraint:
  - Use as conceptual reference unless deterministic integration is verified

---

## 3. Resource Metadata Template

Use this template for every source added to the catalog:

```yaml
id: unique-resource-id
name: Resource Name
category: visual | motion | typography | color | icon | illustration | 3d
priority: P0 | P1 | P2
url: https://example.com
license:
  status: verified | review-required | restricted | unknown
  name: License name
  url: https://example.com/license
recommended_use:
  - token structure
  - animation timing
avoid:
  - direct brand copying
last_reviewed: YYYY-MM-DD
reviewed_by: maintainer-name
notes: Short explanation
```

## 4. Provenance Requirements

Every Lucida style or motion package created from external research must include a `provenance.md` file with:

- Source name
- Source URL
- Date reviewed
- License status
- Concepts reviewed
- Concepts adopted
- What Lucida changed
- Assets copied, if any
- Attribution requirements
- Trademark or brand restrictions

## 5. Conversion Rules

1. Extract principles, not brand identity.
2. Create original Lucida tokens, layouts, components, and motion presets.
3. Never copy logos, screenshots, fonts, illustrations, or proprietary assets without permission.
4. Keep source-code licenses separate from trademark and brand rights.
5. Record all important sources before implementation.
6. Prefer deterministic and parameterized animation.
7. Reject resources with unclear provenance from the production library.
8. Every production package must have an explicit owner and version.

## 6. Suggested Local Structure

```text
design/
├── RESOURCES.md
├── visual-library/
│   ├── research/
│   └── styles/
├── motion-library/
│   ├── research/
│   └── presets/
└── sources/
    ├── visual/
    └── motion/
```

## 7. Initial Collection Target

### First Visual Research Set

- Awesome Design MD
- Material Design 3
- GitHub Primer
- Apple Human Interface Guidelines
- Atlassian Design System

### First Motion Research Set

- Remotion Documentation
- Motion for React
- React Spring
- GSAP
- Lottie

The initial goal is not to collect hundreds of links. The goal is to convert a small number of reliable sources into a consistent, searchable, and legally traceable Lucida library.
