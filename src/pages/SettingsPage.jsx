import { useEffect, useState } from "react";

import { apiGet } from "../api/client";
import { usePosData } from "../context/PosDataContext";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
}

const PLAN_LABELS = { trial: "Trial (14 hari)", starter: "Starter — Rp 99rb/bln", pro: "Pro — Rp 249rb/bln", business: "Business" };

export function SettingsPage() {
  const { settings, updateSettings, loading, loadError } = usePosData();
  const [tenantInfo, setTenantInfo] = useState(null);

  useEffect(() => {
    apiGet("/api/tenant").then((res) => setTenantInfo(res)).catch(() => {});
  }, []);
  const [form, setForm] = useState({
    storeName: "",
    storeCode: "",
    address: "",
    taxRate: 0,
    attribute1Label: "Size",
    attribute2Label: "Color",
    cashEnabled: true,
    cardEnabled: true,
    qrisEnabled: false,
    transferEnabled: false,
    ewalletEnabled: false,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm({
      storeName: settings.storeName,
      storeCode: settings.storeCode,
      address: settings.address,
      taxRate: settings.taxRate ?? 0,
      attribute1Label: settings.attribute1Label ?? "Size",
      attribute2Label: settings.attribute2Label ?? "Color",
      cashEnabled: settings.paymentMethods.includes("cash"),
      cardEnabled: settings.paymentMethods.includes("card"),
      qrisEnabled: settings.paymentMethods.includes("qris"),
      transferEnabled: settings.paymentMethods.includes("transfer"),
      ewalletEnabled: settings.paymentMethods.includes("ewallet"),
    });
  }, [settings]);

  async function handleSubmit(event) {
    event.preventDefault();

    const paymentMethods = [];
    if (form.cashEnabled) paymentMethods.push("cash");
    if (form.cardEnabled) paymentMethods.push("card");
    if (form.qrisEnabled) paymentMethods.push("qris");
    if (form.transferEnabled) paymentMethods.push("transfer");
    if (form.ewalletEnabled) paymentMethods.push("ewallet");

    await updateSettings({
      storeName: form.storeName,
      storeCode: form.storeCode,
      address: form.address,
      taxRate: Number(form.taxRate) || 0,
      attribute1Label: form.attribute1Label || "Size",
      attribute2Label: form.attribute2Label || "Color",
      paymentMethods,
    });

    setMessage("Store settings updated.");
  }

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Store-level operational defaults.</h1>
          <p className="muted-text">
            Halaman ini disiapkan untuk profile toko dan payment methods, sesuai lingkup MVP saat ini.
          </p>
        </div>
      </section>

      {tenantInfo?.tenant ? (
        <article className="panel-card narrow-card">
          <div className="panel-head">
            <h2>Subscription</h2>
          </div>
          <div className="panel-body form-stack">
            <div className="dual-fields">
              <div className="field">
                <span className="muted-text">Plan</span>
                <strong>{PLAN_LABELS[tenantInfo.tenant.plan] || tenantInfo.tenant.plan}</strong>
              </div>
              <div className="field">
                <span className="muted-text">Status</span>
                <strong style={{ textTransform: "capitalize" }}>{tenantInfo.tenant.status}</strong>
              </div>
            </div>
            {tenantInfo.tenant.plan === "trial" && tenantInfo.tenant.trialEndsAt ? (
              <p className="muted-text">Trial berakhir: {formatDate(tenantInfo.tenant.trialEndsAt)}</p>
            ) : null}
            {tenantInfo.usage && tenantInfo.limits ? (
              <div className="dual-fields">
                <div className="field">
                  <span className="muted-text">Produk</span>
                  <span>{tenantInfo.usage.products} / {tenantInfo.limits.products === -1 ? "\u221E" : tenantInfo.limits.products}</span>
                </div>
                <div className="field">
                  <span className="muted-text">User</span>
                  <span>{tenantInfo.usage.users} / {tenantInfo.limits.users === -1 ? "\u221E" : tenantInfo.limits.users}</span>
                </div>
                <div className="field">
                  <span className="muted-text">Workspace</span>
                  <span>{tenantInfo.usage.workspaces} / {tenantInfo.limits.workspaces === -1 ? "\u221E" : tenantInfo.limits.workspaces}</span>
                </div>
              </div>
            ) : null}
          </div>
        </article>
      ) : null}

      <article className="panel-card narrow-card">
        <div className="panel-head">
          <h2>Store profile</h2>
        </div>

        {loading ? <p className="info-text">Loading settings...</p> : null}
        {loadError ? <p className="error-text">{loadError}</p> : null}

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Store name</span>
            <input
              value={form.storeName}
              onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Store code</span>
            <input
              value={form.storeCode}
              onChange={(event) => setForm((current) => ({ ...current, storeCode: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Address</span>
            <textarea
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Tax rate (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.taxRate}
              onChange={(event) => setForm((current) => ({ ...current, taxRate: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Variant label 1 (e.g. Size, Weight, Volume)</span>
            <input
              value={form.attribute1Label}
              onChange={(event) => setForm((current) => ({ ...current, attribute1Label: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Variant label 2 (e.g. Color, Flavor, Type)</span>
            <input
              value={form.attribute2Label}
              onChange={(event) => setForm((current) => ({ ...current, attribute2Label: event.target.value }))}
            />
          </label>

          <div className="checkbox-row">
            <label>
              <input
                checked={form.cashEnabled}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, cashEnabled: event.target.checked }))}
              />
              Cash
            </label>
            <label>
              <input
                checked={form.cardEnabled}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, cardEnabled: event.target.checked }))}
              />
              Card
            </label>
            <label>
              <input
                checked={form.qrisEnabled}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, qrisEnabled: event.target.checked }))}
              />
              QRIS
            </label>
            <label>
              <input
                checked={form.transferEnabled}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, transferEnabled: event.target.checked }))}
              />
              Transfer
            </label>
            <label>
              <input
                checked={form.ewalletEnabled}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, ewalletEnabled: event.target.checked }))}
              />
              E-Wallet
            </label>
          </div>

          {message ? <p className="info-text">{message}</p> : null}

          <button className="primary-button" type="submit">
            Save settings
          </button>
        </form>
      </article>
    </div>
  );
}
