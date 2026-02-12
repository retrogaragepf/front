"use client";

import { useEffect, useState } from "react";
import { getAllUsers, banUser, unbanUser } from "@/src/services/admin.service";

export default function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setUsers(getAllUsers());
  }, []);

  const handleBanToggle = (id: string, isBanned: boolean) => {
    if (!confirm("¿Estás segura?")) return;

    if (isBanned) unbanUser(id);
    else banUser(id);

    setUsers(getAllUsers());
  };

  const filtered = users.filter((u) => {
    if (filter === "active") return !u.isBanned;
    if (filter === "banned") return u.isBanned;
    return true;
  });

  return (
    <div>
      <h2 className="text-3xl font-extrabold mb-6">Usuarios</h2>

      <div className="mb-6 flex gap-4">
        {["all", "active", "banned"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <table className="w-full border-2 border-black">
        <thead>
          <tr className="bg-black text-white">
            <th className="p-3">Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="p-3">{user.name}</td>
              <td>{user.email}</td>
              <td>
                {user.isBanned ? (
                  <span className="bg-red-200 px-3 py-1 rounded">Banned</span>
                ) : (
                  <span className="bg-green-200 px-3 py-1 rounded">Active</span>
                )}
              </td>
              <td>
                <button
                  onClick={() => handleBanToggle(user.id, user.isBanned)}
                  className="font-bold"
                >
                  {user.isBanned ? "Unban" : "Ban"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
