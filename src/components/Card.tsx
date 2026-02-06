import Image from "next/image";
import Link from "next/link";
import { IProductWithDetails } from "@/src/interfaces/product.interface";

interface CardProps {
  product: IProductWithDetails;
}

function Card({ product }: CardProps) {
  const priceNumber = Number(product.price);
  const priceFormatted = Number.isFinite(priceNumber)
    ? priceNumber.toLocaleString("es-CO", { minimumFractionDigits: 0 })
    : String(product.price);

  const imageUrl = product.images?.[0] ?? "";

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

      <Link href={`/product/${product.id}`} className="w-full">
        <button className="font-display w-full border-2 border-amber-800 py-2 uppercase tracking-tight hover:bg-emerald-800 hover:text-amber-50 transition-all">
          Ver Producto
        </button>
      </Link>
    </div>
  );
}

export default Card;
