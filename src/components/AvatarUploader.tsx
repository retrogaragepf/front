"use client";

import { CldUploadWidget } from "next-cloudinary";

export default function AvatarUploader({
  userId,
  onUploaded,
}: {
  userId: string;
  onUploaded: (payload: { publicId: string; secureUrl: string }) => void;
}) {
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

  return (
    <CldUploadWidget
      // ✅ UNSIGNED: SOLO preset + cloudName (nada de signature)
      uploadPreset={uploadPreset}
      options={{
        cloudName,
        sources: ["local", "camera"],
        multiple: false,
        maxFiles: 1,
        cropping: true,
        croppingAspectRatio: 1,
        folder: `avatars/${userId}`,
        resourceType: "image",
        clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
      }}
      onSuccess={(result: any) => {
        const info = result?.info;
        if (!info?.public_id || !info?.secure_url) return;

        onUploaded({
          publicId: info.public_id,
          secureUrl: info.secure_url,
        });
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className="px-3 py-2 rounded-xl border-2 border-slate-900 bg-amber-200 hover:bg-amber-300 font-sans text-sm"
        >
          Cambiar
        </button>
      )}
    </CldUploadWidget>
  );
}
