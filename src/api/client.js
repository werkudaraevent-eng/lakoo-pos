let authToken = "";
let platformToken = "";

function buildHeaders() {
  const headers = {};

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
}

function buildPlatformHeaders() {
  const headers = {};

  if (platformToken) {
    headers.Authorization = `Bearer ${platformToken}`;
  }

  return headers;
}

async function parseResponse(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    // Server returned non-JSON (e.g. HTML 404 page)
    if (response.status === 404) {
      throw new Error("Endpoint tidak ditemukan. Pastikan server sudah di-restart.");
    }
    if (response.status >= 500) {
      throw new Error("Terjadi kesalahan pada server. Silakan coba lagi.");
    }
    throw new Error(`Gagal memproses respons server (${response.status}).`);
  }

  if (!response.ok || payload.ok === false) {
    // Auto-redirect to blocked page when tenant is suspended/expired
    if (response.status === 403 && payload.reason) {
      const blockedReasons = ["suspended", "cancelled", "trial_expired", "subscription_expired"];
      if (blockedReasons.includes(payload.reason) && !window.location.pathname.startsWith("/platform")) {
        localStorage.removeItem("pos-token");
        localStorage.removeItem("pos-user");
        window.location.href = `/account-blocked?reason=${payload.reason}&message=${encodeURIComponent(payload.message || "")}`;
        // Throw to stop further execution
        throw new Error(payload.message || "Akun tidak aktif.");
      }
    }
    throw new Error(payload.message || "Permintaan gagal. Silakan coba lagi.");
  }

  return payload;
}

export function setAuthToken(token) {
  authToken = token || "";
}

export function getAuthToken() {
  return authToken;
}

export function setPlatformToken(token) {
  platformToken = token || "";
}

export function getPlatformToken() {
  return platformToken;
}

export function withActiveWorkspace(body, activeWorkspaceId) {
  if (!activeWorkspaceId) {
    return body;
  }

  return {
    ...(body ?? {}),
    workspaceId: activeWorkspaceId,
  };
}

export function withQuery(path, params) {
  const searchParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  if (!query) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

export async function apiGet(path) {
  const response = await fetch(path, {
    headers: buildHeaders(),
  });
  return parseResponse(response);
}

export async function apiPost(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      ...buildHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

export async function apiPatch(path, body) {
  const response = await fetch(path, {
    method: "PATCH",
    headers: {
      ...buildHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

export async function apiDelete(path) {
  const response = await fetch(path, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  return parseResponse(response);
}

export async function apiPut(path, body) {
  const response = await fetch(path, {
    method: "PUT",
    headers: {
      ...buildHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

// ── Platform-scoped API helpers (use platformToken) ──────────────

export async function platformGet(path) {
  const response = await fetch(path, {
    headers: buildPlatformHeaders(),
  });
  return parseResponse(response);
}

export async function platformPost(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      ...buildPlatformHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}

export async function platformPatch(path, body) {
  const response = await fetch(path, {
    method: "PATCH",
    headers: {
      ...buildPlatformHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}
