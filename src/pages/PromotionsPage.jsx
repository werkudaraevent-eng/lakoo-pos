import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { formatDate } from "../utils/formatters";

export function PromotionsPage() {
  const { user } = useAuth();
  const { promotions, createPromotion, loading, loadError } = usePosData();
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: 10,
    minPurchase: 0,
    startAt: "2026-03-30T00:00",
    endAt: "2026-04-30T23:59",
  });
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await createPromotion(form, user);
      setMessage("Promotion saved.");
      setForm({
        code: "",
        type: "percentage",
        value: 10,
        minPurchase: 0,
        startAt: "2026-03-30T00:00",
        endAt: "2026-04-30T23:59",
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Promotions</p>
          <h1>Coupon and promo rule management.</h1>
          <p className="muted-text">
            Promo dibuat oleh admin atau manager, lalu divalidasi lagi pada saat checkout finalization.
          </p>
        </div>
      </section>

      {loading ? <p className="info-text">Loading promotions...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="content-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Create promotion</h2>
          </div>
          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Code</span>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                placeholder="NEW10"
              />
            </label>

            <div className="dual-fields">
              <label className="field">
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </label>

              <label className="field">
                <span>Value</span>
                <input
                  min="1"
                  type="number"
                  value={form.value}
                  onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                />
              </label>
            </div>

            <label className="field">
              <span>Minimum purchase</span>
              <input
                min="0"
                type="number"
                value={form.minPurchase}
                onChange={(event) => setForm((current) => ({ ...current, minPurchase: event.target.value }))}
              />
            </label>

            <div className="dual-fields">
              <label className="field">
                <span>Start</span>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>End</span>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
                />
              </label>
            </div>

            {message ? <p className="info-text">{message}</p> : null}

            <button className="primary-button" type="submit">
              Save promotion
            </button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Active promotions</h2>
          </div>
          <div className="stack-list">
            {promotions.map((promo) => (
              <div className="promo-card" key={promo.id}>
                <div className="product-card-head">
                  <strong>{promo.code}</strong>
                  <span className="pill-strong">{promo.type}</span>
                </div>
                <p className="muted-text">
                  Value {promo.value} - Min purchase {promo.minPurchase}
                </p>
                <p className="muted-text">
                  {formatDate(promo.startAt)} sampai {formatDate(promo.endAt)}
                </p>
                <p className="muted-text">Created by {promo.createdBy}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
