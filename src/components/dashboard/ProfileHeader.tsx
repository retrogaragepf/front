"use client";

import { useMemo, useState } from "react";
import { CldImage } from "next-cloudinary";
import AvatarUploader from "@/src/components/AvatarUploader";
import { useAuth } from "@/src/context/AuthContext";

export default function ProfileHeader() {
  const { dataUser, isLoadingUser } = useAuth();

  // ✅ Soporta 2 shapes:
  // 1) dataUser = { user: { name, email, id }, token }
  // 2) dataUser = { name, email, id }
  const userObj = useMemo(() => {
    const u = (dataUser as any)?.user ?? (dataUser as any) ?? null;
    return u;
  }, [dataUser]);

  // ✅ userId real (para luego persistir avatar en DB)
  const userId = useMemo(() => {
    const id = userObj?.id ?? userObj?.userId ?? userObj?._id ?? null;
    return id ? String(id) : "guest";
  }, [userObj]);

  // ✅ Email (lo principal para la demo)
  const userEmail: string = userObj?.email ?? (dataUser as any)?.email ?? "";

  // ✅ Nombre (opcional)
  const userName: string =
    userObj?.name ?? userObj?.fullName ?? userObj?.username ?? "";

  // ✅ Guarda el public_id (recomendado). Esto luego lo persistes en DB.
  const [avatarPublicId, setAvatarPublicId] = useState<string | null>(null);

  // (Opcional) si quieres tener también secure_url por si tu backend lo necesita
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const initials = useMemo(() => {
    const base = (userName || userEmail || "").trim();
    if (!base) return "RG";
    const parts = base.split(" ").filter(Boolean);
    const first = parts[0]?.[0] ?? "R";
    const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "G";
    return `${first}${second}`.toUpperCase();
  }, [userName, userEmail]);

  return (
    <div
      className="
        bg-amber-50
        border-2 border-amber-900
        rounded-2xl
        shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]
        overflow-hidden
      "
    >
      <div className="p-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6 min-w-0">
          {/* FOTO DE PERFIL */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full border-2 border-amber-900 bg-amber-100 overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
              {avatarPublicId ? (
                <CldImage
                  src={avatarPublicId}
                  width="96"
                  height="96"
                  alt="Foto de perfil"
                  crop="fill"
                  gravity="face"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <span className="text-xl font-extrabold tracking-widest text-amber-900">
                    {initials}
                  </span>
                </div>
              )}
            </div>

            {/* BOTÓN CAMBIAR (abre widget) */}
            <div className="absolute -bottom-2 -right-2">
              <AvatarUploader
                userId={userId}
                onUploaded={({ publicId, secureUrl }) => {
                  setAvatarPublicId(publicId);
                  setAvatarUrl(secureUrl);

                  // ✅ Aquí luego haces tu PATCH al backend:
                  // await updateUserAvatar({ publicId, secureUrl })
                }}
              />
            </div>
          </div>

          {/* INFO */}
          <div className="min-w-0">
            <h2 className="font-display text-2xl md:text-3xl text-amber-900 truncate">
              {isLoadingUser ? "Cargando..." : userEmail ? userEmail : ""}
            </h2>

            <p className="text-zinc-700 mt-1">
              {userName ? userName : "Vendedor & Comprador"}
            </p>

            <div className="mt-4 h-[2px] w-full bg-amber-300" />

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1">
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-amber-900">
                Perfil RetroGarage™
              </span>
            </div>

            {/* Debug opcional */}
            {/* <p className="text-xs text-zinc-600 mt-2">{avatarUrl}</p> */}
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-2">
          <span className="font-handwritten text-lg text-zinc-800">
            Tu espacio personal
          </span>
          <span className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-600">
            Ajustes · Ventas · Reseñas
          </span>
        </div>
      </div>

      {/* Accent footer igual que el dashboard */}
      <div className="h-2 bg-emerald-900" />
    </div>
  );
}
