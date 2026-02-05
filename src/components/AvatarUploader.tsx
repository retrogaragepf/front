"use client";

import { CldUploadWidget } from "next-cloudinary";

export default function AvatarUploader({
  userId,
  onUploaded,
}: {
  userId: string;
  onUploaded: (publicId: string, secureUrl: string) => void;
}) {
  return (
    <CldUploadWidget
      uploadPreset="rg_signed_main"
      options={{
        folder: `retrogarage/users/avatars/${userId}`,
        sources: ["local", "camera"],
        multiple: false,
        maxFiles: 1,
      }}
      signatureEndpoint="/api/cloudinary/signature"
      onSuccess={(result: any) => {
        const info = result?.info;
        onUploaded(info.public_id, info.secure_url);
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className="px-4 py-2 rounded bg-zinc-900 text-amber-200"
        >
          Subir avatar
        </button>
      )}
    </CldUploadWidget>
  );
}
