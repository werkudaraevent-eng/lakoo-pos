let authToken = "";

function buildHeaders() {
  const headers = {};

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
}

async function parseResponse(response) {
  const payload = await response.json();

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || "API request failed.");
  }

  return payload;
}

export function setAuthToken(token) {
  authToken = token || "";
}

export function getAuthToken() {
  return authToken;
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
