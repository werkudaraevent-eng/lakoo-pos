# POS Near-Full Visual Reset Design

Date: 2026-04-01
Status: Draft for user review

## Goal

Redesign the current POS UI so it no longer feels like a generic SaaS dashboard and instead feels like a modern, global retail POS platform: cleaner, denser, more professional, and faster to use in daily operations.

This reset should preserve the existing product model:

- workspace-aware POS
- store and event workflows
- role-based routing
- checkout, sales, inventory, reports, and event operations

The reset should change the visual language and interaction structure aggressively enough that the product feels genuinely new, not merely polished.

## Design Intent

The new UI should feel like a retail operations system, not a presentation dashboard.

Core intent:

- prioritize operational clarity over decorative cards
- reduce empty space in working surfaces
- make workspace context feel central and always legible
- adopt list and split-pane patterns where users scan and act quickly
- keep the product light, modern, and calm rather than glossy or over-styled

## References And Interpretation

The redesign takes structure and layout cues from modern POS references and retail operations software, especially split-pane transaction views, denser list surfaces, and quieter shell navigation.

Important interpretation:

- use the structure and ergonomics of strong references
- do not copy their branding, exact colors, or logos
- keep a distinct brand identity for this POS

## Visual Direction

### Overall Look

- flat light UI
- white and soft-gray operational canvas
- minimal gradients and minimal visual texture
- restrained accent usage
- stronger borders, lighter shadows
- controlled rounded corners

### Typography

- headings should be smaller and more disciplined than the current version
- metadata and labels should be more compact and consistent
- body text should be shorter and more functional
- large hero-like type should be avoided on working pages

### Spacing

- compress vertical spacing across shell and data pages
- leave breathing room only where it helps orientation
- remove large stacked hero cards and repeated intros

### Status System

- use smaller semantic chips for workspace, role, lifecycle, payment, and stock state
- reduce chip count per surface
- keep chip color mapping consistent across pages

## Layout Principles

### Shell

The app shell should feel like a thin operating frame.

- narrower sidebar
- shorter topbar
- workspace context visible, compact, and persistent
- nav labels concise and quieter
- less copy inside shell chrome

### Data Surfaces

Operational pages should shift from card-heavy layouts to list and table-driven layouts.

- use split-pane layouts for selection and detail
- use toolbar-first filtering
- use sticky detail or action panels where appropriate
- avoid separate oversized cards for filters, pagination, and summary when they can be integrated

### Workspace Context

Workspace information should appear like a system context, not a decorative module.

- current workspace name
- workspace type
- lifecycle status
- stock mode when relevant
- fast switch affordance

## Page Blueprint

### Dashboard

The dashboard should become a command surface, not a wall of large cards.

Structure:

- compact header with workspace context
- action strip for key tasks
- left column for today metrics and alerts
- right column for activity, readiness, and quick operational state

For event workspaces, highlight:

- event progress
- stock pressure
- closing readiness

### Sales

Sales should follow a split-pane transaction workspace pattern.

Structure:

- top toolbar with search, payment filter, result count, and page controls
- left pane: receipt list
- right pane: selected receipt detail

List content:

- receipt number
- cashier
- time
- payment method
- total

Detail content:

- receipt summary
- itemized line list
- totals
- print action

This page should feel much closer to modern billing and transaction workspaces than to a generic card list.

### Inventory

Inventory should become a stock-control workspace.

Structure:

- toolbar with search, category, low-stock filters, and workspace scope
- left pane: stock list
- right pane: adjustment and movement action panel

The stock list should emphasize scanability:

- product and variant
- quantity on hand
- threshold
- status

For event workspaces, the page must clearly show that stock belongs to the event scope, not to the global store.

### Events

Events should move from a card-grid feel to an operations view.

Structure:

- event list or table on the left
- event detail panel on the right

Each event row should show:

- name
- location
- date range
- stock mode
- lifecycle status

The detail panel should expose:

- overview
- team assignment summary
- stock setup summary
- lifecycle actions
- closing review entry point

### Checkout

Checkout remains the highest-priority work surface for cashiers.

Structure:

- dominant search surface
- product browsing on the left
- sticky cart and payment summary on the right

Design goals:

- flatter UI
- tighter visual density
- stronger total hierarchy
- clearer finalize action
- less badge noise

### Reports

Reports should feel like analytical operations pages, not summary cards.

Structure:

- compact header with workspace scope
- metrics in tighter bands
- tables or ranked lists for revenue, payment mix, and top items

### Login And Workspace Picker

These pages should also be redesigned to match the new system tone.

Login:

- simpler, more professional, less editorial
- minimal split layout or centered shell

Workspace picker:

- cleaner operational selector
- stronger distinction between store and event workspaces

## Interaction Principles

- search and filters should live in a toolbar, not in isolated hero cards
- selection state should be immediate and obvious
- detail panels should update without navigation churn where possible
- sticky panels should be used for summary and action-heavy workflows
- important CTA placement should remain stable across pages

## Anti-Patterns To Remove

- oversized header cards stacked on top of each other
- excessive whitespace in operational pages
- card-first layouts for history and inventory
- decorative shell copy that competes with actual work
- repeated explanatory text on every page
- equally weighted panels with weak hierarchy
- overly soft or washed-out active states

## Responsive Strategy

Desktop:

- split-pane and multi-column layouts should dominate

Tablet:

- preserve quick access to selection and detail
- keep primary action and summary visible without long scrolling

Mobile is secondary for this phase, but layouts should still degrade cleanly.

## Implementation Scope

This reset should cover:

- shell
- dashboard
- sales
- inventory
- events
- reports
- checkout refinement
- login and workspace picker visual alignment

## Recommended Delivery Order

1. visual system foundations and shell
2. sales
3. inventory
4. events
5. dashboard
6. reports
7. checkout refinement
8. login and workspace picker alignment

## Success Criteria

The redesign is successful when:

- the app no longer reads visually as a generic dashboard
- operational pages feel denser and more professional
- users can scan receipts, stock, and event data faster
- workspace context is always obvious
- the product feels closer to a modern retail POS than to an admin template
