"use client";

import { useState } from "react";
import { CldImage } from "next-cloudinary";
import AvatarUploader from "@/src/components/AvatarUploader";

export default function ProfileHeader() {
  // ✅ Por ahora hardcodeado. Luego lo sacas de tu AuthContext: dataUser.user.id, etc.
  const userId = "demo-user-1";

  // ✅ Guarda el public_id (recomendado). Esto luego lo persistes en DB.
  const [avatarPublicId, setAvatarPublicId] = useState<string | null>(null);

  // (Opcional) si quieres tener también secure_url por si tu backend lo necesita
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  return (
    <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 flex items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        {/* FOTO DE PERFIL */}
        <div className="relative">
          {/* ✅ Si ya hay public_id, mostramos Cloudinary; si no, placeholder */}
          {avatarPublicId ? (
            <CldImage
              src={avatarPublicId}
              width="96"
              height="96"
              alt="Foto de perfil"
              crop="fill"
              gravity="face"
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-900 bg-amber-100"
            />
          ) : (
            <img
              src="/placeholder-avatar.png"
              alt="Foto de perfil"
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-900 bg-amber-100"
            />
          )}

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

        <div>
          <h2 className="font-display text-3xl">Alex</h2>
          <p className="font-sans text-slate-600">Vendedor & Comprador</p>

          {/* Debug opcional para ver que sí cambió */}
          {/* <p className="text-xs text-slate-500 mt-1">{avatarUrl}</p> */}
        </div>
      </div>

      <div className="hidden sm:block font-handwritten text-lg text-slate-700">
        Tu espacio personal
      </div>
    </div>
  );
}
