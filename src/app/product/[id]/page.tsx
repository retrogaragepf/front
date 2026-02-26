"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getProductById } from "@/src/services/products.services";
import AddToCartButton from "@/src/components/products/AddToCartButton";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import { useChat } from "@/src/context/ChatContext";
import { useAuth } from "@/src/context/AuthContext";
import { showToast } from "nextjs-toast-notify";

const ProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { openChat } = useChat();
  const { dataUser, isAuth } = useAuth();
  const id = (params as any)?.id as string | undefined;

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
        const p = await getProductById(String(id));
        setProduct(p as any);
      } catch (err) {
        console.error("getProductById error:", err);
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id, router]);

  if (loading) return <div className="p-6">Cargando producto...</div>;
  if (!product) return null;

  const imageUrl = (product as any).imgUrl ?? "";

  const priceNumber = Number(product.price);
  const priceFormatted = Number.isFinite(priceNumber)
    ? priceNumber.toLocaleString("es-CO", { minimumFractionDigits: 0 })
    : String(product.price);

  const customerName =
    (dataUser as any)?.user?.name ??
    (dataUser as any)?.name ??
    (dataUser as any)?.user?.fullName ??
    (dataUser as any)?.fullName ??
    "Cliente";

  const customerId =
    (dataUser as any)?.user?.id ?? (dataUser as any)?.id ?? null;

  const productRecord = product as unknown as Record<string, unknown>;
  const sellerRecord =
    (productRecord.seller as Record<string, unknown> | undefined) ?? undefined;
  const productUserRecord =
    (productRecord.user as Record<string, unknown> | undefined) ?? undefined;
  const fallbackOwnerRecord =
    (productRecord.owner as Record<string, unknown> | undefined) ?? undefined;

  const resolvedSellerId =
    (productUserRecord?.id ? String(productUserRecord.id) : "") ||
    (productUserRecord?.userId ? String(productUserRecord.userId) : "") ||
    (sellerRecord?.id ? String(sellerRecord.id) : "") ||
    (sellerRecord?.userId ? String(sellerRecord.userId) : "") ||
    (sellerRecord?.sellerId ? String(sellerRecord.sellerId) : "") ||
    (productRecord.sellerId ? String(productRecord.sellerId) : "") ||
    (productRecord.sellerID ? String(productRecord.sellerID) : "") ||
    (productRecord.seller_id ? String(productRecord.seller_id) : "") ||
    (productRecord.userId ? String(productRecord.userId) : "") ||
    (productRecord.ownerId ? String(productRecord.ownerId) : "") ||
    (fallbackOwnerRecord?.id ? String(fallbackOwnerRecord.id) : "") ||
    (fallbackOwnerRecord?.userId ? String(fallbackOwnerRecord.userId) : "");

  const resolvedSellerName =
    (productUserRecord?.name ? String(productUserRecord.name) : "") ||
    (productUserRecord?.fullName ? String(productUserRecord.fullName) : "") ||
    (sellerRecord?.fullName ? String(sellerRecord.fullName) : "") ||
    (sellerRecord?.name ? String(sellerRecord.name) : "") ||
    (fallbackOwnerRecord?.fullName
      ? String(fallbackOwnerRecord.fullName)
      : "") ||
    (fallbackOwnerRecord?.name ? String(fallbackOwnerRecord.name) : "") ||
    "Vendedor";

  // ya existía → no se toca
  const isOwnProduct =
    !!customerId &&
    !!resolvedSellerId &&
    String(customerId).trim() === String(resolvedSellerId).trim();

  return (
    <div className="w-full bg-amber-100 text-zinc-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="mt-6 rounded-2xl border-2 border-amber-900 bg-amber-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
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
            </div>

            <div className="p-5 md:p-6">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide text-amber-900">
                {product.title}
              </h2>

              <p className="mt-2 text-lg md:text-xl font-extrabold text-zinc-900">
                $ <span className="text-emerald-950">{priceFormatted}</span>{" "}
                <span className="text-lg font-semibold text-zinc-600">COP</span>
              </p>

              {product.description && (
                <p className="mt-4 text-zinc-700 leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="my-6 h-0.5 w-full bg-amber-300" />

              <div className="flex flex-col sm:flex-row gap-3">
                {isOwnProduct ? (
                  <button
                    type="button"
                    disabled
                    className="w-full sm:w-auto text-center font-handwritten px-4 py-3 rounded-xl border-2 border-zinc-400 bg-zinc-200 text-zinc-600 font-extrabold tracking-wide text-sm cursor-not-allowed opacity-90 shadow-none"
                  >
                    Tu publicación
                  </button>
                ) : (
                  <AddToCartButton product={product} />
                )}

                <Link
                  href="/cart"
                  className="w-full sm:w-auto text-center font-handwritten px-4 py-3 rounded-xl border-2 border-amber-900 bg-amber-100 text-amber-900 font-extrabold tracking-wide text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]"
                >
                  Ver carrito
                </Link>

                <button
                  type="button"
                  disabled={isOwnProduct}
                  onClick={() => {
                    if (isOwnProduct) {
                      showToast.info(
                        "No puedes chatear sobre tu propia publicación",
                      );
                      return;
                    }

                    if (!isAuth) {
                      showToast.warning(
                        "Debes iniciar sesión para chatear con el vendedor",
                      );
                      return;
                    }

                    openChat({
                      asParticipant: "customer",
                      product: product.title,
                      sellerName: resolvedSellerName,
                      sellerId: resolvedSellerId,
                      customerName,
                      customerId: customerId ? String(customerId) : undefined,
                    });
                  }}
                  className={`w-full sm:w-auto text-center font-handwritten px-4 py-3 rounded-xl border-2 font-extrabold tracking-wide text-sm ${
                    isOwnProduct
                      ? "border-zinc-400 bg-zinc-200 text-zinc-600 cursor-not-allowed opacity-90 shadow-none"
                      : "border-amber-900 bg-amber-100 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]"
                  }`}
                >
                  {isOwnProduct
                    ? "Chat no disponible"
                    : "Chatea con el vendedor"}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="shrink-0 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
                >
                  Atrás
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProductDetailPage;
