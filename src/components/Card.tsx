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

  const priceNumber = Number(product.price);
  const priceFormatted = Number.isFinite(priceNumber)
    ? priceNumber.toLocaleString("es-CO", { minimumFractionDigits: 0 })
    : String(product.price);

  const imageUrl = product.images?.[0] ?? "";
  const isLogged = !!dataUser?.token;

  const alreadyInCart = cartItems.some((it) => it.id === String(product.id));

  const handleAddToCart = () => {
    if (!isLogged) return;

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

    addProduct(product, 1);

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
      <div className="relative aspect-4/5 overflow-hidden bg-amber-100 border border-amber-300 shadow-sm">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`product image ${product.title}`}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 260px"
            className="object-cover transition-all duration-500 scale-105 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm">
            Sin imagen
          </div>
        )}

        <div className="absolute top-4 left-4">
          <div className="px-4 py-2 shadow-md -rotate-12 bg-amber-800 text-amber-50 font-extrabold border border-amber-900/30">
            $ {priceFormatted}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <h4 className="font-extrabold text-lg group-hover:text-emerald-900 transition-colors line-clamp-2">
          {product.title}
        </h4>

        {product.description ? (
          <p className="text-sm text-zinc-700 italic opacity-90 line-clamp-2">
            {product.description}
          </p>
        ) : (
          <p className="text-sm text-zinc-700 italic opacity-60">
            Sin descripción
          </p>
        )}
      </div>

      <div className="w-full flex flex-col gap-2 mt-2">
        <Link href={`/product/${product.id}`} className="w-full">
          <button className="font-display w-full border-2 border-amber-800 py-2 uppercase tracking-tight text-sm hover:bg-emerald-800 hover:text-amber-50 transition-all">
            Ver
          </button>
        </Link>

        {/* ✅ Solo visible si está logeado */}
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
