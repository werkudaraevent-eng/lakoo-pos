export function DemoAccountGrid({ accounts, onPick }) {
  return (
    <div className="login-demo-grid">
      {accounts.map((account) => (
        <button className="login-demo-card" key={account.role} onClick={() => onPick(account)} type="button">
          <strong>{account.role}</strong>
          <span>{account.username}</span>
          <small>{account.password}</small>
        </button>
      ))}
    </div>
  );
}
