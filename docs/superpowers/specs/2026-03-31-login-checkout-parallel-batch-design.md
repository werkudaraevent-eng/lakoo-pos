# Login + Checkout Parallel Batch Design

Date: 2026-03-31
Project: POS System
Scope: Batch 1 for frontend refactor and polish

## Goal

Refactor and polish the `Login` and `Checkout` experiences so they can be developed in parallel by separate agents without file conflicts, while preserving the existing application flow and business behavior.

This batch is intentionally limited to:

- visual polish for `Login` and `Checkout`
- responsive cleanup for both pages
- feature-local component refactor for both pages

This batch explicitly does not include:

- Figma integration work
- full-app design system rollout
- backend or database changes
- auth model changes
- checkout business rule redesign

## Success Criteria

The batch is successful when:

- `Login` and `Checkout` look more intentional and polished
- both pages are responsive and usable on mobile and desktop
- each page is decomposed into reusable components within its own feature area
- page files become orchestration layers instead of large UI blobs
- no agent needs to edit the same feature-local files as another agent
- current login and checkout flows continue to work
- the project still builds successfully

## Recommended Execution Model

Use a foundation-first parallel model.

This means the coordinator defines file boundaries and integration constraints first, then two agents work independently:

- Agent Login owns the `Login` page and login-specific components
- Agent Checkout owns the `Checkout` page and checkout-specific components
- Coordinator owns cross-feature alignment, app-level integration, and final verification

This is preferred over raw page-first parallelism because it reduces duplicated UI patterns and lowers the risk of merge conflicts.

## Team Topology

### Coordinator

Responsibilities:

- define feature boundaries
- enforce naming and styling constraints
- handle any required cross-feature integration
- align visual direction between both pages
- run final verification

Allowed write scope:

- `src/app/App.jsx`
- `src/styles.css`
- any final import wiring needed for integration

### Agent Login

Responsibilities:

- refactor `LoginPage` into smaller feature-local components
- improve the visual hierarchy and responsiveness of the login experience
- keep auth behavior intact

Allowed write scope:

- `src/pages/LoginPage.jsx`
- `src/features/login/**`

### Agent Checkout

Responsibilities:

- refactor `CheckoutPage` into smaller feature-local components
- improve search, cart, summary, and receipt presentation
- keep checkout behavior intact

Allowed write scope:

- `src/pages/CheckoutPage.jsx`
- `src/features/checkout/**`

## Proposed File Structure

### Login feature

- `src/features/login/components/LoginHero.jsx`
- `src/features/login/components/DemoAccountGrid.jsx`
- `src/features/login/components/LoginForm.jsx`
- `src/features/login/login.css`

`src/pages/LoginPage.jsx` remains the entry page and keeps:

- auth state handling
- navigation destination logic
- submit handling
- composition of login sections

### Checkout feature

- `src/features/checkout/components/ProductSearchPanel.jsx`
- `src/features/checkout/components/ProductGrid.jsx`
- `src/features/checkout/components/CartSummary.jsx`
- `src/features/checkout/components/LatestReceipt.jsx`
- `src/features/checkout/checkout.css`

`src/pages/CheckoutPage.jsx` remains the entry page and keeps:

- query state
- cart state
- promo and payment state
- sale finalization logic
- composition of checkout sections

## Component Boundary Rules

The page files should become thin orchestration layers.

Feature-local components should contain presentation and local rendering concerns, but they should not silently reimplement the page's business logic.

Rules:

- keep auth submission and redirect logic in `LoginPage.jsx`
- keep cart mutation, promo application, and checkout submission flow in `CheckoutPage.jsx`
- pass structured props down into feature-local components
- avoid hidden coupling through context usage unless already justified by existing patterns
- do not create a global reusable component library in this batch
- reuse only inside the owning feature unless a shared primitive is clearly required

## Styling Rules

Use feature-local CSS for most of the new styling.

Global stylesheet ownership:

- tokens
- base typography and shell primitives
- existing app-wide layout utilities
- minimal shared primitives needed by both pages

Feature-local stylesheet ownership:

- login layout and card treatments
- checkout layout and panel treatments
- page-specific responsive behavior
- page-specific interaction states

Naming rule:

- use feature-scoped classes such as `login-*` and `checkout-*`
- avoid generic new selectors that could bleed into other screens

## UX Direction

### Login

Target outcome:

- stronger hero-to-form contrast
- cleaner account demo selection
- faster scan of role options
- better mobile stacking

Desired feel:

- editorial retail tone
- deliberate hierarchy
- premium but practical

### Checkout

Target outcome:

- clearer split between discovery, cart, and summary
- faster scanning of products and stock state
- stronger emphasis on total and final action
- latest receipt shown as a useful post-submit state instead of an afterthought

Desired feel:

- efficient cashier workflow
- low-friction controls
- clearer operational rhythm

## Parallel Safety Constraints

To keep the two-agent workflow safe:

- Agent Login must not edit checkout feature files
- Agent Checkout must not edit login feature files
- both feature agents should avoid broad edits in `src/styles.css`
- coordinator handles any shared import or global style adjustments after the feature work lands

If a shared primitive becomes necessary during implementation, the feature agent should stop short of introducing a broad shared abstraction and leave that integration step for the coordinator.

## Verification Requirements

### Per-feature verification

Login feature must verify:

- demo account selection still populates credentials
- invalid login still renders error state
- successful login still redirects correctly
- layout works on narrow viewport

Checkout feature must verify:

- products can still be added to cart
- quantity controls still work
- promo code behavior still works
- sale finalization still returns receipt state
- layout works on narrow viewport

### Final verification

Coordinator must verify:

- `npm run build` passes
- `Login` and `Checkout` feel visually related
- no obvious CSS leakage affects other pages
- routing still works
- responsive presentation is stable at desktop and mobile widths

## Risks

### Risk: visual drift between pages

Mitigation:

- coordinator performs final alignment pass
- limit each agent to feature-local styling first

### Risk: over-refactor into premature shared abstractions

Mitigation:

- keep reusable components local to each feature for this batch
- postpone broader design system extraction

### Risk: business logic accidentally moved into presentational components

Mitigation:

- keep stateful orchestration in page files
- keep feature components prop-driven

## Out of Scope Follow-Ups

These are reasonable next batches, but not part of this one:

- Figma connection and design ingestion
- extraction of broader shared UI primitives
- extending the same structure to Dashboard, Sales, Catalog, and other pages
- visual system rollout across the full POS app

## Implementation Readiness

This batch is ready for planning once the user approves the spec.

The next step after approval is to write an implementation plan that:

- sequences coordinator setup work
- defines exact file ownership for each agent
- sets verification steps after integration
