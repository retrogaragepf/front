"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

import { useAuth } from "@/src/context/AuthContext";

type FormState = {
  title: string;
  price: string;
  stock: string;
  category: string;
  imageUrl: string;
  description: string;
};

export default function CreateProductPage() {
  const router = useRouter();
  const { dataUser } = useAuth();

  const isAdmin =
    (dataUser as any)?.role === "admin" ||
    (dataUser as any)?.user?.role === "admin";

  const [form, setForm] = useState<FormState>({
    title: "",
    price: "",
    stock: "1",
    category: "",
    imageUrl: "",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const priceNumber = useMemo(() => Number(form.price || 0), [form.price]);

  const onChange =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const validate = () => {
    if (!form.title.trim()) return "El nombre del producto es obligatorio";
    if (!form.price.trim() || !Number.isFinite(priceNumber) || priceNumber <= 0)
      return "El precio debe ser un número mayor a 0";
    if (!form.stock.trim() || Number(form.stock) < 0)
      return "El stock debe ser 0 o mayor";
    if (!form.category.trim()) return "La categoría es obligatoria";
    if (!form.imageUrl.trim()) return "La URL de imagen es obligatoria";
    if (form.description.trim().length < 10)
      return "La descripción debe tener al menos 10 caracteres";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      showToast.warning(err, {
        duration: 3500,
        progress: true,
        position: "top-center",
        transition: "popUp",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      /**
       * ✅ DEMO2 SAFE:
       * Acá luego conectas al back:
       * POST /products (cuando exista)
       * body: { title, price, stock, category, imageUrl, description }
       */

      await new Promise((r) => setTimeout(r, 900));

      showToast.success("✅ Producto creado (Demo2) — Guardado simulado", {
        duration: 3500,
        progress: true,
        position: "top-center",
        transition: "popUp",
      });

      router.push("/dashboard");
    } catch (e: any) {
      showToast.error(e?.message ?? "Error creando el producto", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-200 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <section className="bg-amber-50 border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-amber-900">
                  Crear producto
                </h1>

                {isAdmin ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-200 border border-emerald-900 text-xs font-extrabold text-emerald-900">
                    ADMIN
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-zinc-200 border border-zinc-900 text-xs font-extrabold text-zinc-900">
                    USER
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-zinc-700">
                Publica un artículo retro para vender en RetroGarage.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex justify-center px-5 py-2 rounded-xl border-2 border-amber-900 bg-white text-amber-900 font-extrabold tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition"
            >
              Volver al Dashboard
            </button>
          </div>
        </section>

        {/* Form */}
        <section className="bg-white border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-extrabold text-amber-900">
                  Nombre del producto
                </label>
                <input
                  value={form.title}
                  onChange={onChange("title")}
                  className="mt-2 w-full rounded-2xl border-2 border-amber-900 bg-amber-50 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] focus:outline-none"
                  placeholder="Ej: Cámara vintage 90s"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-amber-900">
                  Categoría
                </label>
                <input
                  value={form.category}
                  onChange={onChange("category")}
                  className="mt-2 w-full rounded-2xl border-2 border-amber-900 bg-amber-50 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] focus:outline-none"
                  placeholder="Ej: Cámaras / Consolas / Audio"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-amber-900">
                  Precio (COP)
                </label>
                <input
                  value={form.price}
                  onChange={onChange("price")}
                  inputMode="numeric"
                  className="mt-2 w-full rounded-2xl border-2 border-amber-900 bg-amber-50 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] focus:outline-none"
                  placeholder="Ej: 250000"
                />
                <p className="mt-2 text-xs text-zinc-600">
                  Preview:{" "}
                  <span className="font-extrabold text-zinc-900">
                    ${" "}
                    {Number.isFinite(priceNumber)
                      ? priceNumber.toLocaleString("es-CO")
                      : "0"}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-amber-900">
                  Stock
                </label>
                <input
                  value={form.stock}
                  onChange={onChange("stock")}
                  inputMode="numeric"
                  className="mt-2 w-full rounded-2xl border-2 border-amber-900 bg-amber-50 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] focus:outline-none"
                  placeholder="Ej: 3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-extrabold text-amber-900">
                  URL de imagen (Cloudinary)
                </label>
                <input
                  value={form.imageUrl}
                  onChange={onChange("imageUrl")}
                  className="mt-2 w-full rounded-2xl border-2 border-amber-900 bg-amber-50 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] focus:outline-none"
                  placeholder="Pega aquí tu URL de Cloudinary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-extrabold text-amber-900">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={onChange("description")}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border-2 border-amber-900 bg-amber-50 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] focus:outline-none resize-none"
                  placeholder="Cuenta el estado, año aproximado, detalles retro..."
                />
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl border-2 border-amber-900 bg-amber-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]">
              <p className="font-extrabold text-amber-900 tracking-wide">
                Preview
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="h-40 w-full sm:w-64 rounded-2xl border-2 border-amber-900 bg-white overflow-hidden flex items-center justify-center">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-500 font-bold">
                      pega una URL para ver preview
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-lg font-extrabold text-zinc-900">
                    {form.title || "Nombre del producto"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700">
                    Categoría:{" "}
                    <span className="font-bold">{form.category || "—"}</span>
                  </p>
                  <p className="mt-2 text-xl font-extrabold text-amber-900">
                    ${" "}
                    {Number.isFinite(priceNumber)
                      ? priceNumber.toLocaleString("es-CO")
                      : "0"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-700">
                    Stock:{" "}
                    <span className="font-bold">{form.stock || "0"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-5 py-3 rounded-2xl border-2 border-zinc-900 bg-white text-zinc-900 font-extrabold tracking-wide shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-3 rounded-2xl border-2 border-emerald-900 bg-emerald-200 text-emerald-900 font-extrabold tracking-wide shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] disabled:opacity-60 disabled:cursor-not-allowed hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition"
              >
                {isSubmitting ? "Publicando..." : "Publicar producto"}
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              * Demo2: cuando el back habilite{" "}
              <span className="font-bold">/products</span>, conectamos el submit
              real sin tocar esta UI.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
