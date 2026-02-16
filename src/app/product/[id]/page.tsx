"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AddToCartButton from "@/src/components/products/AddToCartButton";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [product, setProduct] = useState<IProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!id) {
        router.push("/products");
        return;
      }

      try {
        setLoading(true);
        const p = await mockGetProductById(String(id));
        setProduct(p);
      } catch (err) {
        console.error("mockGetProductById error:", err);
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id, router]);

  if (loading) {
    return <div className="p-6">Cargando producto...</div>;
  }

  if (!product) return null;

  const imageUrl = (product as any).imgUrl ?? "";

  const priceNumber = Number(product.price);
  const priceFormatted = Number.isFinite(priceNumber)
    ? priceNumber.toLocaleString("es-CO", { minimumFractionDigits: 0 })
    : String(product.price);

  return (
    <div className="w-full bg-amber-100 text-zinc-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Back / breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="font-handwritten text-sm font-extrabold tracking-wide text-amber-900 uppercase border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
          >
            ← Volver a productos
          </Link>

          <span className="text-amber-900/40">•</span>
        </div>

        {/* Card */}
        <section
          className="
            mt-6 rounded-2xl border-2 border-amber-900 bg-amber-50
            shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] overflow-hidden
          "
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Imagen */}
            <div className="p-5 md:p-6 border-b-2 md:border-b-0 md:border-r-2 border-amber-900">
              <div className="relative aspect-square rounded-xl border border-amber-300 bg-amber-100 overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm font-semibold">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-300 bg-amber-100 text-amber-900 text-xs font-extrabold tracking-widest uppercase">
                  Vintage Verified
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-900/30 bg-emerald-800 text-amber-50 text-xs font-extrabold tracking-widest uppercase">
                  Stock: {(product as any).stock}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5 md:p-6">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide text-amber-900">
                {product.title}
              </h1>

              <p className="mt-2 text-lg md:text-xl font-extrabold text-zinc-900">
                $ <span className="text-emerald-950">{priceFormatted}</span>{" "}
                <span className="text-sm font-semibold text-zinc-600">COP</span>
              </p>

              {product.description && (
                <p className="mt-4 text-zinc-700 leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="my-6 h-0.5 w-full bg-amber-300" />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <AddToCartButton product={product} />

                <Link
                  href="/cart"
                  className="
                    w-full sm:w-auto text-center
                    font-handwritten px-4 py-3 rounded-xl
                    border-2 border-amber-900
                    bg-amber-50 text-amber-900 font-extrabold tracking-wide text-sm
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                    hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                    active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                    transition
                  "
                >
                  Ver carrito
                </Link>
              </div>

              <p className="mt-4 text-xs text-zinc-600">
                Tip: si el stock llega a 0, podemos deshabilitar el botón y
                mostrar “Agotado”.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
