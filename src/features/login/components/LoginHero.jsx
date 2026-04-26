import { DemoAccountGrid } from "./DemoAccountGrid";

export function LoginHero({ accounts, onPick }) {
  return (
    <section className="login-hero">
      <div>
        <p className="eyebrow">Lakoo POS</p>
        <h1>POS Modern untuk UMKM Indonesia</h1>
        <p className="muted-text large-text">
          Kelola checkout, inventory, promosi, dan laporan penjualan dalam satu platform yang simpel dan powerful.
        </p>
      </div>

      <DemoAccountGrid accounts={accounts} onPick={onPick} />
    </section>
  );
}
