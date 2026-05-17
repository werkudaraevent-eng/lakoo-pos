import { useState, useEffect } from "react";
import { apiGet } from "../api/client";

// Cache config across components in the same session.
let cachedConfig = null;
let cachedPromise = null;

const FALLBACK_CONFIG = {
  upgrade_url: "",
  support_contact: "",
  support_label: "Hubungi Admin",
};

export function useUpgradeConfig() {
  const [config, setConfig] = useState(cachedConfig || FALLBACK_CONFIG);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (cachedConfig) {
      setConfig(cachedConfig);
      setLoading(false);
      return;
    }

    if (!cachedPromise) {
      cachedPromise = apiGet("/api/platform-config")
        .then((res) => {
          cachedConfig = { ...FALLBACK_CONFIG, ...(res.config || {}) };
          return cachedConfig;
        })
        .catch(() => {
          cachedConfig = FALLBACK_CONFIG;
          return cachedConfig;
        });
    }

    cachedPromise.then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  return { config, loading };
}

// Helper to clear cache (e.g., on logout)
export function clearUpgradeConfigCache() {
  cachedConfig = null;
  cachedPromise = null;
}
