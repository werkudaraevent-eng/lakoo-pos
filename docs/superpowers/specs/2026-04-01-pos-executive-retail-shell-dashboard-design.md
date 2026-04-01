# POS Executive Retail Shell And Dashboard Design

Date: 2026-04-01
Status: Draft for user review

## Goal

Redesign the POS shell and dashboard so the product feels like a premium retail operations platform for manager and admin users, while preserving the current routing, workspace model, and data behavior.

This redesign should:

- align the shell with the stronger visual language already explored in Banani
- shift dashboard emphasis from generic operations summary to sales performance
- preserve fast operational access to checkout, sales, inventory, and events
- stay grounded in a modern luxury neutral tone rather than a colorful SaaS look

## Product Scope

This spec covers:

- main application shell
- workspace switcher presentation inside the shell
- dashboard page structure and hierarchy
- responsive behavior for shell and dashboard only

This spec does not change:

- backend behavior
- route structure
- workspace permission logic
- dashboard data sources

## Reference Inputs

### Banani References

The redesign should interpret the Banani flow `POS Bazar Fashion` as the main visual reference.

Observed reference direction:

- white and warm-neutral surfaces
- thin borders instead of soft translucent cards
- restrained accent usage
- compact shell chrome
- premium retail proportions and spacing
- visual hierarchy driven by typography and composition, not decorative gradients

Relevant selected reference:

- `POS Checkout`: strong reference for shell proportions, topbar restraint, and workspace card composition

### Existing App Constraints

The current app already has:

- route-grouped shell navigation
- workspace-aware dashboard behavior
- event-aware dashboard states
- reusable dashboard summary helpers

The redesign should reuse those behaviors and replace presentation only.

## User And Outcome

### Primary User

- manager
- admin

### Primary Outcome

Enable manager and admin users to understand current sales performance first, then scan supporting operational signals without feeling buried in a generic admin dashboard.

## Design Direction

### Visual Mood

The shell and dashboard should feel:

- premium
- neutral
- composed
- operational
- fashion-adjacent without becoming editorial fluff

The UI should avoid:

- loud accents
- playful badges
- glassmorphism
- gradient-heavy hero cards
- overly soft, pastel dashboard styling

### Visual System

Use a modern luxury neutral palette:

- background: warm ivory or soft stone
- panel: off-white
- text: charcoal
- secondary text: taupe-gray
- accent: deep espresso, graphite, or muted olive-charcoal
- success and warning colors remain semantic but subdued

Use medium radii, thin borders, and almost invisible shadows. Panels should separate through contrast and structure rather than blur or elevation.

### Typography

Typography should create the premium feel.

- shell labels: compact uppercase or tightly tracked micro-labels
- page titles: confident but not oversized
- KPI numbers: large enough to dominate the dashboard hero
- supporting copy: short and quiet

The result should feel sharper and more fashion-retail than the current Manrope-heavy utility layout.

## Shell Design

### Structure

Desktop shell should remain a two-column application frame:

- left: persistent sidebar
- right: topbar plus page canvas

The shell should use a thinner, more refined operating frame than the current implementation.

### Sidebar

The sidebar should present:

- compact brand block
- grouped navigation
- workspace context card
- user identity and logout

Design rules:

- warm light background with thin right divider
- active item shown with a filled neutral capsule or rounded block
- inactive items stay quiet and compact
- nav descriptions may remain, but visually lighter than labels
- no teal gradient badge treatment

### Brand Block

Brand treatment should be understated:

- smaller badge or monogram
- restrained uppercase support label
- product name treated like an operating system label, not a marketing hero

### Workspace Switcher

The workspace switcher should feel like system context, not a utility widget.

Required content:

- active workspace name
- workspace type
- lifecycle or status
- stock mode when applicable
- switch action

Design rules:

- card should visually match the checkout reference from Banani
- hierarchy should emphasize workspace name first
- badges should be reduced to 2 or 3 maximum
- switch action should feel secondary but always visible

### Topbar

The topbar should become a light context strip.

Required content:

