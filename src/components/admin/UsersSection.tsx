"use client";

import { useEffect, useState } from "react";
import {
  getAllUsers,
  banUser,
  unbanUser,
} from "@/src/helpers/admin.users.mock";

export default function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "banned">("all");

  useEffect(() => {
    setUsers(getAllUsers());
  }, []);

  const handleBanToggle = (id: string, isBanned: boolean) => {
    const confirmAction = confirm(
      `¿Seguro que querés ${isBanned ? "desbanear" : "banear"} este usuario?`
    );

    if (!confirmAction) return;

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
      <h1 className="font-display text-3xl text-amber-900 mb-2">
        Usuarios
      </h1>

      <p className="text-zinc-700 mb-6">
        Gestión de cuentas dentro de RetroGarage™
      </p>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        {(["all", "active", "banned"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl border-2 border-amber-900 font-extrabold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] ${
              filter === f
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white border-2 border-amber-900 rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <table className="w-full">
          <thead className="bg-amber-100 border-b-2 border-amber-900">
            <tr>
              <th className="p-4 text-left font-extrabold text-amber-900">
                Nombre
              </th>
              <th className="text-left font-extrabold text-amber-900">
                Email
              </th>
              <th className="text-left font-extrabold text-amber-900">
                Estado
              </th>
              <th className="text-left font-extrabold text-amber-900">
                Acción
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-amber-200">
                <td className="p-4 font-bold text-zinc-800">
                  {user.name}
                </td>

                <td className="text-zinc-700">{user.email}</td>

                <td>
                  {user.isBanned ? (
                    <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-xs font-extrabold">
                      BANEADO
                    </span>
                  ) : (
                    <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-extrabold">
                      ACTIVO
                    </span>
                  )}
                </td>

                <td>
                  <button
                    onClick={() =>
                      handleBanToggle(user.id, user.isBanned)
                    }
                    className={`px-3 py-1 rounded-lg font-extrabold border-2 ${
                      user.isBanned
                        ? "bg-emerald-700 text-white border-emerald-800"
                        : "bg-red-600 text-white border-red-700"
                    }`}
                  >
                    {user.isBanned ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center p-6 text-zinc-500"
                >
                  No hay usuarios en esta categoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
