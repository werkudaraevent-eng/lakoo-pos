import crypto from "node:crypto";

// ── JWT Secret Validation ────────────────────────────────────────
const JWT_SECRET = process.env.POS_JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("FATAL: POS_JWT_SECRET must be set and at least 32 characters long.");
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

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

  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
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

  // Timing-safe signature comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid signature.");
  }

  const payload = JSON.parse(base64UrlDecode(payloadPart));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired.");
  }

  return payload;
}

export function requireAuth(loadUserById, loadTenantById, checkTenantStatusFn) {
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

      // Check tenant status on every request (not just login)
      if (user.tenantId && loadTenantById && checkTenantStatusFn) {
        const tenant = await loadTenantById(user.tenantId);
        const tenantCheck = checkTenantStatusFn(tenant);
        if (!tenantCheck.ok) {
          const messages = {
            suspended: "Akun bisnis Anda sedang disuspend.",
            cancelled: "Akun bisnis Anda sudah dibatalkan.",
            trial_expired: "Masa trial Anda sudah habis.",
            subscription_expired: "Langganan Anda sudah berakhir.",
          };
          res.status(403).json({ ok: false, message: messages[tenantCheck.reason] || "Akun tidak aktif.", reason: tenantCheck.reason });
          return;
        }
      }

      req.auth = {
        token,
        payload,
        user,
      };

      next();
    } catch (error) {
      // Don't leak internal error details — use generic message for auth failures
      const safeMessages = ["Token expired.", "Malformed token.", "Invalid signature."];
      const message = safeMessages.includes(error.message) ? error.message : "Unauthorized.";
      res.status(401).json({ ok: false, message });
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
