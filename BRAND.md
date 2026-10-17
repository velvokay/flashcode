# BRAND.md — Flashcode Product Identity

## Status

**Recall Line is the approved brand direction for Flashcode.** This document is now the canonical product identity and should be treated as an implementation requirement alongside `AGENTS.md` and `DESIGN.md`.

The approved direction uses crisp digital geometry and flat color. The exploratory banner's dusty, hazy, photorealistic background is not part of the identity and must not be reproduced in the interface.

## Product premise

**Flashcode schedules coding questions for review based on how well the learner recalled each one.**

It is a serious practice tool, not a course marketplace, code editor, productivity dashboard, or game. The product should make repeated practice feel focused and finite. The user should always understand what is due, what they are doing now, and what comes next.

## Chosen direction: Recall Line

Recall Line best translates the product's core idea into a visual system. Spaced repetition is a journey with intervals, returns, branches, and a clear next stop. Vignelli supplies the information architecture; Rams and Ive supply the restraint and behavioral precision; Bauhaus supplies limited geometric emphasis. This is a synthesis, not a collage of period references.

The identity should be recognizable through its route line, station marker, index notation, and disciplined composition even when the Flashcode name is absent.

---

## 1. Brand character

- **Product:** An adaptive practice system for coding questions in a flashcard format.
- **Audience:** Developers and technical learners who want durable recall, especially for interviews, coursework, or language/framework fluency.
- **Core experience:** Open the app, work through the questions due now, assess recall honestly, and leave knowing the practice system has scheduled the next useful encounter.
- **Personality:** Precise, composed, intelligent, candid, quietly encouraging.
- **Desired emotion:** “I know exactly what to work on, and I can make meaningful progress now.”
- **Design metaphor:** A metropolitan wayfinding system crossed with a beautifully engineered study instrument. The queue is a route; review milestones are stations; the active problem is the destination in focus.
- **Product rule:** Put due questions first and keep the review decision obvious.

Flashcode must communicate discipline without severity. It should feel designed for people who enjoy understanding systems, but it must never require them to understand the scheduling system before they can study.

Activity history may show a calendar and neutral streak counts when they help users understand consistency. Never turn streaks into pressure, rewards, warnings, or a reason to override the review schedule.

## 2. Distinctive visual language

### Typography

- Use **Helvetica Neue** where available, falling back to Helvetica, Arial, and the platform sans-serif. This connects the interface to the Swiss and Vignelli references without requiring a fashionable web font.
- Use **SF Mono** where available, falling back to Consolas or the platform monospace, for code, keyboard input, answer output, durations, and compact system identifiers.
- Preferred interface weights: 400, 500, and 650. Avoid thin display weights and heavy 800–900 weights.
- Use sentence case throughout. Uppercase is reserved for route identifiers and tiny operational labels of no more than three words.
- Headings are compact and declarative, with slightly tight tracking. Body text is comfortable and neutral.
- Use tabular numerals for queues, intervals, streak-independent history, and scheduling data.
- Code is never artificially reduced to look elegant. Default code size must remain at least 15px on desktop and 14px on narrow mobile screens, with a generous line height.

Suggested scale:

| Role | Desktop | Mobile | Treatment |
| --- | ---: | ---: | --- |
| Display | 56/60 | 40/44 | Helvetica Neue 500, tight tracking |
| Page title | 36/42 | 30/36 | Helvetica Neue 600 |
| Section title | 24/30 | 22/28 | Helvetica Neue 600 |
| Body | 16/24 | 16/24 | Helvetica Neue 400 |
| Supporting | 14/20 | 14/20 | Helvetica Neue 400–500 |
| Operational label | 12/16 | 12/16 | Helvetica Neue 600, optional uppercase |
| Code | 15/24 | 14/22 | SF Mono 400–500 |

### Color

The palette is warm-neutral and ink-like, with one unmistakable signal color. Color indicates position, state, or action; it never fills space merely to make a screen lively.

