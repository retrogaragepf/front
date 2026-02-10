"use client";

import { useState } from "react";
import { CldImage } from "next-cloudinary";
import AvatarUploader from "@/src/components/AvatarUploader";

export default function ProfileHeader() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const userId = user?.id || "demo-user-1";

  const [avatarPublicId, setAvatarPublicId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  return (
    <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 flex items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="relative">
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

          <div className="absolute -bottom-2 -right-2">
            <AvatarUploader
              userId={userId}
              onUploaded={({ publicId, secureUrl }) => {
                setAvatarPublicId(publicId);
                setAvatarUrl(secureUrl);
              }}
            />
          </div>
        </div>

        <div>
         <h2 className="font-display text-3xl">
  {user?.name || user?.username || user?.fullName || "Usuario"}
       </h2>

          <p className="font-sans text-slate-600">
            Vendedor & Comprador
          </p>
        </div>
      </div>

      <div className="hidden sm:block font-handwritten text-lg text-slate-700">
        Tu espacio personal
      </div>
    </div>
  );
}
