import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { LoginForm } from "../features/login/components/LoginForm";
import { LoginHero } from "../features/login/components/LoginHero";
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

  async function handleSubmit(event) {
    event.preventDefault();

    if (authLoading) {
      return;
    }

    const result = await login(form);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate(destination, { replace: true });
  }

  function handleFieldChange(field, value) {
    if (error) {
      setError("");
    }

    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleDemoPick(account) {
    if (error) {
      setError("");
    }

    setForm({ username: account.username, password: account.password });
  }

  return (
    <div className="login-page">
      <LoginHero accounts={demoAccounts} onPick={handleDemoPick} />
      <LoginForm
        authLoading={authLoading}
        error={error}
        form={form}
        onChange={handleFieldChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
