export function PageHeader({ children }) {
  if (!children) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
      {children}
    </div>
  );
}
