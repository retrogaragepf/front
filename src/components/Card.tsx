"use client";

import Image from "next/image";
import Link from "next/link";
import { IProductWithDetails } from "@/src/interfaces/product.interface";
import { useCart } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";
import * as ToastNotify from "nextjs-toast-notify";

interface CardProps {
  product: IProductWithDetails;
  hideDescription?: boolean; // ✅ nuevo
}

/** ✅ Toast wrapper compatible con:
 *  1) showToast.success/info/error(msg, options)
 *  2) showToast(msg, "success"|"warning"|"error")
 */
function notify(
  type: "success" | "info" | "warning" | "error",
  msg: string,
  options?: any,
) {
  const mod: any = ToastNotify as any;

  const showToastMaybe = mod?.showToast ?? mod?.default?.showToast;

  // Caso A: showToast es un OBJETO con métodos
  if (showToastMaybe && typeof showToastMaybe === "object") {
    const fn = showToastMaybe?.[type];
    if (typeof fn === "function") return fn(msg, options);
  }

  // Caso B: showToast es una FUNCIÓN (msg, type)
  if (typeof showToastMaybe === "function") {
    const mappedType = type === "info" ? "success" : type;
    return showToastMaybe(msg, mappedType);
  }

  // Fallback
  console.log(`[toast:${type}]`, msg);
}

function Card({ product, hideDescription = true }: CardProps) {
  const { addProduct, cartItems } = useCart();
  const { dataUser, isLoadingUser } = useAuth();

  // ✅ Normaliza ID (id vs _id)
  const safeId = String(
    (product as any).id ??
      (product as any)._id ??
      (product as any).productId ??
      "",
  ).trim();

  // ✅ Normaliza imagen (imgUrl vs images[0])
  const imageUrl =
    (product as any).imgUrl ??
    (product as any).imageUrl ??
    (product as any).images?.[0] ??
    "";

  const priceNumber = Number((product as any).price);
  const priceFormatted = Number.isFinite(priceNumber)
    ? priceNumber.toLocaleString("es-CO", { minimumFractionDigits: 0 })
    : String((product as any).price ?? "—");

  const isLogged = !!(dataUser as any)?.token;

  // ✅ user actual (soporta dataUser.user.id o dataUser.id)
  const currentUserId = String(
    (dataUser as any)?.user?.id ?? (dataUser as any)?.id ?? "",
  ).trim();

  // ✅ seller del producto (soporta varias shapes de back)
  const productOwnerId = String(
    (product as any)?.user?.id ??
      (product as any)?.seller?.id ??
      (product as any)?.userId ??
      (product as any)?.sellerId ??
      (product as any)?.ownerId ??
      "",
  ).trim();

  // ✅ Regla: no comprar publicación propia
  const isOwnProduct =
    !!currentUserId && !!productOwnerId && currentUserId === productOwnerId;

  const alreadyInCart = cartItems.some(
    (it) =>
      String((it as any).id ?? (it as any).productId ?? "").trim() === safeId,
  );

  // ✅ STOCK (solo UI + guard)
  const stockNumber = Number((product as any)?.stock ?? 0);
  const isOutOfStock = !Number.isFinite(stockNumber) || stockNumber <= 0;

  const toastOpts = {
    duration: 2500,
    progress: true,
    position: "top-center",
    transition: "popUp",
    icon: "",
    sound: true,
  };

  const handleAddToCart = () => {
    if (!isLogged) return;

    // ✅ Guard: no permitir comprar lo propio
    if (isOwnProduct) {
      notify(
        "warning",
        "No puedes comprar tus propias publicaciones.",
        toastOpts,
      );
      return;
    }

    // ✅ Guard: no permitir agregar si está agotado
    if (isOutOfStock) {
      notify("warning", "Producto agotado por ahora.", toastOpts);
      return;
    }

    if (!safeId) {
      notify("error", "Este producto no tiene ID válido (id/_id).", {
        ...toastOpts,
        duration: 3000,
      });
      return;
    }

    if (alreadyInCart) {
      notify("info", "Este producto ya está en tu carrito", toastOpts);
      return;
    }

    // ✅ Normaliza ANTES de mandarlo al CartContext
    const normalizedProduct = {
      ...product,
      id: safeId,
      price: Number.isFinite(priceNumber) ? priceNumber : 0,
      imgUrl: imageUrl,
      images: (product as any).images ?? (imageUrl ? [imageUrl] : []),
    } as any;

    addProduct(normalizedProduct, 1);

    notify("success", "Agregado al carrito", toastOpts);
  };

  // ✅ Deshabilitar también si es producto propio
  const addDisabled = alreadyInCart || isOutOfStock || isOwnProduct;

  return (
    <div className="group w-full flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-amber-100 border border-amber-300 shadow-sm">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`product image ${(product as any).title ?? ""}`}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 520px"
            className="object-cover transition-all duration-500 group-hover:scale-110"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm">
            Sin imagen
          </div>
        )}

        {/* ✅ SOLD OUT badge opcional dentro del card */}
        {isOutOfStock && (
          <div className="absolute top-3 left-3 z-10">
            <div className="px-3 py-1.5 text-sm shadow-md bg-rose-100 text-rose-900 font-extrabold border-2 border-zinc-900 rounded-lg">
              AGOTADO
            </div>
          </div>
        )}

        {/* ✅ Badge de publicación propia */}
        {!isOutOfStock && isOwnProduct && (
          <div className="absolute top-3 left-3 z-10">
            <div className="px-3 py-1.5 text-xs shadow-md bg-blue-100 text-blue-900 font-extrabold border-2 border-zinc-900 rounded-lg">
              TU PUBLICACIÓN
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10">
          <div className="px-3 py-1.5 text-sm shadow-md bg-amber-800/95 text-amber-50 font-extrabold border border-amber-900/30 rounded-lg">
            $ {priceFormatted}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <h4 className="font-extrabold text-xl group-hover:text-amber-800 transition-colors line-clamp-2 min-h-[3rem] leading-snug">
          {(product as any).title}
        </h4>

        {!hideDescription &&
          ((product as any).description ? (
            <p className="text-sm text-zinc-700 italic opacity-90 line-clamp-2">
              {(product as any).description}
            </p>
          ) : (
            <p className="text-sm text-zinc-700 italic opacity-60">
              Sin descripción
            </p>
          ))}
      </div>

      <div className="w-full flex flex-col gap-2 mt-2">
        <Link
          href={safeId ? `/product/${safeId}` : "/products"}
          className="w-full"
        >
          <button
            className="w-full border-2 border-slate-900 bg-amber-400 px-4 py-2 text-sm
            font-semibold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
            hover:bg-amber-300 transition"
          >
            Ver
          </button>
        </Link>

        {!isLoadingUser && isLogged && (
          <button
            onClick={handleAddToCart}
            disabled={addDisabled}
            className={`border-2 border-slate-900 px-4 py-2 text-sm font-semibold
              shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] transition
              ${
                addDisabled
                  ? "bg-zinc-200 text-zinc-700 cursor-not-allowed opacity-80"
                  : "bg-emerald-800 text-white hover:bg-amber-900"
              }`}
            title={
              isOwnProduct
                ? "No puedes comprar tu propia publicación"
                : isOutOfStock
                  ? "Producto agotado"
                  : alreadyInCart
                    ? "Ya está en tu carrito"
                    : "Agregar al carrito"
            }
          >
            {isOwnProduct
              ? "Tu publicación"
              : alreadyInCart
                ? "Ya en el 🛒"
                : isOutOfStock
                  ? "Agotado"
                  : "Agregar al 🛒"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Card;
