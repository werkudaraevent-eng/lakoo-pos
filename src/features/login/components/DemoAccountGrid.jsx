export function DemoAccountGrid({ accounts, onPick }) {
  return (
    <div className="login-demo-grid">
      {accounts.map((account) => (
        <button className="login-demo-card" key={account.role} onClick={() => onPick(account)} type="button">
          {account.role}
        </button>
      ))}
    </div>
  );
}