#### Core tokens

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `canvas` | `#F4F2EC` | `#171715` | Main field; warm paper or dark charcoal |
| `surface` | `#FFFFFF` | `#222220` | Active work surface |
| `surface-subtle` | `#EAE7DF` | `#2B2B28` | Secondary grouping |
| `ink` | `#171715` | `#F4F2EC` | Primary content |
| `ink-muted` | `#65645F` | `#AAA8A0` | Secondary content |
| `rule` | `#C9C6BD` | `#454540` | Dividers and inactive tracks |
| `signal` | `#C83B24` | `#F06449` | Primary action, active position, focus identity |
| `signal-strong` | `#9F2B19` | `#FF8A70` | Pressed state or accessible text accent |
| `info` | `#1769AA` | `#6EAFE0` | Informational scheduling state |
| `success` | `#287A4B` | `#62B985` | Confirmed success or mastered state |
| `warning` | `#9A6500` | `#E6B851` | Scheduling or data warning |
| `danger` | `#B3261E` | `#FF746C` | Destructive action and error only |

- `signal` is the brand accent: a deep transit red, closer to printed enamel than a glowing screen color.
- Large areas remain neutral. The active route should usually occupy less than 10% of a screen.
- Difficulty is not encoded by color alone. Pair color with a label, symbol, or position.
- Dark mode is optically tuned, not mechanically inverted. Avoid pure black and pure white.

### Geometry

- Use a **2px route line** as the recurring structural element. It may become 3px in large editorial moments.
- Use circular station markers in exactly three states: 8px inactive dot, 12px current ring, 12px completed solid dot.
- Corner radii use three tokens only: 4px for small indicators and keyboard keys, 8px for controls, inputs, and menus, and 12px for bounded panels and cards such as the study surface, sidebar panels, and roadmap nodes.
- Full-width rules, tables, list rows, and surfaces attached flush to a viewport edge remain square. Do not add rounding where there is no visible outer corner.
- Do not use pill shapes except for true binary or status tokens.
- Borders are 1px neutral rules. Selected or focused states use a 2px signal edge or a clearly visible focus outline.
- On bounded, rounded components, selection must affect the complete perimeter or the complete surface. Never use a one-sided inset stripe that follows only the left corners.
- The flashcard is not a floating novelty object. It is a stable work surface anchored to the page grid.

### Composition

