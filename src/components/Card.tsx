"use client";

import Image from "next/image";
import Link from "next/link";
import { IProductWithDetails } from "@/src/interfaces/product.interface";
import { useCart } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";
import { showToast } from "nextjs-toast-notify";

interface CardProps {
  product: IProductWithDetails;
}

function Card({ product }: CardProps) {
  const { addProduct, cartItems } = useCart();
  const { dataUser, isLoadingUser } = useAuth();

  // ✅ Normaliza ID (id vs _id)
  const safeId = String(
    (product as any).id ??
      (product as any)._id ??
      (product as any).productId ??
      "",
  );

  // ✅ Normaliza imagen (imgUrl vs images[0])
  const imageUrl =
    (product as any).imgUrl ??
    (product as any).imageUrl ??
    (product as any).images?.[0] ??
    "";

  const priceNumber = Number((product as any).price);
  const priceFormatted = Number.isFinite(priceNumber)
    ? priceNumber.toLocaleString("es-CO", { minimumFractionDigits: 0 })
    : String((product as any).price);

  const isLogged = !!dataUser?.token;

  const alreadyInCart = cartItems.some((it) => String(it.id) === safeId);

  const handleAddToCart = () => {
    if (!isLogged) return;

    // ✅ si no hay id, no dejamos agregar (evita romper el carrito)
    if (!safeId) {
      showToast.error("Este producto no tiene ID válido (id/_id).", {
        duration: 3000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      return;
    }

    if (alreadyInCart) {
      showToast.info("Este producto ya está en tu carrito", {
        duration: 2500,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      return;
    }

    // ✅ Normaliza el objeto ANTES de mandarlo al CartContext
    const normalizedProduct = {
      ...product,
      id: safeId,
      price: priceNumber, // asegura number si tu CartContext lo suma
      imgUrl: imageUrl, // por si el carrito usa imgUrl
      images: (product as any).images ?? (imageUrl ? [imageUrl] : []), // por si usa images[0]
    } as any;

    addProduct(normalizedProduct, 1);

    showToast.success("Agregado al carrito", {
      duration: 2500,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });
  };

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

        <div className="absolute top-3 right-3 z-10">
          <div className="px-3 py-1.5 text-sm shadow-md bg-amber-800/95 text-amber-50 font-extrabold border border-amber-900/30 rounded-lg">
            $ {priceFormatted}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <h4 className="font-extrabold text-lg group-hover:text-emerald-900 transition-colors line-clamp-2">
          {(product as any).title}
        </h4>

        {(product as any).description ? (
          <p className="text-sm text-zinc-700 italic opacity-90 line-clamp-2">
            {(product as any).description}
          </p>
        ) : (
          <p className="text-sm text-zinc-700 italic opacity-60">
            Sin descripción
          </p>
        )}
      </div>

      <div className="w-full flex flex-col gap-2 mt-2">
        <Link
          href={safeId ? `/product/${safeId}` : "/products"}
          className="w-full"
        >
          <button className="font-display w-full border-2 border-amber-800 py-2 uppercase tracking-tight text-sm hover:bg-emerald-800 hover:text-amber-50 transition-all">
            Ver
          </button>
        </Link>

        {!isLoadingUser && isLogged && (
          <button
            onClick={handleAddToCart}
            className={`font-display w-full border-2 border-slate-900 py-2 uppercase tracking-tight transition-all text-sm ${
              alreadyInCart
                ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                : "bg-amber-100 hover:bg-amber-300"
            }`}
            disabled={alreadyInCart}
          >
            {alreadyInCart ? "Ya en el 🛒" : "🛒"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Card;
