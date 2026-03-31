# Login + Checkout Parallel Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor and polish the `Login` and `Checkout` pages into feature-local, reusable UI slices that can be implemented in parallel without breaking the existing auth and checkout flows.

**Architecture:** Keep `src/pages/LoginPage.jsx` and `src/pages/CheckoutPage.jsx` as thin orchestration layers that own state, side effects, and workflow logic. Move presentation into `src/features/login/*` and `src/features/checkout/*` with feature-scoped CSS files so the two page implementations can proceed independently and the coordinator can align final visuals afterward.

**Tech Stack:** React 19, React Router 7, Vite 7, plain CSS, existing `AuthContext` and `PosDataContext`

---

## Current Constraints

- The workspace is not currently a git repository, so commit steps are optional and only apply if git is initialized before execution.
- There is no dedicated frontend test harness in the current repo. For this batch, verification uses `npm run build` plus focused manual flow checks in the running app.
- Do not change backend contracts, auth payload shapes, or checkout business rules in this batch.

## File Structure Map

### Existing files to modify

- `src/pages/LoginPage.jsx`
  - Keep login state, submit handler, redirect destination logic
  - Import feature-local login components and CSS
- `src/pages/CheckoutPage.jsx`
  - Keep cart state, promo state, payment state, receipt state, and sale finalization logic
  - Import feature-local checkout components and CSS
- `src/styles.css`
  - Keep only global tokens, shell layout, and app-wide primitives
  - Remove or trim page-specific rules that move into feature-local CSS

### New login feature files

- `src/features/login/components/LoginHero.jsx`
  - Left-side editorial hero section
- `src/features/login/components/DemoAccountGrid.jsx`
  - Demo account picker cards
- `src/features/login/components/LoginForm.jsx`
  - Sign-in card with inputs and submit button
- `src/features/login/login.css`
  - All login-specific layout and visual rules

### New checkout feature files

- `src/features/checkout/components/ProductSearchPanel.jsx`
  - Search input and section header
- `src/features/checkout/components/ProductGrid.jsx`
  - Product card rendering
- `src/features/checkout/components/CartSummary.jsx`
  - Cart list, promo input, payment toggle, totals, and finalize CTA
- `src/features/checkout/components/LatestReceipt.jsx`
  - Post-submit receipt preview block
- `src/features/checkout/checkout.css`
  - All checkout-specific layout and visual rules

## Task 1: Refactor Login Into Feature-Local Components

**Owner:** Agent Login

**Files:**
- Create: `src/features/login/components/LoginHero.jsx`
- Create: `src/features/login/components/DemoAccountGrid.jsx`
- Create: `src/features/login/components/LoginForm.jsx`
- Create: `src/features/login/login.css`
- Modify: `src/pages/LoginPage.jsx`
- Verify: `npm run build`

- [ ] **Step 1: Read the current page and preserve behavior contract**

Open `src/pages/LoginPage.jsx` and keep these unchanged at the page level:

```jsx
const destination = location.state?.from || "/dashboard";

async function handleSubmit(event) {
  event.preventDefault();
  const result = await login(form);

  if (!result.ok) {
    setError(result.message);
    return;
  }

  navigate(destination, { replace: true });
}
```

Expected outcome:
- demo account buttons still fill the form
- auth failure still sets local error text
- success still redirects to `location.state?.from || "/dashboard"`

- [ ] **Step 2: Create the login feature stylesheet**

Create `src/features/login/login.css` with scoped class names only:

```css
.login-page {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  min-height: 100vh;
  gap: 24px;
  padding: 24px;
}

.login-hero,
.login-form-shell {
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow);
}

.login-hero {
  display: grid;
  gap: 28px;
  padding: 42px;
  color: #fff7f0;
  background:
    radial-gradient(circle at top right, rgba(203, 90, 45, 0.42), transparent 30%),
    linear-gradient(180deg, #162126 0%, #10181c 100%);
}

.login-form-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: var(--panel-strong);
}

.login-demo-grid {
  display: grid;
  gap: 16px;
}

.login-demo-card {
  display: grid;
  gap: 4px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  text-align: left;
  color: inherit;
  background: rgba(255, 255, 255, 0.08);
}

.login-card {
  width: min(100%, 460px);
  display: grid;
  gap: 18px;
}

@media (max-width: 980px) {
  .login-page {
    grid-template-columns: 1fr;
  }
}
```

Run:

```powershell
Get-Content .\src\features\login\login.css
```

Expected: file exists and contains only `login-*` selectors

- [ ] **Step 3: Create `LoginHero.jsx`**