- current route eyebrow
- route title
- concise route description
- user role and sign-in context

Design rules:

- topbar should not look like a standalone hero card
- reduce visual weight and height
- keep enough white space for clarity

## Dashboard Design

### Strategic Intent

The dashboard should become an executive retail overview with sales performance at the top and operational context beneath it.

Priority order:

1. sales performance
2. product momentum
3. workspace health
4. alerts

### Layout Blueprint

Desktop dashboard should use this order:

1. compact dashboard header
2. quick action strip
3. performance hero band
4. insight grid
5. event module when the active workspace is an event

### Header

The dashboard header should be compact and aligned with the shell tone.

Required content:

- dashboard eyebrow
- page title using the active workspace name when available
- one concise sentence describing the current page purpose
- workspace type and status chips

This header should orient the user, not dominate the page.

### Quick Action Strip

The quick action strip should remain visible near the top of the page and preserve current navigation behavior.

Expected actions:

- Open checkout
- View sales
- Adjust stock
- View events or Close event depending on workspace state

Design rules:

- actions look like premium utility pills or compact buttons
- visual emphasis lower than the KPI hero
- warning tone reserved only for event closing action

### Performance Hero Band

This is the primary visual block on the dashboard.

Required KPI content:

- Revenue today
- Transactions
- Average order value
- Discount total

If average order value is not yet available from a helper, compute it locally from existing sales totals and transaction count.

Composition rules:

- revenue should be the dominant figure
- supporting KPI cards should align beside or below the primary figure
- performance band should feel structured and premium, not like four equal generic cards
- copy should stay concise and numeric-first

### Insight Grid

Below the hero, the dashboard should expose supporting insight panels.

Required panels:

- Top products
- Recent sales
- Stock watchlist
- Workspace activity

Panel priorities:

- `Top products` is the strongest secondary panel
- `Recent sales` supports transaction monitoring
- `Stock watchlist` is present but not dominant
- `Workspace activity` surfaces recent inventory movements or event status context

### Event Module

If the active workspace is an event and event progress exists, render a dedicated secondary module.

Required content:

- event name
- phase
- progress percent
- remaining time

Design rules:

- event module sits below the main sales hero, not above it
- progress treatment should feel refined and restrained
- the module should read as context, not emergency

## Content And Copy Principles

- copy should be shorter than the current dashboard
- labels should be precise and operational
- empty states should feel calm and premium, not technical
- repeated explanatory paragraphs should be removed

Examples of desired tone:

- `Revenue today`
- `Top products`
- `Recent sales`
- `Stock watchlist`
- `Workspace activity`

Avoid long marketing copy or tutorial-like text inside the dashboard.

## Responsive Behavior

### Desktop

- sidebar remains persistent
- performance hero may use asymmetric grid composition
- insight panels can sit in two columns

### Tablet

- sidebar collapses or becomes secondary
- dashboard hero stacks more vertically
- action strip wraps cleanly

### Mobile

- shell becomes drawer plus compact topbar
- KPI hero stacks in a single column
- insight panels become a single stream
- revenue remains the first visible metric block

Mobile is not the primary target for this redesign, but the hierarchy must survive without becoming cramped.

## Implementation Notes

Primary implementation targets:

- `src/components/AppShell.jsx`
- `src/features/workspaces/components/WorkspaceSwitcher.jsx`
- `src/pages/DashboardPage.jsx`
- `src/styles.css`
- `src/features/dashboard/dashboardWorkspace.js`

Expected implementation approach:

- keep route metadata and current command logic unless a small helper expansion is needed
- add local presentation logic for average order value if not already exposed
- refactor CSS tokens toward warm neutral surfaces and sharper hierarchy
- preserve existing page structure for non-dashboard routes unless shell styling affects them

## Success Criteria

The redesign is successful when:

- the app shell feels consistent with the Banani checkout direction
- the dashboard reads as sales-first rather than alert-first
- manager and admin users can identify revenue and transaction performance immediately
- workspace context feels integrated into the shell
- the result feels premium and neutral rather than like a generic admin template
