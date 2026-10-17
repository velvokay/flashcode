# DESIGN.md — Interface Design Principles

## Design philosophy

Design with the discipline of Massimo Vignelli, the clarity and refinement of Apple, and the structural rigor of the Swiss International Typographic Style.

The objective is to create digital interfaces that feel **precise, calm, intuitive, cohesive, and exceptionally well-considered**.

Every element must have a reason to exist. Every spatial relationship must feel intentional. The interface should appear as a unified system, not a collection of independently styled components.

**The guiding principle: Design is the organization of information, not the decoration of information.**

Prefer showing over telling. Prefer structure over ornament. Prefer clarity over novelty. Prefer a few excellent decisions over many mediocre ones.

Minimalism is not the objective in itself. Clarity, usability, and visual harmony are.

---

## 1. Visual hierarchy

Every screen must communicate its hierarchy immediately.

- Establish one clear primary focal point per view.
- Use typography, scale, placement, and whitespace to convey importance.
- Secondary actions must remain visually subordinate to primary actions.
- Group related information spatially instead of relying on enclosing boxes.
- Avoid competing focal points or multiple equally prominent calls to action.
- Use progressive disclosure to keep secondary complexity out of the primary workflow.
- Content should be immediately scannable.

A user should understand what a screen is for within seconds, without needing explanatory paragraphs.

## 2. Grid, alignment, and structure

**Alignment is non-negotiable.**

Use a deliberate, consistent grid system across the entire application.

- Establish shared content boundaries, column widths, and gutters.
- Align headings, content, controls, and sections to common grid lines.
- Use a consistent spacing scale derived from a 4px base unit.
- Prefer CSS Grid and Flexbox over arbitrary positioning.
- Avoid unnecessary nested containers and individually improvised margins.
- Repeated elements must share dimensions and alignment rules.
- Maintain consistent optical alignment, accounting for glyph shapes and visual weight.
- Use asymmetry when it produces meaningful balance, never as random decoration.
- Use responsive grids that preserve relationships across screen sizes.

Avoid arbitrary pixel values when existing layout tokens are available.

If two elements look like they should align, they must align.

## 3. Spacing and whitespace

Whitespace is an active design element, not unused space.

Use the following default spacing scale:

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`

- Use tight spacing within cohesive groups.
- Use larger spacing between distinct conceptual sections.
- Keep spacing patterns consistent across screens.
- Give important content sufficient breathing room.
- Avoid excessive blank space that makes related content feel disconnected.
- Do not maximize information density at the expense of readability.
- Do not maximize whitespace at the expense of usability.

Spacing should communicate structure even when all borders and background colors are removed.

## 4. Typography

Typography is the primary visual design instrument.

Use a restrained typographic system based on one excellent sans-serif family.

Preferred choices:
- Apple platform-native: San Francisco / system font
- Web: Inter, Helvetica Neue, or an appropriate system sans-serif

Rules:
- Use one primary type family and a minimal set of weights.
- Establish a consistent, reusable type scale.
- Prefer regular, medium, and semibold weights.
- Use type size, weight, and spacing to convey hierarchy.
- Avoid excessive uppercase text, decorative letterspacing, and gratuitous bolding.
- Keep long-form text at comfortable reading widths, approximately 60–75 characters.
- Default to left alignment for most text.
- Use centered typography only where compositionally justified.
- Maintain consistent line heights and vertical rhythm.
- Use tabular numerals for aligned numerical data.

Suggested web type scale:
- Display: 48–64px
- Page title: 32–40px
- Section heading: 22–28px
- Subheading: 18–20px
- Body: 16px
- Supporting text: 14px
- Small metadata: 12–13px, sparingly

Adapt these values responsively and for readability. They are defaults, not rigid constraints.

**The result should look beautifully typeset, not merely formatted.**

## 5. Color

Color must serve meaning, hierarchy, or identity.

- Use a restrained palette dominated by neutrals.
- Choose one primary accent color when the product benefits from one.
- Use accent color deliberately for important actions, selection, and emphasis.
- Avoid using multiple bright colors merely to add personality.
- Prefer subtle surface distinctions over numerous colored cards.
- Use semantic colors consistently for success, warning, and error states.
- Maintain accessible contrast for text and essential controls.
- Avoid gradients unless they communicate something meaningful or form an intentional brand element.
- Do not introduce purple gradients, neon glows, or colorful dashboard decorations by default.

Suggested starting palette for light interfaces:
- Background: `#FFFFFF`
- Secondary surface: `#F5F5F7`
- Primary text: `#1D1D1F`
- Secondary text: `#6E6E73`
- Border: `#D2D2D7`
- Accent: one project-specific color

These values are starting points, not a requirement to imitate Apple's branding.

## 6. Surfaces and components

Components should feel native to the same family.

- Use a small, deliberate set of corner radii.
- Use shared radius tokens rather than assigning one-off corner values. Keep full-width structural regions and continuous lists square when rounding would imply a separate card.
- Keep buttons, inputs, menus, and cards internally consistent.
- Prefer flat surfaces and subtle separators when possible.
- Use cards only when grouping or interaction justifies them.
- Avoid wrapping every section in a rounded rectangle.
- Avoid excessive borders, heavy shadows, floating panels, and layered containers.
- Do not mix unrelated icon styles.
- Use consistent icon sizes, stroke weights, and alignments.
- Prefer recognizable platform conventions over invented controls.
- Maintain consistent component heights, padding, and interactive states.

A cohesive interface should remain recognizable even if every component is rendered in grayscale.

## 7. Show, don't tell

Prefer direct representation over lengthy explanation.

