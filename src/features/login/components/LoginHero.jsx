import { DemoAccountGrid } from "./DemoAccountGrid";

export function LoginHero({ accounts, onPick }) {
  return (
    <section className="login-hero">
      <div>
        <p className="eyebrow">Fashion Retail POS</p>
        <h1>Control checkout, stock, promos, and reports in one platform.</h1>
        <p className="muted-text large-text">
          Ini sekarang berupa aplikasi POS demo dengan backend API dan database lokal untuk workflow single-store
          fashion retail.
        </p>
      </div>

      <DemoAccountGrid accounts={accounts} onPick={onPick} />
    </section>
  );
}
