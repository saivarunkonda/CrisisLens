"use client";

import { useState } from "react";
import type { Role } from "@/lib/rbac";

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: "active" | "inactive";
  lastLogin?: Date;
  createdAt: Date;
}

interface RBACPanelProps {
  currentUserRole: Role;
}

// Static mock data with fixed dates
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@crisislens.local",
    name: "Admin User",
    role: "admin",
    status: "active",
    lastLogin: new Date("2024-01-15T10:30:00"),
    createdAt: new Date("2023-12-16T09:00:00"),
  },
  {
    id: "2",
    email: "analyst@crisislens.local",
    name: "Analyst User",
    role: "analyst",
    status: "active",
    lastLogin: new Date("2024-01-15T08:00:00"),
    createdAt: new Date("2024-01-01T09:00:00"),
  },
  {
    id: "3",
    email: "viewer@crisislens.local",
    name: "Viewer User",
    role: "viewer",
    status: "active",
    lastLogin: new Date("2024-01-14T09:00:00"),
    createdAt: new Date("2024-01-08T09:00:00"),
  },
];

export function RBACPanel({ currentUserRole }: RBACPanelProps) {
  const [users, setUsers] = useState<User[]>(mockUsers);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("viewer");
  const [message, setMessage] = useState("");

  if (currentUserRole !== "admin") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">
          Admin access required to manage users and permissions.
        </p>
      </div>
    );
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;

    const newUser: User = {
      id: String(Date.now()),
      email: newUserEmail,
      name: newUserEmail.split("@")[0],
      role: newUserRole,
      status: "active",
      createdAt: new Date(),
    };

    setUsers(prev => [...prev, newUser]);
    setNewUserEmail("");
    setNewUserRole("viewer");
    setShowAddUser(false);
    setMessage(`User ${newUserEmail} added successfully`);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u
      )
    );
  };

  const handleChangeRole = (userId: string, newRole: Role) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "analyst":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "viewer":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            User Management & RBAC
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage users, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          + Add User
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {message}
        </div>
      )}

      {showAddUser && (
        <form onSubmit={handleAddUser} className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 font-medium text-slate-900 dark:text-slate-100">Add New User</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as Role)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              >
                <option value="admin">Admin - Full Access</option>
                <option value="analyst">Analyst - View & Reports</option>
                <option value="viewer">Viewer - Read Only</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Add User
            </button>
            <button
              type="button"
              onClick={() => setShowAddUser(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Last Login</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user.id, e.target.value as Role)}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(user.role)} border-0`}
                  >
                    <option value="admin" className="text-slate-900">Admin</option>
                    <option value="analyst" className="text-slate-900">Analyst</option>
                    <option value="viewer" className="text-slate-900">Viewer</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleStatus(user.id)}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      user.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {user.status === "active" ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(user.lastLogin)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleStatus(user.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {user.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 font-medium text-slate-900 dark:text-slate-100">Role Permissions</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-3 dark:bg-slate-900">
            <h4 className="font-medium text-purple-600 dark:text-purple-400">Admin</h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>✓ Full dashboard access</li>
              <li>✓ User management</li>
              <li>✓ ML model controls</li>
              <li>✓ All reports & settings</li>
            </ul>
          </div>
          <div className="rounded-lg bg-white p-3 dark:bg-slate-900">
            <h4 className="font-medium text-blue-600 dark:text-blue-400">Analyst</h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>✓ View risk dashboard</li>
              <li>✓ Submit incident reports</li>
              <li>✓ View analytics</li>
              <li>✗ User management</li>
            </ul>
          </div>
          <div className="rounded-lg bg-white p-3 dark:bg-slate-900">
            <h4 className="font-medium text-slate-600 dark:text-slate-400">Viewer</h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>✓ View risk dashboard</li>
              <li>✓ View reports</li>
              <li>✗ Submit reports</li>
              <li>✗ Any management access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
