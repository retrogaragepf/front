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

  console.log("ID:", id);

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

  // ✅ NUEVO: bloquear compra de publicación propia (solo UI en esta vista)
  const isOwnProduct =
    !!customerId &&
    !!resolvedSellerId &&
    String(customerId).trim() === String(resolvedSellerId).trim();

  return (
    <div className="w-full bg-amber-100 text-zinc-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <section
          className="
            mt-6 rounded-2xl border-2 border-amber-900 bg-amber-50
            shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] overflow-hidden
          "
        >
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

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-300 bg-amber-100 text-amber-900 text-sm font-extrabold tracking-widest uppercase">
                  Vintage Verified
                </span>

                <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-900/30 bg-emerald-800 text-amber-50 text-sm font-extrabold tracking-widest uppercase">
                  Stock: {(product as any).stock}
                </span>

                {isOwnProduct && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-blue-300 bg-blue-100 text-blue-900 text-sm font-extrabold tracking-widest uppercase">
                    Tu publicación
                  </span>
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
                    className="
                      w-full sm:w-auto text-center
                      font-handwritten px-4 py-3 rounded-xl
                      border-2 border-zinc-400
                      bg-zinc-200 text-zinc-600 font-extrabold tracking-wide text-sm
                      cursor-not-allowed opacity-90
                      shadow-none
                    "
                    title="No puedes comprar tu propia publicación"
                  >
                    Tu publicación
                  </button>
                ) : (
                  <AddToCartButton product={product} />
                )}

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

                <button
                  type="button"
                  onClick={() => {
                    if (!isAuth) {
                      showToast.warning(
                        "Debes iniciar sesión para chatear con el vendedor",
                        {
                          duration: 2500,
                          progress: true,
                          position: "top-center",
                          transition: "popUp",
                          icon: "",
                          sound: true,
                        },
                      );
                      return;
                    }

                    console.log("[ProductDetailPage] chat seller resolution", {
                      resolvedSellerId,
                      userFromObject: productUserRecord,
                      sellerFromObject: sellerRecord,
                      ownerFromObject: fallbackOwnerRecord,
                      productKeys: Object.keys(productRecord),
                      productId: product.id,
                    });

                    if (!resolvedSellerId) {
                      showToast.warning(
                        "No se encontró el vendedor en este producto. Se abrió tu bandeja de chats.",
                        {
                          duration: 2500,
                          progress: true,
                          position: "top-center",
                          transition: "popUp",
                          icon: "",
                          sound: true,
                        },
                      );
                      openChat({ asParticipant: "customer" });
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
                  className={`
                    w-full sm:w-auto text-center
                    font-handwritten px-4 py-3 rounded-xl
                    border-2 font-extrabold tracking-wide text-sm
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                    hover:-translate-y-px hover:shadow-[4px_3px_0px_0px_rgba(0,0,0,0.85)]
                    active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                    transition
                    ${
                      !isAuth
                        ? "cursor-not-allowed border-zinc-400 bg-zinc-200 text-zinc-500 shadow-none hover:translate-y-0 hover:shadow-none active:translate-y-0 active:shadow-none"
                        : "border-amber-900 bg-amber-50 text-amber-900"
                    }
                  `}
                  aria-disabled={!isAuth}
                >
                  Chatea con el vendedor
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
