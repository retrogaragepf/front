"use client";

import { useMemo } from "react";
import { useAuth } from "@/src/context/AuthContext";

function formatDateFromUnixSeconds(sec?: number) {
  if (!sec) return "";
  const d = new Date(sec * 1000);
  // es-CO y tu timezone (Bogotá) lo maneja el navegador si está en Colombia
  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit", 
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserSessionCard() {
  const { dataUser, isLoadingUser } = useAuth();

  // Soporta que dataUser sea: payload directo o { user: payload, token }
  const payload = useMemo(() => {
    return (dataUser as any)?.user ?? (dataUser as any) ?? null;
  }, [dataUser]);

  const email = payload?.mail ?? payload?.email ?? "";
  const id = payload?.id ?? payload?.userId ?? payload?._id ?? "";
  const isAdmin = Boolean(payload?.isAdmin);
  const iat = payload?.iat;
  const exp = payload?.exp;

  const roleLabel = isAdmin ? "Admin" : "Usuario";
  const roleAccent = isAdmin
    ? "border-emerald-950 bg-emerald-900 text-amber-50"
    : "border-amber-900 bg-amber-100 text-amber-900";

  return (
    <section
      className="
        rounded-2xl
        border-2 border-amber-900
        bg-amber-50
        shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]
        overflow-hidden
      "
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold tracking-wide text-amber-900">
              Datos de sesión
            </h3>
            <p className="mt-2 text-sm text-zinc-700">
              Información disponible desde tu token (JWT).
            </p>
          </div>

          <span
            className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-extrabold tracking-widest uppercase ${roleAccent}`}
          >
            {roleLabel}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border-2 border-amber-900 bg-amber-100/40 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-700">
              Email
            </p>
            <p className="mt-1 font-extrabold text-amber-900 break-all">
              {isLoadingUser ? "Cargando..." : email || "—"}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-amber-900 bg-amber-100/40 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-700">
              ID Usuario
            </p>
            <p className="mt-1 font-mono text-sm text-amber-900 break-all">
              {isLoadingUser ? "Cargando..." : id || "—"}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-amber-900 bg-amber-100/40 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-700">
              Sesión iniciada
            </p>
            <p className="mt-1 text-sm font-extrabold text-amber-900">
              {isLoadingUser
                ? "Cargando..."
                : formatDateFromUnixSeconds(iat) || "—"}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-amber-900 bg-amber-100/40 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-700">
              Expira
            </p>
            <p className="mt-1 text-sm font-extrabold text-amber-900">
              {isLoadingUser
                ? "Cargando..."
                : formatDateFromUnixSeconds(exp) || "—"}
            </p>
          </div>
        </div>

        <div className="mt-5 h-0.5 w-full bg-amber-300" />

        <p className="mt-3 text-xs text-zinc-700">
          Para mostrar{" "}
          <span className="font-extrabold text-amber-900">
            nombre, teléfono, dirección, avatar
          </span>
          , etc., el backend debe entregar un endpoint de perfil (por ejemplo{" "}
          <span className="font-mono">/users/me</span>).
        </p>
      </div>

      <div className="h-2 bg-emerald-900" />
    </section>
  );
}
