import { useEffect, useState } from "react";

import { usePosData } from "../context/PosDataContext";
import { formatDate } from "../utils/formatters";

export function UsersPage() {
  const { users, createUser, updateUser } = usePosData();
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "cashier",
    isActive: true,
  });
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!editingId) {
      return;
    }

    const target = users.find((user) => user.id === editingId);
    if (!target) {
      return;
    }

    setForm({
      name: target.name,
      username: target.username,
      password: "",
      role: target.role,
      isActive: target.isActive,
    });
  }, [editingId, users]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (editingId) {
        await updateUser(editingId, form);
        setMessage("User updated.");
      } else {
        await createUser(form);
        setMessage("User created.");
      }

      setEditingId(null);
      setForm({
        name: "",
        username: "",
        password: "",
        role: "cashier",
        isActive: true,
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">User Management</p>
          <h1>Admin control over staff access.</h1>
          <p className="muted-text">
            Tambah user baru, ubah role, aktif/nonaktifkan akun, dan reset password dari satu halaman admin.
          </p>
        </div>
      </section>

      <section className="content-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>{editingId ? "Edit user" : "Create user"}</h2>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Username</span>
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Password {editingId ? "(leave blank untuk tetap sama)" : ""}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Role</span>
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>
            </label>

            <label className="checkbox-inline">
              <input
                checked={form.isActive}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active user
            </label>

            {message ? <p className="info-text">{message}</p> : null}

            <div className="inline-actions">
              <button className="primary-button" type="submit">
                {editingId ? "Update user" : "Create user"}
              </button>
              {editingId ? (
                <button
                  className="secondary-button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      name: "",
                      username: "",
                      password: "",
                      role: "cashier",
                      isActive: true,
                    });
                  }}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Staff accounts</h2>
          </div>
          <div className="table-list">
            {users.map((user) => (
              <div className="table-row" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <p className="muted-text">
                    @{user.username} • {user.role} • {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="inline-actions">
                  <span className={user.isActive ? "pill-strong" : "pill-warning"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                  <button className="secondary-button small-button" onClick={() => setEditingId(user.id)} type="button">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
