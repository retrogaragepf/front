// src/components/dashboard/ProfileInfo.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { showToast } from "nextjs-toast-notify";
import { useAuth } from "@/src/context/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  if (raw.startsWith("eyJ")) return raw;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

function patchStoredUserAddress(nextAddress: string) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return;
  if (raw.startsWith("eyJ")) return;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if (parsed.user && typeof parsed.user === "object") {
        parsed.user.address = nextAddress;
      } else {
        parsed.address = nextAddress;
      }
      localStorage.setItem(TOKEN_KEY, JSON.stringify(parsed));
    }
  } catch {}
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  try {
    return isJson && text ? JSON.parse(text) : text;
  } catch {
    return text;
  }
}

function pickNameParts(user: any) {
  const first =
    user?.firstName ??
    user?.name ??
    user?.nombre ??
    user?.given_name ??
    user?.givenName ??
    "";
  const last =
    user?.lastName ??
    user?.lastname ??
    user?.surname ??
    user?.apellido ??
    user?.family_name ??
    user?.familyName ??
    "";

  const full = user?.fullName ?? user?.fullname ?? user?.displayName ?? "";
  if ((!first || !last) && typeof full === "string" && full.trim()) {
    const parts = full.trim().split(/\s+/);
    if (!first && parts.length >= 1)
      return { first: parts[0], last: parts.slice(1).join(" ") };
    if (first && !last && parts.length >= 2)
      return { first, last: parts.slice(1).join(" ") };
  }

  return { first: String(first || ""), last: String(last || "") };
}

function normalizeAddress(value: any) {
  return (typeof value === "string" ? value : "").trim();
}

export default function ProfileInfo() {
  const { dataUser, isLoadingUser } = useAuth();

  const userObj = useMemo(() => {
    return (dataUser as any)?.user ?? (dataUser as any) ?? null;
  }, [dataUser]);

  const userId = useMemo(() => {
    const id = userObj?.id ?? userObj?.userId ?? userObj?._id;
    return id != null ? String(id) : "";
  }, [userObj]);

  const token = useMemo(() => getToken(), []);

  const { first, last } = useMemo(() => pickNameParts(userObj), [userObj]);
  const email = useMemo(() => String(userObj?.email ?? ""), [userObj]);

  const initialAddress = useMemo(
    () => normalizeAddress(userObj?.address ?? ""),
    [userObj],
  );

  // ✅ NUEVO: lo que realmente se muestra y se actualiza en pantalla
  const [savedAddress, setSavedAddress] = useState<string>(initialAddress);

  const [address, setAddress] = useState<string>(initialAddress);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // ✅ Si AuthContext cambia (login/refresh), sincronizamos todo
  useEffect(() => {
    setSavedAddress(initialAddress);
    setAddress(initialAddress);
    setIsEditing(!initialAddress); // vacío => editar
  }, [initialAddress]);

  const canSave = useMemo(() => {
    const a = normalizeAddress(address);
    return !!a && a !== savedAddress && a.length <= 255 && !saving;
  }, [address, savedAddress, saving]);

  async function saveAddress() {
    const a = normalizeAddress(address);

    if (!a) return showToast.error("La dirección no puede estar vacía.");
    if (a.length > 255)
      return showToast.error("La dirección debe tener máximo 255 caracteres.");
    if (!userId) return showToast.error("No pude detectar el ID del usuario.");
    if (!token)
      return showToast.error("Sesión no válida. Inicia sesión de nuevo.");

    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${encodeURIComponent(userId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ address: a }),
        },
      );

      const payload = await parseJsonSafe(res);

      if (!res.ok) {
        const msg =
          (payload as any)?.message ||
          (typeof payload === "string" ? payload : null) ||
          "No se pudo guardar la dirección.";
        throw new Error(String(msg));
      }

      // ✅ PUT devuelve el usuario actualizado (incluye address)
      const nextAddress = normalizeAddress((payload as any)?.address ?? a);

      // ✅ Actualiza UI al instante
      setSavedAddress(nextAddress);
      setAddress(nextAddress);
      setIsEditing(false);

      // ✅ Mantén localStorage alineado (si aplica)
      patchStoredUserAddress(nextAddress);

      showToast.success("Dirección guardada ✅");
    } catch (e: any) {
      showToast.error(e?.message || "Error guardando la dirección");
    } finally {
      setSaving(false);
    }
  }

  if (isLoadingUser) {
    return (
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
          <div className="h-20 w-full animate-pulse rounded bg-slate-200" />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full rounded-2xl border border-amber-900 bg-amber-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-amber-900">Mi perfil</h2>
          <p className="text-sm text-slate-600">
            Nombre, apellido, email y dirección (editable).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing((v) => !v)}
          className="rounded-lg border border-slate-900 bg-amber-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50"
          disabled={saving}
        >
          {isEditing ? "Cancelar" : "Editar dirección"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-900 p-4 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            👤 Usuario:
          </p>
          <p className="mt-1 text-slate-900">
            {first || <span className="text-slate-400">—</span>}
          </p>
        </div>

        {/* <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Apellido
          </p>
          <p className="mt-1 text-slate-900">
            {last || <span className="text-slate-400">—</span>}
          </p>
        </div> */}

        <div className="rounded-xl border border-amber-900 p-4 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            📧 Email
          </p>
          <p className="mt-1 text-slate-900 break-all">
            {email || <span className="text-slate-400">—</span>}
          </p>
        </div>

        <div className="rounded-xl border border-amber-900 p-4 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              🏠 Dirección
            </p>

            {!savedAddress ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                Falta completar
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
                Guardada
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-3">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                maxLength={255}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-slate-900"
                placeholder="Escribe tu dirección (máx. 255 caracteres)"
              />

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Se guarda en tu cuenta (backend).</span>
                <span>{normalizeAddress(address).length}/255</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={saveAddress}
                  disabled={!canSave}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAddress(savedAddress);
                    setIsEditing(!savedAddress); // si sigue vacía, mantenemos edición
                  }}
                  disabled={saving}
                  className="rounded-lg border border-slate-900 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Restablecer
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-slate-900">
              {savedAddress ? (
                savedAddress
              ) : (
                <span className="text-slate-500">
                  Aún no tienes dirección. Haz clic en <b>“Editar dirección”</b>{" "}
                  para completarla.
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
