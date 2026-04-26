import "../components/shell.css";

export function PageHeader({ title, description, children }) {
  return (
    <div className="sticky-header">
      <div className="sticky-header-left">
        <h1 className="sticky-header-title">{title}</h1>
        {description ? <p className="sticky-header-desc">{description}</p> : null}
      </div>
      {children ? <div className="sticky-header-actions">{children}</div> : null}
    </div>
  );
}