- Show a product rather than describing why it is impressive.
- Show real data rather than explaining what a dashboard could display.
- Use diagrams, previews, meaningful illustrations, or examples when they genuinely improve comprehension.
- Avoid large blocks of introductory marketing copy.
- Eliminate redundant subtitles and descriptions.
- Use concise, descriptive labels.
- Let layout and grouping explain relationships.
- Prefer meaningful empty states with a clear next action.
- Never invent fake content or decorative statistics to make the UI look populated.

When an interaction can be understood through visual affordances, do not add unnecessary instructional text.

Clarity takes priority over extreme brevity: never remove labels that users need to understand an action.

## 8. Interaction and motion

Interaction should feel precise, quiet, and predictable.

- Provide immediate feedback for user actions.
- Use subtle state changes and transitions to maintain continuity.
- Favor short, purposeful animations over elaborate movement.
- Avoid bouncing, exaggerated scaling, and attention-seeking effects.
- Never animate purely to make the interface feel more elaborate.
- Support keyboard navigation and visible focus states.
- Ensure controls have appropriate touch or click targets.
- Respect reduced-motion preferences.
- Make destructive actions understandable and recoverable where possible.
- Design loading, disabled, empty, error, and success states as carefully as the default state.

Motion should explain change, not distract from it.

## 9. Responsive design

Do not treat mobile as a compressed desktop layout.

- Preserve hierarchy and alignment at all supported viewport sizes.
- Reflow grids rather than shrinking everything proportionally.
- Adapt navigation to the available space.
- Preserve comfortable margins on small screens.
- Avoid horizontal scrolling except in intentionally scrollable content.
- Prevent text clipping, overlapping controls, and awkward wrapping.
- Preserve consistent spacing and component behavior across breakpoints.
- Consider content length, localization, and larger text settings.

Responsive behavior must be designed, not patched afterward.

## 10. Content and language

The interface should communicate confidently and concisely.

- Use plain, direct, human language.
- Prefer short headings with meaningful information.
- Use specific action labels such as "Create project" instead of vague wording.
- Avoid hype, filler, jargon, and unnecessary marketing language.
- Use consistent terminology throughout the application.
- Keep capitalization, punctuation, and naming patterns consistent.
- Explain errors clearly and provide useful recovery actions.

The interface should feel like a well-designed tool, not a sales pitch.

## 11. Avoid generic AI-generated UI

Do NOT default to familiar AI-generated website patterns.

Specifically avoid:
- Purple-to-blue gradient hero sections.
- Generic three-column feature-card layouts on every page.
- Excessive pill badges, floating blobs, and decorative gradients.
- Every section enclosed in a rounded card.
- Huge headings followed by vague marketing subtitles.
- Randomly mixed border radii.
- Excessive glassmorphism or blur effects.
- Oversized drop shadows.
- Decorative icons beside every heading.
- Arbitrary whitespace or inconsistent padding.
- Overcomplicated dashboard widgets created just to fill empty space.
- Needless animations and hover transformations.
- Copy-pasted component-library defaults without visual refinement.

Do not confuse visual complexity with sophistication.

**A simple, exceptionally composed screen is better than an elaborate but incoherent one.**

## 12. Design system implementation

Before building substantial UI, establish reusable design foundations.

Define:
- Color tokens
- Typography tokens
- Spacing tokens
- Grid and container rules
- Border and radius tokens
- Component variants
- Interaction states
- Responsive breakpoints

Use these tokens throughout the codebase instead of improvising individual component styles.

When modifying an existing application:
- Inspect the existing design system first.
- Reuse established patterns where appropriate.
- Do not introduce a competing visual language.
- Refactor inconsistent styles into shared foundations when practical.
- Preserve working user flows and accessibility.

Use well-designed component libraries as foundations, not substitutes for design judgment.

## 13. Required design workflow

When implementing any new screen or substantial UI feature:

1. **Understand:** Identify the user's main goal and the most important information.
2. **Structure:** Determine the content hierarchy and primary action.
3. **Layout:** Choose the grid, alignment, and spacing relationships.
4. **Systematize:** Select existing typography, color, and component tokens.
5. **Implement:** Build using reusable patterns and semantic markup.
6. **Inspect:** Review the rendered interface at realistic viewport sizes.
7. **Refine:** Correct alignment, spacing, typography, hierarchy, and awkward proportions.
8. **Simplify:** Remove unnecessary visual elements or explanatory copy.
9. **Validate:** Check accessibility, responsiveness, and interaction states.

Do not consider a screen finished merely because it renders and functions.

If browser or screenshot tooling is available, inspect the actual rendered result. If not, explicitly report that visual verification was not performed.

## 14. Final quality gate

Before calling any UI implementation complete, ask:

- Does every element align to a deliberate grid?
- Is the information hierarchy obvious?
- Does the screen have a clear primary focal point?
- Are spacing and typography systematic?
- Are all components visually related?
- Could any decoration, container, or sentence be removed?
- Is the primary user task obvious?
- Does the UI show rather than explain wherever practical?
- Does it work elegantly on mobile and desktop?
- Are interactive elements accessible and understandable?
- Does this look like one coherent product rather than assembled components?
- Would the design still feel intentional in grayscale?

If any answer is unsatisfactory, refine the interface before finishing.

## Final directive

**Approach each interface as a designed composition, not a component assembly exercise.**

Prioritize, in order:

1. Usability and clarity
2. Structure and alignment
3. Information hierarchy
4. Typography
5. Spacing and proportions
6. Visual consistency
7. Restrained aesthetic refinement
8. Decorative expression, only when justified

The desired result is timeless rather than trendy, precise rather than busy, and refined rather than embellished.

The interface should feel so naturally organized that the user barely notices the design at all.
