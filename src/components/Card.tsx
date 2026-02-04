import { IProduct } from "@/src/interfaces/product.interface";
import Image from "next/image";
import Link from "next/link";

interface CardProps {
  product: IProduct;
}

function Card({ product }: CardProps) {
  const price = product.price.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
  });

  return (
    <div className="group w-full flex flex-col">
      <div className="relative aspect-4/5 overflow-hidden bg-amber-100 border border-amber-300 shadow-sm">
        <Image
          src={product.image}
          alt={`product image ${product.name}`}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 260px"
          className="object-cover transition-all duration-500 scale-105 group-hover:scale-110"
        />

        {/* Tag precio */}
        <div className="absolute top-4 left-4">
          <div className="px-4 py-2 shadow-md -rotate-12 bg-amber-800 text-amber-50 font-extrabold border border-amber-900/30">
            COP$ {price}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <h4 className="font-extrabold text-lg group-hover:text-emerald-900 transition-colors line-clamp-2">
          {product.name}
        </h4>
        <p className="text-sm text-zinc-700 italic opacity-90 line-clamp-2">
          {product.description}
        </p>
      </div>

      <Link href={`/product/${product.id}`} className="w-full">
        
        <button className="w-full border-2 border-amber-800 py-2 font-bold uppercase tracking-tight hover:bg-emerald-800 hover:text-amber-50 transition-all">
          Ver producto
        </button>
      </Link>
    </div>
  );
}

export default Card;
