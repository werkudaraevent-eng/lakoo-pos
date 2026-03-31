import { useEffect, useState } from "react";

import { usePosData } from "../context/PosDataContext";

export function SettingsPage() {
  const { settings, updateSettings, loading, loadError } = usePosData();
  const [form, setForm] = useState({
    storeName: "",
    storeCode: "",
    address: "",
    cashEnabled: true,
    cardEnabled: true,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm({
      storeName: settings.storeName,
      storeCode: settings.storeCode,
      address: settings.address,
      cashEnabled: settings.paymentMethods.includes("cash"),
      cardEnabled: settings.paymentMethods.includes("card"),
    });
  }, [settings]);

  async function handleSubmit(event) {
    event.preventDefault();

    await updateSettings({
      storeName: form.storeName,
      storeCode: form.storeCode,
      address: form.address,
      paymentMethods: ["cash", "card"].filter((method) =>
        method === "cash" ? form.cashEnabled : form.cardEnabled
      ),
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
