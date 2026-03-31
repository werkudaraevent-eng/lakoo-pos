# POS Workspace UI Refresh Design Spec

**Date:** 2026-03-31
**Scope:** UI/UX refresh for shell, dashboard, checkout, login flow, and event workspace model
**Primary screens:** Login, Workspace Picker, Dashboard, Checkout, Event Management, Event Closing
**Visual direction:** Modern retail utility inspired by Shopify POS patterns
**Target devices:** Desktop and tablet first, with responsive mobile support

## Goal

Redesign the product so it feels like a modern global POS platform instead of a spacious MVP dashboard. The system must support daily in-store usage and temporary bazaar operations without creating separate apps or fragmented workflows.

The refresh should solve two problems together:

- the current UI feels too loose, card-heavy, and not operationally efficient
- the current product model does not yet express event-based selling contexts with their own stock and reporting

## Product Intent

This product is an operational POS platform for fashion retail. It must feel fast, clear, and trustworthy for cashiers, managers, and admins. The UX should borrow the discipline of Shopify POS-style products:

- the active selling context is always obvious
- primary actions are singular and easy to reach
- the interface is dense enough to be efficient, but not cramped
- staff only see the workspaces they are allowed to use

The system must support both:

- `Main Store` operations
- temporary `Event` operations such as bazaars, pop-ups, and exhibitions

## Core Product Model

### Workspace

The product introduces a top-level operational concept called `Workspace`.

Workspace types:

- `Store`
- `Event`

Every operational page is scoped to the current workspace. Dashboard, checkout, inventory views, stock setup, and reports must all derive their data from the active workspace.

### Event Lifecycle

An event has four statuses:

- `Draft`
- `Active`
- `Closed`
- `Archived`

Status meanings:

- `Draft`: event is being prepared and can be configured
- `Active`: event is live and can process transactions
- `Closed`: event has completed the closure review and no longer accepts transactions
- `Archived`: event is finalized and read-only for history

### Event Stock Mode

Each event must choose exactly one stock mode during setup. The mode applies to the entire event and cannot be mixed per item.

Available stock modes:

- `Allocate from main stock`
- `Manual event stock`

Rules:

- stock mode is selected while the event is in `Draft`
- stock mode is locked once the event becomes `Active`
- users cannot combine both stock modes in the same event

This keeps the stock model understandable and prevents ambiguous reporting.

### Access Model

Workspace visibility is permission-based.

- `admin`: can access all relevant stores and events
- `manager`: can access assigned workspaces or store-scoped workspaces according to policy
- `cashier`: can access only assigned active workspaces

The product should support restricting events by user assignment so staff only see the workspaces relevant to their responsibilities.

## UX Principles

### 1. Context First

The user must always know where they are working. The current workspace should be visible in the shell at all times, including:

- workspace name
- workspace type
- event status when relevant
- stock mode when relevant

### 2. Operational Density

The UI should remove excess spacing and decorative weight from operational pages. Information density should increase by roughly 15-25% in the working areas compared with the current UI.

### 3. One Primary Action

Each major screen must have one dominant action. Example:

- checkout: finalize transaction
- event setup: activate event
- closing flow: confirm close

### 4. Safe State Transitions

Any change in operational context, especially workspace switching and event closing, must require clear confirmation if the action could interrupt active work or change stock state.

### 5. Role-Appropriate Entry

After workspace selection, landing routes should default by role:

- `cashier` -> `Checkout`
- `manager` -> `Dashboard`
- `admin` -> `Dashboard`, or `Event Management` if no actionable workspace is active

## Visual Direction

### Chosen Direction

`Modern retail utility`

This direction adapts the strengths of Shopify POS-style products without trying to clone their interface.

Key characteristics:

- clean and bright working canvas
- restrained accent usage
- tighter spacing in operational panels
- reduced card clutter
- simpler hierarchy for headings and utility text
- obvious active states for navigation, payment method, and selected workspace

### What Changes from the Current UI

- less editorial hero treatment in the app shell
- less decorative background noise
- smaller and more useful top-level panels
- fewer equally weighted cards competing for attention
- reduced reliance on oversized serif headers in operational screens
- more compact navigation and content structure

### Foundations

Color roles:

- `Surface`: main panel background
- `Canvas`: app background
- `Text`: primary text
- `Muted`: secondary text
- `Primary`: active action and selected state
- `Success`, `Warning`, `Danger`: semantic operational states

Typography principles:

- utility sans should lead operational content
- display styling should be minimal and reserved for high-level page identity
- currency, quantities, totals, and labels should prioritize scan speed over personality

Shape and spacing:

- medium radii, not oversized soft cards
- subtle shadows and clearer borders
- tighter stack spacing on dashboard and checkout

## Screen Architecture

### 1. Login

Purpose:

- authenticate the user quickly
- avoid excessive visual weight before entering the operational system

Layout:

- simplified split or centered layout
- compact brand block
- direct login form
- demo account shortcuts remain available during development, but visually secondary

Flow:

- successful login does not assume a single default dashboard route
- the next step is workspace resolution

### 2. Workspace Resolution

Purpose:

- determine the operational context before entering the app

Rules:

- if the user has only one valid workspace, enter it immediately
- if the user has multiple valid workspaces, show a `Workspace Picker`

Workspace card content:

- workspace name
- type: `Store` or `Event`
- status pill
- location or date range
- stock mode pill for event workspaces

Invalid states:

- `Draft` events are not available to cashiers for selling
- `Closed` and `Archived` events are not entry points for checkout

### 3. App Shell

Purpose:

- establish the persistent operational frame of the application

Structure:

- compact sidebar with grouped navigation
- top bar with workspace switcher and contextual information
- main content area optimized for workspace-scoped pages

Navigation groups:

- `Sell`: Checkout, Sales
- `Operations`: Dashboard, Inventory, Catalog, Promotions, Reports
- `Admin`: Users, Settings, Event Management

Top bar content:

- current workspace switcher
- event status when applicable
- small operational metadata instead of technical badges

Workspace switching:

- switching is allowed without logout
- if cart or other active session state would be lost, show a confirmation dialog first

### 4. Dashboard

Purpose:

- provide fast operational understanding of the current workspace

Desktop layout:

- top summary band with 3 key metrics
- left column: alerts and action-oriented operational issues
- right column: recent activity and short trend views

Metric priority:

- revenue today
- transactions
- low stock pressure

Secondary modules:

- top-selling items
- recent sales
- inventory movement
- event progress indicators when the workspace is an event

Cashier behavior:

- cashier may bypass dashboard entirely and land directly in checkout

### 5. Checkout

Purpose:

- become the fastest and clearest work surface in the product

Desktop layout:

- top: dominant search and quick context strip
- left: product discovery and quick-add surface
- right: sticky cart summary and finalize section
- bottom or secondary area: latest receipt confirmation

Key rules:

- search is the first visual anchor
- product cards show only high-value information
- low-stock signal is visible but not noisy
- grand total has the strongest hierarchy in the summary
- finalize action is singular and visually dominant

Tablet behavior:

- keep search and product discovery high in the viewport
- maintain persistent access to summary and finalize action
- use sticky or anchored total area where practical

Mobile behavior:

- one-column product list
- compact cart/summary block close to thumb reach
- do not merely stack the desktop layout without reprioritization

### 6. Event Management

Purpose:

- allow admin and manager users to manage event workspaces cleanly

Primary tasks:

- create event
- edit draft event
- assign staff
- choose stock mode
- configure event stock
- activate event
- close event through a guided flow
- archive finished events

Event list organization:

- grouped or filterable by lifecycle state
- status should be immediately visible
- draft and active events should be easiest to reach

Event detail sections:

- overview
- staffing and assignment
- stock mode
- stock setup
- activity summary
- lifecycle actions

### 7. Event Stock Setup

For `Allocate from main stock`:

- show main stock items available for allocation
- allow quantity transfer into event stock
- clearly display the transfer effect

For `Manual event stock`:

- show event-specific quantity entry without allocation from main stock
- make it explicit that quantities are tracked independently for the event

Because the stock mode is locked per event, the screen can stay simple and mode-specific instead of mixing controls.

### 8. Event Closing Flow

Purpose:

- safely finalize event operations before closure

Closing flow steps:

1. `Sales Summary`
2. `Remaining Stock`
3. `Cash/Card Reconciliation`

Step details:

- `Sales Summary`: revenue, transaction count, discount usage, payment split
- `Remaining Stock`: leftover quantities, return preparation, adjustment review
- `Cash/Card Reconciliation`: expected vs counted totals and confirmation state

Rules:

- event cannot move from `Active` to `Closed` without passing through this flow
- once closed, checkout is no longer available for the event
- archiving remains a separate later action

## Data and State Flow

### Workspace State

The app needs a persistent active workspace state available across routes. This state drives:

- route access
- API filtering
- shell context
- checkout behavior
- dashboard metrics
- report scoping

### Route Behavior

Current route defaults should be updated so authenticated users are not sent directly to a global dashboard without resolving workspace first.

Expected route sequence:

- `Login`
- `Workspace resolution`
- role-based landing route inside the chosen workspace

### Event State Constraints

Important constraints:

- `Draft` events can be configured but not used for live selling
- `Active` events can be used for selling and reporting
- `Closed` events are no longer sellable
- `Archived` events are historical only

## Error Handling and Guardrails

- prevent checkout entry for invalid or unavailable workspaces
- prevent workspace switching without confirmation when cart data exists
- prevent stock mode changes after activation
- prevent event closure without completing the closing flow
- show clear empty and unavailable states in workspace picker and event lists

## Testing Strategy

### Product Logic Tests

Add or update tests around:

- workspace resolution behavior
- role-based landing routes
- event lifecycle guards
- stock mode locking
- closing flow requirements
- workspace switch confirmation rules

### UI Verification

Validate:

- sidebar and top bar responsiveness
- dashboard density and hierarchy on desktop and tablet
- checkout summary visibility on desktop and tablet
- workspace picker behavior with one vs many workspaces
- event management states and transitions

## Implementation Priorities

1. Introduce workspace model in the app shell and routing flow
2. Add workspace picker and role-based landing behavior
3. Refresh shell visual system and navigation structure
4. Redesign dashboard hierarchy for workspace-scoped data
5. Redesign checkout for denser, clearer transaction flow
6. Add event management UI and stock mode flows
7. Add event closing flow and guards

## Success Criteria

The redesign is successful when:

- users always know which store or event they are operating in
- cashiers can reach checkout faster with less visual friction
- the shell feels like a modern POS product rather than a generic dashboard
- events can be created, activated, operated, closed, and archived through a clear lifecycle
- stock behavior for events is understandable and auditable
- dashboard and reports feel naturally scoped to the active workspace