- Use a 12-column desktop grid, 6-column tablet grid, and 4-column mobile grid.
- Desktop maximum content width: 1280px. Reading and question content should normally occupy 7–8 columns and no more than 76 characters per text line.
- The primary study view is asymmetrical: a narrow route/index rail and a broad question surface. The rail collapses to a horizontal progress strip on mobile.
- Prefer rules, shared baselines, and whitespace over containers. A screen should still read correctly if surface fills are removed.
- Keep the answer/reveal action at a stable position across successive cards to build motor familiarity.
- Use the spacing scale in `AGENTS.md`: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`.

### Imagery and graphics

- Product UI uses no stock photography, mascots, decorative 3D objects, or generic coding illustrations.
- Interface surfaces are flat, clean, and digitally precise. Use solid CSS color fields and deterministic SVG geometry—not raster texture—to create the identity.
- Do not use dust, paper grain, distressing, blur, bloom, atmospheric haze, material photography, or simulated age. “Warm paper” describes the canvas color only, never its texture.
- Explanations may use spare diagrams: memory intervals, execution flow, data structures, and complexity curves.
- Diagrams use the route grammar: orthogonal or 45-degree paths, circular nodes, direct labels, and no ornamental legend when direct labeling works.
- Marketing imagery should show the real product, real code, or a real diagram. Never fabricate vanity metrics or populated dashboards.

### Iconography

- Use one outlined icon family with a 1.75–2px stroke, square line caps, and restrained rounding.
- Standard sizes are 16, 20, and 24px. Icons align to the text baseline or control center, never by arbitrary offsets.
- Prefer text labels for unfamiliar actions. Icons should not appear beside every heading.
- Route markers and scheduling symbols are product-specific marks; do not substitute generic map pins.

### Motion

- Motion communicates passage through the review sequence: the active station advances, the answer is revealed, and the next question replaces the current one.
- Default transition duration: 140–180ms. A review departure may use 300–320ms so the station movement remains legible.
- One-shot progress acknowledgements may run for up to 900ms, but must not block input or repeat after the state has been seen.
- Use opacity and short directional translation of no more than 8px. No bounce, elastic easing, card flipping, confetti, or celebratory particle effects.
- A rating selection should respond immediately; schedule details may update after the choice without blocking the next question.
- Reuse the route-and-station language for rating departure, session completion, roadmap updates, and the first review of the day.
- Respect `prefers-reduced-motion`; all meaning must survive without animation.

### Content voice

- Be concise, literal, and constructive. The interface is a calm instructor, not a cheerleader.
- Do not use taglines, aphorisms, motivational filler, or marketing language inside the product. Prefer a useful status or omit the sentence.
- Prefer: “12 due”, “Show answer”, “Again in 8 min”, “Done for today”.
- Avoid: “Crush your goals”, “You’re on fire!”, “Become a coding ninja”, or guilt-based streak language.
- Name ratings by what happened: **Couldn’t solve / Needed help / Solved independently**. Show the resulting interval beside each choice when available.
- Use “question” for the learning unit, “review” for an encounter, “collection” for a user-defined group, and “queue” for the ordered set due now.
- Error messages state what happened and the next useful action.
- Never use centered dots or bullet glyphs to divide inline labels. Separate related values with spacing, alignment, rules, or distinct columns instead.

## 3. Signature design decisions

### 3.1 The recall line

A thin line with station markers shows the current review's place in the active queue. On desktop it can run vertically beside the work surface; on mobile it runs horizontally above it. It represents only the current session—not lifetime mastery—and therefore remains honest and comprehensible.

### 3.2 Question identity

Use the question title and its plain-language category as its identity. Do not add arbitrary operational codes or faux-industrial numbering. Show an identifier only when it comes from a source users recognize and need.

### 3.3 The interval board

The three review choices align in a single row like a destination board: outcome above, next interval below. Their layout stays fixed across questions. On mobile they stack vertically rather than scrolling horizontally.

### 3.4 The focus edge

The active work surface receives a single signal-red edge aligned with the recall line. Do not surround the card with an accent border. This creates a recognizable relationship between navigation and content without visual noise.

### 3.5 The completion terminus

When the due queue reaches zero, the route ends cleanly. Show a completed terminal marker, “Done for today,” the next due time, and one quiet optional action. No confetti, invented score, or pressure to continue.

### 3.6 The coding workbench

The active review is a split workbench: problem context on the left and a large persistent code editor on the right. The editor is the dominant working area, not a short-response field. On narrow screens the editor moves below the prompt and retains a substantial working height.

## 4. Creative exceptions to the universal design defaults

### Warm canvas instead of pure white

- **Default overridden:** The suggested `#FFFFFF` page background.
- **Replacement:** Use `canvas: #F4F2EC` around a white active study surface.
- **Reason:** The slight paper warmth separates long practice sessions from generic productivity software and reduces the clinical feel without becoming nostalgic.
- **Use:** Practice, library, scheduling, and account views.
- **Do not use:** Inside code blocks, where syntax contrast requires a purpose-built neutral surface.

### Two type families for different information species

- **Default overridden:** One primary sans-serif family.
- **Replacement:** Helvetica Neue/system sans for interface language; SF Mono/system monospace strictly for code, timing, keyboard input, and identifiers.
- **Reason:** Code must retain its native rhythm, while operational metadata benefits from aligned numerals.
- **Use:** Functional code and machine-like data only.
- **Do not use:** Paragraphs, marketing headlines, navigation, or decorative “tech” copy.

### A literal structural line

