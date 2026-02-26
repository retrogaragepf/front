"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import type { IProductCreate } from "@/src/interfaces/product.interface";
import { showToast } from "nextjs-toast-notify";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";

import { createProduct } from "@/src/services/products.services";

import { CATEGORY_OPTIONS } from "@/src/constants/categories";
import { ERA_OPTIONS } from "@/src/constants/eras";

export default function CreateProductPage() {
  const router = useRouter();
  const { isAuth, isLoadingUser } = useAuth();

  const [form, setForm] = useState<IProductCreate>({
    title: "",
    description: "",
    price: "",
    stock: 1,
    categoryId: "",
    eraId: "",
    images: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Evita doble set si Cloudinary dispara success repetido (dev / callbacks)
  const lastUploadedPublicIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoadingUser) return;
    if (!isAuth) router.push("/login");
  }, [isLoadingUser, isAuth, router]);

  if (isLoadingUser) return null;
  if (!isAuth) return null;

  const handleChange = (field: keyof IProductCreate, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // ✅ blindaje extra anti doble click

    if (!form.title || !form.price || !form.categoryId || !form.eraId) {
      showToast.error("Completa todos los campos obligatorios");
      return;
    }

    if (!form.images || form.images.length === 0) {
      showToast.error("Debes subir una imagen");
      return;
    }

    const priceNumber = Number(form.price);
    const stockNumber = Number(form.stock);

    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      showToast.error("El precio debe ser un número positivo");
      return;
    }

    if (!Number.isFinite(stockNumber) || stockNumber < 0) {
      showToast.error("El stock debe ser 0 o mayor");
      return;
    }

    setIsSubmitting(true);

    try {
      const imgUrl = form.images[0];

      await createProduct({
        title: form.title,
        description: form.description || "",
        price: priceNumber,
        stock: stockNumber,
        erasId: form.eraId,
        categoryId: form.categoryId,
        imgUrl,
      });

      showToast.success("Producto enviado para revisión");
      router.push("/dashboard/my-products");
    } catch (error: any) {
      showToast.error(error?.message ?? "Error creando producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-100 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-amber-200 rounded-3xl shadow-lg p-10">
        <h1 className="text-3xl font-bold text-amber-800 mb-8">
          Completa los datos del producto
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full bg-amber-100 rounded-xl px-4 py-3 outline-none"
              placeholder="Ej: Walkman Sony 1982"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full bg-amber-100 rounded-xl px-4 py-3 h-32 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                Precio *
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                className="w-full bg-amber-100 rounded-xl px-4 py-3 outline-none"
                min={0}
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                Stock *
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => handleChange("stock", Number(e.target.value))}
                className="w-full bg-amber-100 rounded-xl px-4 py-3 outline-none"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Categoría *
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => handleChange("categoryId", e.target.value)}
              className="w-full bg-amber-100 rounded-xl px-4 py-3 outline-none"
            >
              <option value="">Selecciona categoría</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Era *
            </label>
            <select
              value={form.eraId}
              onChange={(e) => handleChange("eraId", e.target.value)}
              className="w-full bg-amber-100 rounded-xl px-4 py-3 outline-none"
            >
              <option value="">Selecciona era</option>
              {ERA_OPTIONS.map((era) => (
                <option key={era.id} value={era.id}>
                  {era.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Imagen del producto *
            </label>

            <CldUploadWidget
              uploadPreset={
                process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string
              }
              options={{
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                resourceType: "image",
                maxFiles: 1,
                maxFileSize: 500 * 1024 * 1024,
                clientAllowedFormats: [
                  "png",
                  "jpg",
                  "jpeg",
                  "webp",
                  "gif",
                  "avif",
                ],
              }}
              onSuccess={(result: any) => {
                const secureUrl = result?.info?.secure_url;
                const publicId = result?.info?.public_id;

                if (!secureUrl) return;

                // ✅ evita doble callback success con el mismo asset
                if (publicId && lastUploadedPublicIdRef.current === publicId) {
                  return;
                }
                if (publicId) {
                  lastUploadedPublicIdRef.current = publicId;
                }

                setForm((prev) => ({ ...prev, images: [secureUrl] }));
              }}
              onUpload={(result: any) => {
                const evt = result?.event;
                const info = result?.info;

                if (evt === "error") {
                  const msg =
                    info?.message ||
                    info?.error?.message ||
                    "No se pudo subir el archivo. Verifica que sea una imagen y pese menos de 500MB.";
                  showToast.error(msg);
                }
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-emerald-900 text-white rounded-xl hover:bg-amber-900 disabled:opacity-60"
                >
                  Subir imagen
                </button>
              )}
            </CldUploadWidget>

            {form.images?.[0] && (
              <div className="mt-4">
                <Image
                  src={form.images[0]}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="rounded-xl object-cover"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-900 hover:bg-amber-900 text-white font-semibold py-4 rounded-xl transition-all shadow-md disabled:opacity-60"
          >
            {isSubmitting ? "Publicando..." : "Publicar producto"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
          >
            Atrás
          </button>
        </form>
      </div>
    </main>
  );
}
