import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import "../features/promotions/promotions.css";

function createDefaultForm() {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return {
    code: "",
    type: "percentage",
    value: 10,
    minPurchase: 0,
    startAt: now.toISOString().slice(0, 16),
    endAt: nextMonth.toISOString().slice(0, 16),
  };
}

export function PromotionCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createPromotion, loading, loadError } = usePosData();
  const [form, setForm] = useState(createDefaultForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await createPromotion(form, user);
      navigate("/promotions");
    } catch (error) {
      setMessage(error.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="promotions-manage-page">
      <section className="page-header-card">
        <p className="eyebrow">Promotions</p>
        <h1>Create promotion</h1>
        <p className="muted-text">
          Create a new promo rule in a dedicated flow. The management page stays clean because rule editing belongs
          here, not next to the table.
        </p>
        <div className="promotions-manage-actions">
          <Button asChild size="sm" variant="outline">
            <Link to="/promotions">Back to promotions</Link>
          </Button>
        </div>
      </section>

      {loading ? <p className="info-text">Loading promotions...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}
      {message ? <p className="error-text">{message}</p> : null}

      <section className="panel-card">
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Code</span>
            <input
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
              placeholder="WEEKEND15"
              value={form.code}
            />
          </label>

          <div className="dual-fields">
            <label className="field">
              <span>Type</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                value={form.type}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>

            <label className="field">
              <span>Value</span>
              <input
                min="1"
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                type="number"
                value={form.value}
              />
            </label>
          </div>

          <label className="field">
            <span>Minimum purchase</span>
            <input
              min="0"
              onChange={(event) => setForm((current) => ({ ...current, minPurchase: event.target.value }))}
              type="number"
              value={form.minPurchase}
            />
          </label>

          <div className="dual-fields">
            <label className="field">
              <span>Start</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
                type="datetime-local"
                value={form.startAt}
              />
            </label>

            <label className="field">
              <span>End</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
                type="datetime-local"
                value={form.endAt}
              />
            </label>
          </div>

          <div className="inline-actions">
            <Button disabled={submitting} type="submit">
              {submitting ? "Saving..." : "Save promotion"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
