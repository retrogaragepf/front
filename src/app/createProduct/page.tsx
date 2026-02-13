"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import type { IProductCreate } from "@/src/interfaces/product.interface";
import { showToast } from "nextjs-toast-notify";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";

export default function CreateProductPage() {
  const router = useRouter();
  const { dataUser, isAuth } = useAuth();

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

  if (!isAuth) {
    router.push("/login");
    return null;
  }

  const handleChange = (field: keyof IProductCreate, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.price || !form.categoryId || !form.eraId) {
      showToast.error("Completa todos los campos obligatorios");
      return;
    }

    if (!form.images || form.images.length === 0) {
      showToast.error("Debes subir una imagen");
      return;
    }

    setIsSubmitting(true);

    try {
      const existingProducts = JSON.parse(
        localStorage.getItem("retrogarage_products") || "[]"
      );

      const newProduct = {
        ...form,
        id: crypto.randomUUID(),
        sellerId: dataUser?.user?.id,
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      localStorage.setItem(
        "retrogarage_products",
        JSON.stringify([...existingProducts, newProduct])
      );

      showToast.success("Producto enviado para revisión");
      router.push("/dashboard/my-products");
    } catch (error) {
      showToast.error("Error creando producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f2ea] py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-10">
        <h1 className="text-3xl font-bold text-amber-800 mb-8">
          Publicar nuevo producto
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none"
              placeholder="Ej: Walkman Sony 1982"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 h-32 outline-none"
            />
          </div>

          {/* Precio y Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                Precio *
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                Stock *
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) =>
                  handleChange("stock", Number(e.target.value))
                }
                className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Categoría *
            </label>
            <select
              value={form.categoryId}
              onChange={(e) =>
                handleChange("categoryId", e.target.value)
              }
              className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none"
            >
              <option value="">Selecciona categoría</option>
              <option value="11111111-1111-1111-1111-111111111111">
                Videojuegos Retro
              </option>
              <option value="dddddddd-dddd-dddd-dddd-dddddddddddd">
                Audio Retro
              </option>
              <option value="55555555-5555-5555-5555-555555555555">
                Decoración Retro
              </option>
            </select>
          </div>

          {/* Era */}
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Era *
            </label>
            <select
              value={form.eraId}
              onChange={(e) => handleChange("eraId", e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none"
            >
              <option value="">Selecciona era</option>
              <option value="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb">
                70s
              </option>
              <option value="cccccccc-cccc-cccc-cccc-cccccccccccc">
                80s
              </option>
              <option value="eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee">
                90s
              </option>
            </select>
          </div>

          {/* Imagen Cloudinary */}
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Imagen del producto *
            </label>

            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string}
              options={{
                cloudName:
                  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
              }}
              onSuccess={(result: any) => {
                const secureUrl = result?.info?.secure_url;
                if (!secureUrl) return;

                setForm((prev) => ({
                  ...prev,
                  images: [secureUrl],
                }));
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700"
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

          {/* Botón */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-4 rounded-xl transition-all shadow-md"
          >
            {isSubmitting ? "Publicando..." : "Publicar producto"}
          </button>
        </form>
      </div>
    </main>
  );
}
