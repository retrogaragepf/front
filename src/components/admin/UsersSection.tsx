"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllUsers,
  blockUser,
  unblockUser,
  type AdminUser,
} from "@/src/services/users.services";

type UIUser = AdminUser & { isBanned: boolean };

function normalizeUser(u: AdminUser): UIUser {
  // soporta back que devuelva isBanned o isBlocked (sin romper tu UI)
  const anyU = u as unknown as { isBanned?: boolean; isBlocked?: boolean };
  return {
    ...u,
    isBanned: Boolean(anyU.isBanned ?? anyU.isBlocked),
  };
}

export default function UsersSection() {
  const [users, setUsers] = useState<UIUser[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "banned">("all");

  const [loadingList, setLoadingList] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoadingList(true);
      setError(null);

      const data = await getAllUsers();
      const normalized = (data ?? []).map(normalizeUser);

      setUsers(normalized);
    } catch (e: unknown) {
      console.error("getAllUsers error:", e);
      const message =
        e instanceof Error ? e.message : "No se pudieron cargar los usuarios.";
      setError(message);
      setUsers([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleBanToggle = async (id: string, isBanned: boolean) => {
    const confirmAction = confirm(
      `¿Seguro que querés ${isBanned ? "desbloquear" : "bloquear"} este usuario?`,
    );
    if (!confirmAction) return;

    // optimistic update
    const prev = users;
    setError(null);
    setBusyId(id);
    setUsers((curr) =>
      curr.map((u) => (u.id === id ? { ...u, isBanned: !isBanned } : u)),
    );

    try {
      if (isBanned) await unblockUser(id);
      else await blockUser(id);
      // si querés “fuente de verdad” del backend, dejá este reload:
      await loadUsers();
    } catch (e: unknown) {
      console.error("ban/unban error:", e);
      const message =
        e instanceof Error
          ? e.message
          : "No se pudo actualizar el estado del usuario.";
      setError(message);
      // revert
      setUsers(prev);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filter === "active") return !u.isBanned;
      if (filter === "banned") return u.isBanned;
      return true;
    });
  }, [users, filter]);

  const filterLabel: Record<typeof filter, string> = {
    all: "Todos",
    active: "Activos",
    banned: "Bloqueados",
  };

  return (
    <div>
      <h1 className="font-display text-3xl text-amber-900 mb-2">Usuarios</h1>

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
            {filterLabel[f]}
          </button>
        ))}

        <button
          onClick={loadUsers}
          disabled={loadingList}
          className="ml-auto px-4 py-2 rounded-xl border-2 border-amber-900 font-extrabold bg-white text-amber-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] disabled:opacity-60"
        >
          Recargar
        </button>
      </div>

      {/* Estados */}
      {loadingList && (
        <div className="mb-4 text-zinc-600 font-bold">Cargando usuarios...</div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl border-2 border-red-700 bg-red-100 text-red-800 font-bold">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border-2 border-amber-900 rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <table className="w-full">
          <thead className="bg-amber-100 border-b-2 border-amber-900">
            <tr>
              <th className="p-4 text-left font-extrabold text-amber-900">
                Nombre
              </th>
              <th className="text-left font-extrabold text-amber-900">Email</th>
              <th className="text-left font-extrabold text-amber-900">
                Estado
              </th>
              <th className="text-left font-extrabold text-amber-900">
                Acción
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((user) => {
              const isBusy = busyId === user.id;

              return (
                <tr key={user.id} className="border-t border-amber-200">
                  <td className="p-4 font-bold text-zinc-800">
                    {user.name || "—"}
                  </td>

                  <td className="text-zinc-700">{user.email}</td>

                  <td>
                    {user.isBanned ? (
                      <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-xs font-extrabold">
                        BLOQUEADO
                      </span>
                    ) : (
                      <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-extrabold">
                        ACTIVO
                      </span>
                    )}
                  </td>

                  <td>
                    <button
                      disabled={loadingList || isBusy}
                      onClick={() => handleBanToggle(user.id, user.isBanned)}
                      className={`px-3 py-1 rounded-lg font-extrabold border-2 disabled:opacity-60 ${
                        user.isBanned
                          ? "bg-emerald-700 text-white border-emerald-800"
                          : "bg-red-600 text-white border-red-700"
                      }`}
                    >
                      {isBusy ? "..." : user.isBanned ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {!loadingList && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-6 text-zinc-500">
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
