import { createContext, useContext, useEffect, useState } from "react";

import { apiGet, apiPost, setAuthToken } from "../api/client";
import { clearStoredWorkspaceSelection } from "./WorkspaceContext";

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem("pos-user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readStoredToken() {
  return localStorage.getItem("pos-token") || "";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => readStoredToken());
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("pos-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("pos-user");
    }
  }, [user]);

  useEffect(() => {
    setAuthToken(token);

    if (token) {
      localStorage.setItem("pos-token", token);
    } else {
      localStorage.removeItem("pos-token");
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      setAuthLoading(true);

      try {
        const payload = await apiGet("/api/auth/me");
        if (!cancelled) {
          setUser(payload.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken("");
          clearStoredWorkspaceSelection();
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function login({ username, password, tenantSlug }) {
    setAuthLoading(true);

    try {
      const payload = await apiPost("/api/auth/login", { username, password, tenantSlug: tenantSlug || undefined });
      setAuthToken(payload.token);
      setToken(payload.token);
      setUser(payload.user);
      return { ok: true, user: payload.user };
    } catch (error) {
      return { ok: false, message: error.message };
    } finally {
      setAuthLoading(false);
    }
  }

  async function register({ businessName, slug, email, password, ownerName }) {
    setAuthLoading(true);

    try {
      const payload = await apiPost("/api/auth/register", { businessName, slug, email, password, ownerName });
      return { ok: true, tenantId: payload.tenantId };
    } catch (error) {
      return { ok: false, message: error.message };
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    setToken("");
    setUser(null);
    clearStoredWorkspaceSelection();
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
