/**
 * Branded loading screen for transitions between pages.
 * Matches the warm earthy design system.
 *
 * Usage:
 *   <LoadingScreen />                          — default "Memuat..."
 *   <LoadingScreen message="Menyiapkan data" /> — custom message
 *   <LoadingScreen variant="platform" />        — platform admin style
 */
export function LoadingScreen({ message = "Memuat...", variant = "default" }) {
  const isPlatform = variant === "platform";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg, #faf8f5)",
      zIndex: 9999,
    }}>
      {/* Logo */}
      <div style={{
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: "-1px",
        color: "var(--text, #1c1915)",
        marginBottom: 4,
      }}>
        Lakoo.
        {isPlatform && <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-soft, #8a8279)", marginLeft: 6 }}>Platform</span>}
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: 11,
        color: "var(--text-muted, #b5b5ac)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: 32,
      }}>
        Point of Sale System
      </div>

      {/* Spinner */}
      <div style={{ position: "relative", width: 40, height: 40, marginBottom: 20 }}>
        <div style={{
          position: "absolute",
          inset: 0,
          border: "3px solid var(--surface, #f4efe8)",
          borderTopColor: "var(--accent, #c07a3b)",
          borderRadius: "50%",
          animation: "lakooSpin 0.8s linear infinite",
        }} />
      </div>

      {/* Message */}
      <div style={{
        fontSize: 13.5,
        fontWeight: 500,
        color: "var(--text-soft, #8a8279)",
      }}>
        {message}
      </div>

      <style>{`
        @keyframes lakooSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
