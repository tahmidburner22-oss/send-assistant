# SEND Assistant — Design Brainstorm

<response>
<text>
## Idea 1: "Warm Institutional" — Scandinavian Educational Design

**Design Movement**: Nordic Minimalism meets Institutional Warmth — inspired by Finnish school design principles where clarity reduces cognitive load.

**Core Principles**:
1. Generous whitespace as a functional accessibility tool (not decoration)
2. Warm neutral palette that avoids clinical sterility
3. Consistent, predictable layouts that support neurodiverse users
4. Typography-driven hierarchy with no decorative noise

**Color Philosophy**: Warm off-white (#FAFAF7) base with forest green (#16A34A) as the primary action color — green signals growth, support, and safety. Muted sage accents for secondary elements. The warmth reduces visual stress for dyslexic and visually sensitive students.

**Layout Paradigm**: Card-based dashboard with a collapsible sidebar on desktop, hamburger drawer on mobile. Each page follows a consistent top-header → content-area pattern. Forms use single-column stacked layouts for accessibility.

**Signature Elements**:
- Soft rounded cards with 1px borders (not shadows) for clean separation
- Color-coded category badges (green for SEND, purple for subjects, blue for actions)
- Subtle dot-grid background texture on hero areas

**Interaction Philosophy**: Predictable, calm interactions. No jarring animations. Smooth fade-ins on page load. Buttons have gentle scale-on-hover. Toast notifications for feedback.

**Animation**: Framer Motion with staggered fade-up (opacity 0→1, y 10→0) for card lists. 200ms transitions. No bouncing or elastic effects — everything is measured and calm.

**Typography System**: DM Sans for headings (bold, geometric, friendly), system sans-serif for body text. Large touch targets (44px minimum). Clear label hierarchy with font-weight differentiation.
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## Idea 2: "Digital Classroom" — Material Design for Education

**Design Movement**: Google Material Design 3 adapted for UK educational context — structured, colorful, and familiar to teachers who use Google Workspace.

**Core Principles**:
1. Elevated surfaces with layered depth (shadows + rounded corners)
2. Bold color accents per section (worksheets=blue, stories=purple, children=orange)
3. Dense information display with expandable sections
4. Responsive grid that adapts from phone to interactive whiteboard

**Color Philosophy**: Pure white surfaces with a teal primary (#0D9488) and section-specific accent colors. Each major feature gets its own color identity while sharing the teal brand. This multi-color approach helps teachers quickly identify which section they're in.

**Layout Paradigm**: Full-width top app bar with navigation tabs on desktop, bottom navigation on mobile. Content uses a 12-column grid with responsive breakpoints. Dialogs and bottom sheets for forms.

**Signature Elements**:
- Floating action buttons for primary creation actions
- Chip-based filters and tags throughout
- Progress indicators and step-by-step wizards for complex forms

**Interaction Philosophy**: Responsive and tactile. Ripple effects on buttons, slide-in panels, expandable cards. Every action provides immediate visual feedback.

**Animation**: Material motion principles — container transforms for page transitions, shared axis for related content, fade-through for unrelated content. 300ms standard duration.

**Typography System**: Roboto family throughout for consistency with Google ecosystem. Headline Large for page titles, Title Medium for section headers, Body Medium for content.
</text>
<probability>0.05</probability>
</response>

<response>
<text>
## Idea 3: "Trusted Companion" — Approachable Professional

**Design Movement**: Apple Human Interface meets UK Gov Design System — clean, trustworthy, and accessible by default. The design should feel like a reliable tool that a SENCO would trust with important student data.

**Core Principles**:
1. Clarity over cleverness — every element serves a purpose
2. Accessibility-first with WCAG AA compliance built in
3. Familiar patterns that require zero learning curve
4. Professional enough for Ofsted, friendly enough for daily use

**Color Philosophy**: Soft cream/warm white (#FDFCF9) background with emerald green (#10B981) as the primary brand — matching the existing SEND Assistant identity. Purple (#7C3AED) for secondary accents on headings. The cream base reduces eye strain during extended use, critical for teachers spending hours on differentiation.

**Layout Paradigm**: Sidebar navigation on desktop (always visible, not collapsible) with a hamburger drawer on mobile. Content area uses a single-column flow with max-width constraint (720px) for readability. Forms are vertically stacked with generous spacing.

**Signature Elements**:
- Rounded pill-shaped action buttons with subtle shadows
- Category-colored left borders on cards (like a filing system)
- Gentle gradient headers on page titles (cream to white)

**Interaction Philosophy**: Quiet confidence. Hover states are subtle color shifts, not dramatic transforms. Focus states are clearly visible for keyboard navigation. Loading states use skeleton screens, not spinners.

**Animation**: Minimal but purposeful. Page content fades in with a slight upward drift (150ms). Modals slide up from bottom on mobile. Accordion sections expand smoothly. No decorative animation.

**Typography System**: Source Sans 3 (or system sans-serif) for everything — it's designed for readability and has excellent weight range. Headings use 700 weight, body uses 400. Line height 1.6 for body text to aid readability.
</text>
<probability>0.07</probability>
</response>

---

## Selected Approach: Idea 3 — "Trusted Companion"

This approach best matches the existing SEND Assistant design shown in the screenshots (green brand, cream/white backgrounds, rounded cards, mobile-first) while elevating it with better typography, spacing, and professional polish. It prioritizes accessibility and trust — essential for a SEND education tool.