- **Default overridden:** Preference for whitespace alone to define most relationships.
- **Replacement:** A continuous route line may connect the queue, current item, and completion state.
- **Reason:** It is both navigation and brand recognition, making the scheduling model visible.
- **Use:** Review flow, learning history, and interval explanations.
- **Do not use:** Every list, settings screen, empty state, or unrelated decorative background.

### Restrained operational uppercase

- **Default overridden:** Avoid uppercase text.
- **Replacement:** Uppercase may be used for short collection codes and operational labels at 12–13px.
- **Reason:** It makes wayfinding metadata instantly distinct from prose.
- **Use:** `DUE`, `NEXT`, keyboard keys.
- **Do not use:** Headings, buttons, sentences, or motivational copy.

## 5. Anti-identity

Flashcode must never feel like:

- A gamified education app driven by streak anxiety, coins, leagues, or cartoon rewards.
- A generic analytics dashboard full of unrelated cards, donut charts, and decorative statistics.
- A leetcode clone with an intimidating IDE as the product's visual center.
- A nostalgic flashcard imitation with paper textures, handwriting, tape, or skeuomorphic card flipping.
- A futuristic AI product with neon glows, purple gradients, glass panels, or a chat box at the center of every workflow.
- A literal subway-map theme park. Transit structure is a grammar, not decoration.
- An Apple product imitation. Adopt material restraint and interaction care, not Apple page layouts or product-render tropes.
- A severe modernist exercise where small type, low contrast, or rigid geometry outranks usability.

## 6. Design references

### Massimo Vignelli — New York City Subway diagram and Unimark systems

- **Adopt:** Direct labeling, systematic color, finite geometry, visual hierarchy, and the confidence to simplify complexity.
- **Avoid:** Literal reproduction of the 1972 map, beige-and-primary-color nostalgia, or applying route graphics where no route exists.

### Braun products under Dieter Rams

- **Adopt:** Controls that explain themselves, quiet hierarchy, durable proportions, and a limited material/color vocabulary.
- **Avoid:** Retro knobs, faux hardware panels, gratuitous model numbers, and styling digital controls to look analog.

### Apple industrial design under Jony Ive

- **Adopt:** Integration, careful edge relationships, reduction of visible mechanism, and obsessive state refinement.
- **Avoid:** Glossy product-page mimicry, excessive empty space, floating device renders, or making content secondary to surface polish.

### Bauhaus information and exhibition graphics

- **Adopt:** Functional geometry, asymmetrical balance, typography as composition, and rare primary-color emphasis.
- **Avoid:** Scattered circles and triangles, costume-modernism, or treating Bauhaus as a decorative pattern library.

### Swiss International Typographic Style

- **Adopt:** Grid discipline, flush-left typography, rational scale, and objective information hierarchy.
- **Avoid:** Tiny type, dogmatic coldness, and interchangeable black-red-white poster styling.

## 7. Implementation requirements

Before generating substantial UI:

1. Read `AGENTS.md`, `DESIGN.md`, and this file.
2. Treat Recall Line as the approved direction; do not mix in rejected proposal languages.
3. Translate the chosen palette, typography, spacing, radii, and motion values into named design tokens.
4. Establish the recall line, question index, interval board, focus edge, and completion terminus as shared patterns—not screen-specific hacks.
5. Build the main review loop before dashboards or marketing pages. It is the clearest test of the identity.
6. Validate contrast, keyboard operation, visible focus, reduced motion, and responsive reflow.
7. Inspect the rendered product at representative mobile and desktop sizes. Refine any element that feels generic, ornamental, or misaligned.

Do not default to component-library styling. The brand should come from repeatable information structure and behavior, not from a logo placed on conventional SaaS components.

## Final test

Before approving a direction, ask:

1. Does the identity make the review loop clearer rather than merely more styled?
2. Can the product be recognized without its logo?
3. Does the current question remain the unmistakable focal point?
4. Would the system still feel coherent in grayscale?
5. Can the identity remain calm after 30 minutes of practice?

All five answers should be yes before Recall Line is considered successfully implemented.
