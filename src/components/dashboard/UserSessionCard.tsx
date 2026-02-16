"use client";

import { useMemo } from "react";
import { useAuth } from "@/src/context/AuthContext";

function formatDateFromUnixSeconds(sec?: number) {
  if (!sec) return "";
  const d = new Date(sec * 1000);
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

  // Soporta: payload directo, { user: payload, token }, { payload }, etc.
  const payload = useMemo(() => {
    const du: any = dataUser as any;

    return (
      du?.user ?? // { user, token }
      du?.payload ?? // { payload }
      du?.data ?? // { data }
      du ?? // payload directo
      null
    );
  }, [dataUser]);

  // 🔥 Campos posibles (por si cambian nombres)
  const name =
    payload?.name ??
    payload?.fullName ??
    payload?.username ??
    payload?.userName ??
    "";

  const email = payload?.mail ?? payload?.email ?? "";

  const id =
    payload?.id ??
    payload?.userId ??
    payload?._id ??
    payload?.sub ?? // a veces el JWT usa "sub"
    "";

  const isAdmin = Boolean(
    payload?.isAdmin ?? payload?.admin ?? payload?.role === "admin",
  );
  const iat = payload?.iat;
  const exp = payload?.exp;

  const roleLabel = isAdmin ? "Admin" : "Usuario";
  const roleAccent = isAdmin
    ? "border-emerald-950 bg-emerald-900 text-amber-50"
    : "border-amber-900 bg-amber-100 text-amber-900";

  const Card = ({
    label,
    value,
    mono,
  }: {
    label: string;
    value: string;
    mono?: boolean;
  }) => (
    <div className="rounded-2xl border-2 border-amber-900 bg-amber-100/40 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
      <p className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-700">
        {label}
      </p>
      <p
        className={`mt-1 ${mono ? "font-mono text-sm" : "font-extrabold"} text-amber-900 break-all`}
      >
        {isLoadingUser ? "Cargando..." : value || "—"}
      </p>
    </div>
  );

  return (
    <section className="rounded-2xl border-2 border-amber-900 bg-amber-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] overflow-hidden">
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
          <Card label="Nombre" value={name} />
          <Card label="Email" value={email} />
          <Card label="ID Usuario" value={id} mono />
          <Card
            label="Sesión iniciada"
            value={formatDateFromUnixSeconds(iat)}
          />
          <Card label="Expira" value={formatDateFromUnixSeconds(exp)} />
        </div>

        <div className="mt-5 h-0.5 w-full bg-amber-300" />

        <p className="mt-3 text-xs text-zinc-700">
          Para mostrar{" "}
          <span className="font-extrabold text-amber-900">
            teléfono, dirección, avatar
          </span>
          , necesitas que el backend devuelva esos datos (por ejemplo en{" "}
          <span className="font-mono">/users/me</span>).
        </p>
      </div>

      <div className="h-2 bg-emerald-900" />
    </section>
  );
}
