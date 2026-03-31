import crypto from "node:crypto";

const JWT_SECRET = process.env.POS_JWT_SECRET || "pos-local-dev-secret";

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");
}

function base64UrlDecode(value) {
  let normalized = value.replaceAll("-", "+").replaceAll("_", "/");

  while (normalized.length % 4 !== 0) {
    normalized += "=";
  }

  return Buffer.from(normalized, "base64").toString("utf8");
}

export function signJwt(payload, expiresInSeconds = 60 * 60 * 12) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(body));
  const data = `${headerPart}.${payloadPart}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");

  return `${data}.${signature}`;
}

export function verifyJwt(token) {
  const [headerPart, payloadPart, signature] = token.split(".");

  if (!headerPart || !payloadPart || !signature) {
    throw new Error("Malformed token.");
  }

  const data = `${headerPart}.${payloadPart}`;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");

  if (signature !== expectedSignature) {
    throw new Error("Invalid signature.");
  }

  const payload = JSON.parse(base64UrlDecode(payloadPart));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired.");
  }

  return payload;
}

export function requireAuth(loadUserById) {
  return async (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      res.status(401).json({ ok: false, message: "Unauthorized." });
      return;
    }

    try {
      const payload = verifyJwt(token);
      const user = await loadUserById(payload.sub);

      if (!user || !user.isActive) {
        res.status(401).json({ ok: false, message: "User is not active." });
        return;
      }

      req.auth = {
        token,
        payload,
        user,
      };

      next();
    } catch (error) {
      res.status(401).json({ ok: false, message: error.message || "Unauthorized." });
    }
  };
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.auth?.user || !roles.includes(req.auth.user.role)) {
      res.status(403).json({ ok: false, message: "Forbidden." });
      return;
    }

    next();
  };
}
