import changelog from "../data/changelog.json";
import "../features/dashboard/dashboard.css";

const TYPE_LABELS = {
  feature: { label: "Baru", color: "var(--success, #4a9066)", bg: "var(--success-soft, #edf7f0)" },
  fix: { label: "Perbaikan", color: "var(--danger, #b54343)", bg: "var(--danger-soft, #fef2f2)" },
  improvement: { label: "Peningkatan", color: "var(--accent, #b8860b)", bg: "var(--accent-light, #fdf6e8)" },
};

export function ChangelogPage() {
  return (
    <div className="content" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Changelog</h2>
        <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>
          Riwayat pembaruan dan fitur baru pada platform Lakoo.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {changelog.map((release, idx) => (
          <div key={release.version} style={{ display: "flex", gap: 20 }}>
            {/* Timeline line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: idx === 0 ? "var(--accent)" : "var(--line)", border: idx === 0 ? "3px solid var(--accent-light, #fdf6e8)" : "3px solid var(--surface)", flexShrink: 0 }} />
              {idx < changelog.length - 1 && (
                <div style={{ width: 2, flex: 1, background: "var(--line)", minHeight: 20 }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>v{release.version}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {new Date(release.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "var(--text)" }}>
                {release.title}
              </div>
              <div className="card" style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {release.entries.map((entry, i) => {
                    const meta = TYPE_LABELS[entry.type] || TYPE_LABELS.feature;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: meta.bg, color: meta.color, whiteSpace: "nowrap", marginTop: 1,
                        }}>
                          {meta.label}
                        </span>
                        <span style={{ color: "var(--text)", lineHeight: 1.5 }}>{entry.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