Create `src/features/login/components/LoginHero.jsx`:

```jsx
export function LoginHero() {
  return (
    <section className="login-hero">
      <div>
        <p className="eyebrow">Fashion Retail POS</p>
        <h1>Control checkout, stock, promos, and reports in one platform.</h1>
        <p className="muted-text large-text">
          Ini sekarang berupa aplikasi POS demo dengan backend API dan database lokal untuk workflow single-store fashion retail.
        </p>
      </div>
    </section>
  );
}
```

Run:

```powershell
Get-Content .\src\features\login\components\LoginHero.jsx
```

Expected: component is present with no auth or navigation logic

- [ ] **Step 4: Create `DemoAccountGrid.jsx`**

Create `src/features/login/components/DemoAccountGrid.jsx`:

```jsx
export function DemoAccountGrid({ accounts, onPick }) {
  return (
    <div className="login-demo-grid">
      {accounts.map((account) => (
        <button
          className="login-demo-card"
          key={account.role}
          onClick={() => onPick(account)}
          type="button"
        >
          <strong>{account.role}</strong>
          <span>{account.username}</span>
          <small>{account.password}</small>
        </button>
      ))}
    </div>
  );
}
```

Run:

```powershell
Get-Content .\src\features\login\components\DemoAccountGrid.jsx
```

Expected: component is prop-driven and contains no `useState`

- [ ] **Step 5: Expand `LoginHero.jsx` to compose the demo account grid**

Update `src/features/login/components/LoginHero.jsx`:

```jsx
import { DemoAccountGrid } from "./DemoAccountGrid";

export function LoginHero({ accounts, onPick }) {
  return (
    <section className="login-hero">
      <div>
        <p className="eyebrow">Fashion Retail POS</p>
        <h1>Control checkout, stock, promos, and reports in one platform.</h1>
        <p className="muted-text large-text">
          Ini sekarang berupa aplikasi POS demo dengan backend API dan database lokal untuk workflow single-store fashion retail.
        </p>
      </div>

      <DemoAccountGrid accounts={accounts} onPick={onPick} />
    </section>
  );
}
```

Run:

```powershell
Get-Content .\src\features\login\components\LoginHero.jsx
```

Expected: hero composes grid; page still owns form state

- [ ] **Step 6: Create `LoginForm.jsx`**

Create `src/features/login/components/LoginForm.jsx`:

```jsx
export function LoginForm({ form, authLoading, error, onChange, onSubmit }) {
  return (
    <section className="login-form-shell">
      <div className="login-card">
        <div>
          <p className="eyebrow">Sign In</p>
          <h2>Masuk ke workspace POS</h2>
          <p className="muted-text">Gunakan akun demo di samping untuk mencoba role berbeda.</p>
        </div>

        <form className="form-stack" onSubmit={onSubmit}>
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={(event) => onChange("username", event.target.value)} />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="primary-button" disabled={authLoading} type="submit">
            {authLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </section>
  );
}
```

Run:

```powershell
Get-Content .\src\features\login\components\LoginForm.jsx
```

Expected: component takes handlers via props and does not import context

- [ ] **Step 7: Rewrite `src/pages/LoginPage.jsx` as an orchestration layer**

Replace the render structure in `src/pages/LoginPage.jsx` with:

```jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { LoginHero } from "../features/login/components/LoginHero";
import { LoginForm } from "../features/login/components/LoginForm";
import "../features/login/login.css";

const demoAccounts = [
  { role: "Admin", username: "admin", password: "admin123" },
  { role: "Manager", username: "manager", password: "manager123" },
  { role: "Cashier", username: "cashier", password: "cashier123" },
];

export function LoginPage() {
  const { login, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "cashier", password: "cashier123" });
  const [error, setError] = useState("");

  const destination = location.state?.from || "/dashboard";

  function handleFieldChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleDemoPick(account) {
    setForm({ username: account.username, password: account.password });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await login(form);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate(destination, { replace: true });
  }

  return (
    <div className="login-page">
      <LoginHero accounts={demoAccounts} onPick={handleDemoPick} />
      <LoginForm
        form={form}
        authLoading={authLoading}
        error={error}
        onChange={handleFieldChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

Run:

```powershell
Get-Content .\src\pages\LoginPage.jsx
```

Expected: page keeps state and workflow logic, but no longer contains large UI blocks

- [ ] **Step 8: Verify login refactor**

Run:

```powershell
npm run build
```

Expected: Vite build completes successfully

Manual verification:
- open `/login`
- click each demo account card and verify the fields update
- submit invalid credentials and confirm the error still renders
- submit a valid account and confirm redirect still works

- [ ] **Step 9: Commit if git is available**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

Expected in current workspace: command fails because git is not initialized

If git is initialized before execution, run:

```bash
git add src/pages/LoginPage.jsx src/features/login
git commit -m "feat: refactor login into feature-local components"
```

## Task 2: Refactor Checkout Into Feature-Local Components

**Owner:** Agent Checkout

**Files:**
- Create: `src/features/checkout/components/ProductSearchPanel.jsx`
- Create: `src/features/checkout/components/ProductGrid.jsx`
- Create: `src/features/checkout/components/CartSummary.jsx`
- Create: `src/features/checkout/components/LatestReceipt.jsx`
- Create: `src/features/checkout/checkout.css`
- Modify: `src/pages/CheckoutPage.jsx`
- Verify: `npm run build`

- [ ] **Step 1: Preserve the checkout state and calculation contract**

Keep these concerns in `src/pages/CheckoutPage.jsx`:

```jsx
const [query, setQuery] = useState("");
const [cart, setCart] = useState([]);
const [promoCode, setPromoCode] = useState("");
const [paymentMethod, setPaymentMethod] = useState("cash");
const [message, setMessage] = useState("");
const [receiptSale, setReceiptSale] = useState(null);
const [submitting, setSubmitting] = useState(false);

const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
const matchedPromo = promotions.find((promo) => promo.code === promoCode.toUpperCase() && promo.isActive);
```

Expected outcome:
- no cart logic moves into presentational components
- promo and receipt behavior stay unchanged

- [ ] **Step 2: Create the checkout feature stylesheet**

Create `src/features/checkout/checkout.css`:

```css
.checkout-page {
  display: grid;
  gap: 18px;
}

.checkout-hero {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.checkout-layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 18px;
}

