import { DemoAccountGrid } from "./DemoAccountGrid";

export function LoginHero({ accounts, onPick }) {
  return (
    <section className="login-hero">
      <div className="login-hero-brand">
        <div className="login-hero-logo">L</div>
        <span className="login-hero-brand-text">Lakoo.</span>
      </div>

      <div className="login-hero-content">
        <h1 className="login-hero-title">
          POS Modern untuk
          <br />
          Bisnis Indonesia
        </h1>
        <p className="login-hero-subtitle">
          Kelola penjualan, inventory, dan laporan bisnis Anda dalam satu platform yang simpel dan powerful.
        </p>

        <div className="login-hero-features">
          <div className="login-hero-feature">
            <span className="login-hero-feature-icon">⚡</span>
            <span>Checkout cepat dengan barcode & search</span>
          </div>
          <div className="login-hero-feature">
            <span className="login-hero-feature-icon">📊</span>
            <span>Laporan real-time & analitik penjualan</span>
          </div>
          <div className="login-hero-feature">
            <span className="login-hero-feature-icon">🏪</span>
            <span>Multi-outlet & event management</span>
          </div>
          <div className="login-hero-feature">
            <span className="login-hero-feature-icon">☁️</span>
            <span>Cloud-based, akses dari mana saja</span>
          </div>
        </div>
      </div>

      <div className="login-demo-section">
        <p>Demo accounts</p>
        <DemoAccountGrid accounts={accounts} onPick={onPick} />
      </div>
    </section>
  );
}