.checkout-products-card,
.checkout-summary-card,
.checkout-receipt-card {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.checkout-product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.checkout-product-card {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 16px;
  text-align: left;
  background: rgba(255, 255, 255, 0.58);
}

@media (max-width: 980px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .checkout-product-grid {
    grid-template-columns: 1fr;
  }
}
```

Run:

```powershell
Get-Content .\src\features\checkout\checkout.css
```

Expected: file exists with `checkout-*` scoped selectors only

- [ ] **Step 3: Create `ProductSearchPanel.jsx`**

Create `src/features/checkout/components/ProductSearchPanel.jsx`:

```jsx
export function ProductSearchPanel({ query, onQueryChange, children }) {
  return (
    <article className="checkout-products-card">
      <div className="panel-head">
        <h2>Product lookup</h2>
      </div>

      <label className="field">
        <span>Search product or SKU</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="AST-BLK-M atau Aster"
        />
      </label>

      {children}
    </article>
  );
}
```

- [ ] **Step 4: Create `ProductGrid.jsx`**

Create `src/features/checkout/components/ProductGrid.jsx`:

```jsx
import { formatCurrency } from "../../../utils/formatters";

export function ProductGrid({ variants, onAdd }) {
  return (
    <div className="checkout-product-grid">
      {variants.map((variant) => (
        <button className="checkout-product-card" key={variant.id} onClick={() => onAdd(variant)} type="button">
          <div className="product-card-head">
            <strong>{variant.productName}</strong>
            <span className={variant.quantityOnHand <= variant.lowStockThreshold ? "pill-warning" : "pill-strong"}>
              {variant.quantityOnHand} pcs
            </span>
          </div>
          <p className="muted-text">
            {variant.size} / {variant.color} - {variant.sku}
          </p>
          <strong>{formatCurrency(variant.price)}</strong>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create `CartSummary.jsx`**

Create `src/features/checkout/components/CartSummary.jsx`:

```jsx
import { formatCurrency } from "../../../utils/formatters";

export function CartSummary({
  cart,
  promoCode,
  paymentMethod,
  subtotal,
  discount,
  grandTotal,
  message,
  submitting,
  onPromoChange,
  onPaymentMethodChange,
  onUpdateQty,
  onFinalize,
}) {
  return (
    <aside className="checkout-summary-card">
      <div className="panel-head">
        <h2>Cart summary</h2>
        <span className="badge-soft">{cart.length} items</span>
      </div>

      <div className="stack-list">
        {cart.length === 0 ? <p className="muted-text">Belum ada item di cart.</p> : null}
        {cart.map((item) => (
          <div className="cart-item" key={item.variantId}>
            <div>
              <strong>{item.productName}</strong>
              <p className="muted-text">
                {item.size} / {item.color} - {item.sku}
              </p>
            </div>
            <div className="qty-control">
              <button type="button" onClick={() => onUpdateQty(item.variantId, item.qty - 1)}>
                -
              </button>
              <span>{item.qty}</span>
              <button type="button" onClick={() => onUpdateQty(item.variantId, item.qty + 1)}>
                +
              </button>
            </div>
            <strong>{formatCurrency(item.price * item.qty)}</strong>
          </div>
        ))}
      </div>

      <label className="field">
        <span>Promo code</span>
        <input value={promoCode} onChange={(event) => onPromoChange(event.target.value.toUpperCase())} />
      </label>

      <div className="payment-toggle">
        {["cash", "card"].map((method) => (
          <button
            className={`toggle-chip${paymentMethod === method ? " is-selected" : ""}`}
            key={method}
            onClick={() => onPaymentMethodChange(method)}
            type="button"
          >
            {method}
          </button>
        ))}
      </div>

      <div className="summary-box">
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>Discount</span>
          <strong>{formatCurrency(discount)}</strong>
        </div>
        <div className="summary-row total">
          <span>Grand total</span>
          <strong>{formatCurrency(grandTotal)}</strong>
        </div>
      </div>

      {message ? <p className="info-text">{message}</p> : null}

      <button className="primary-button" disabled={submitting} onClick={onFinalize} type="button">
        {submitting ? "Saving..." : "Finalize sale"}
      </button>
    </aside>
  );
}
```

- [ ] **Step 6: Create `LatestReceipt.jsx`**

Create `src/features/checkout/components/LatestReceipt.jsx`:

```jsx
import { Link } from "react-router-dom";

import { formatCurrency } from "../../../utils/formatters";

export function LatestReceipt({ sale }) {
  if (!sale) {
    return null;
  }

  return (
    <section className="checkout-receipt-card">
      <div className="panel-head">
        <h2>Latest receipt</h2>
        <div className="inline-actions">
          <span className="pill-strong">{sale.receiptNumber}</span>
          <Link className="secondary-button small-button receipt-link-button" to={`/sales/${sale.id}/receipt`}>
            Print view
          </Link>
        </div>
      </div>

      <div className="receipt-items">
        {sale.items.map((item) => (
          <div className="receipt-item" key={`${item.variantId}-${item.skuSnapshot}`}>
            <div>
              <strong>{item.productNameSnapshot}</strong>
              <p className="muted-text">
                {item.sizeSnapshot}/{item.colorSnapshot} - {item.skuSnapshot}
              </p>
            </div>
            <div className="receipt-item-meta">
              <span>
                {item.qty} x {formatCurrency(item.unitPriceSnapshot)}
              </span>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Rewrite `src/pages/CheckoutPage.jsx` as an orchestration layer**

Update imports and render structure so the page composes the new components:

```jsx
import { startTransition, useDeferredValue, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { ProductSearchPanel } from "../features/checkout/components/ProductSearchPanel";
import { ProductGrid } from "../features/checkout/components/ProductGrid";
import { CartSummary } from "../features/checkout/components/CartSummary";
import { LatestReceipt } from "../features/checkout/components/LatestReceipt";
import "../features/checkout/checkout.css";
```

Use this render shape:

```jsx
return (
  <div className="checkout-page">
    <section className="checkout-hero">
      <div>
        <p className="eyebrow">Checkout</p>
        <h1>Fast variant-based transaction flow.</h1>
        <p className="muted-text">
          Cari produk atau SKU, tambah ke cart, validasi promo, lalu finalisasi pembayaran cash atau card.
        </p>
      </div>
    </section>

    {loading ? <p className="info-text">Loading catalog and promotions...</p> : null}
    {loadError ? <p className="error-text">{loadError}</p> : null}

    <section className="checkout-layout">
      <ProductSearchPanel query={query} onQueryChange={setQuery}>
        <ProductGrid variants={visibleProducts} onAdd={addToCart} />
      </ProductSearchPanel>

      <CartSummary
        cart={cart}
        promoCode={promoCode}
        paymentMethod={paymentMethod}
        subtotal={subtotal}
        discount={discount}
        grandTotal={grandTotal}
        message={message}
        submitting={submitting}
        onPromoChange={setPromoCode}
        onPaymentMethodChange={setPaymentMethod}
        onUpdateQty={updateQty}
        onFinalize={handleCheckout}
      />
    </section>

    <LatestReceipt sale={receiptSale} />
  </div>
);
```

Expected: all workflow logic stays in the page, but presentational chunks move out

- [ ] **Step 8: Verify checkout refactor**

Run:

```powershell
npm run build
```

Expected: Vite build completes successfully

Manual verification:
- open `/checkout`
- search with blank query and with a specific SKU or product term
- add items to cart
- increase and decrease qty
- enter a promo code and verify total changes
- finalize a sale and confirm latest receipt renders

- [ ] **Step 9: Commit if git is available**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

Expected in current workspace: command fails because git is not initialized

If git is initialized before execution, run:

```bash
git add src/pages/CheckoutPage.jsx src/features/checkout
git commit -m "feat: refactor checkout into feature-local components"
```

## Task 3: Coordinator Alignment Pass For Shared Styles

**Owner:** Coordinator

**Files:**
- Modify: `src/styles.css`
- Verify: `npm run build`

- [ ] **Step 1: Identify which selectors are still truly global**

Keep these categories in `src/styles.css`:

```css
:root { /* tokens */ }
* { box-sizing: border-box; }
html, body, #root { min-height: 100%; }
body { /* global background and typography */ }
.app-shell { /* app shell layout */ }
.sidebar { /* shell */ }
.topbar-app { /* shell */ }
.field, .form-stack, .primary-button, .secondary-button, .ghost-button { /* shared primitives */ }
```

Expected: global file remains responsible only for tokens, shell, and shared primitives

- [ ] **Step 2: Remove or trim page-specific login rules from `src/styles.css`**

Delete or reduce the old login-specific block ownership:

```css
.login-screen { ... }
.login-panel { ... }
.login-panel-primary { ... }
.login-card { ... }
.demo-grid { ... }
.demo-card { ... }
```

Expected: login-specific layout rules now live in `src/features/login/login.css`

- [ ] **Step 3: Remove or trim page-specific checkout rules from `src/styles.css`**

Delete or reduce the old checkout-specific block ownership:

```css
.checkout-layout { ... }
.checkout-sidebar { ... }
.catalog-grid { ... } /* only if checkout-specific usage was the reason it existed */
.product-card { ... } /* only if now replaced by checkout-scoped classes */
```

Expected: checkout page now depends primarily on `checkout.css` for layout and card styling

- [ ] **Step 4: Run final shared-style verification**

Run:

```powershell
npm run build
```

Expected: build passes and no missing CSS import errors appear

- [ ] **Step 5: Commit if git is available**

If git is initialized before execution, run:

```bash
git add src/styles.css
git commit -m "chore: reduce page-specific rules from global stylesheet"
```

## Task 4: Final Integration And Responsive Verification

**Owner:** Coordinator

**Files:**
- Modify if needed: `src/pages/LoginPage.jsx`
- Modify if needed: `src/pages/CheckoutPage.jsx`
- Modify if needed: `src/features/login/login.css`
- Modify if needed: `src/features/checkout/checkout.css`
- Verify: `npm run build`

- [ ] **Step 1: Compare both pages for visual consistency**

Check that both pages share:

- similar panel depth and radius usage
- consistent button weight and input treatment
- related spacing rhythm
- the same retail-editorial tone

If needed, adjust only the smallest set of feature-local styles required to align them.

- [ ] **Step 2: Verify desktop rendering**

Run:

```powershell
npm run dev
```

Expected: Vite dev server starts successfully

Manual verification at desktop width:
- `/login` shows strong hero + form split
- `/checkout` shows clear discovery + summary split
- no overlaps or clipped text

- [ ] **Step 3: Verify mobile rendering**

Manual verification at narrow width:
- login stacks hero above form cleanly
- demo account cards remain tappable
- checkout stacks product area above summary
- cart rows and receipt rows do not overflow horizontally

- [ ] **Step 4: Run final build**

Run:

```powershell
npm run build
```

Expected: build passes with no regressions introduced by the coordinator pass

- [ ] **Step 5: Commit if git is available**

If git is initialized before execution, run:

```bash
git add src/pages/LoginPage.jsx src/pages/CheckoutPage.jsx src/features/login src/features/checkout src/styles.css
git commit -m "feat: align login and checkout feature-local UI refactors"
```

## Spec Coverage Check

- Parallel-safe ownership: covered by Task 1, Task 2, and Task 3 file ownership
- Login polish and responsive cleanup: covered by Task 1
- Checkout polish and responsive cleanup: covered by Task 2
- Feature-local reusable components: covered by Task 1 and Task 2
- Keep page files as orchestration layers: covered by Task 1 Step 7 and Task 2 Step 7
- Final cross-feature alignment and verification: covered by Task 3 and Task 4

