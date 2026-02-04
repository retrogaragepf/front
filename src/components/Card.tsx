import { IProduct } from "@/src/interfaces/product.interface";
import Image from "next/image";
import Link from "next/link";

interface CardProps {
  product: IProduct;
}

function Card({ product }: CardProps) {
  return (
    <div
      className="
        w-full 
        max-w-xs sm:max-w-sm 
        min-h-95 
        flex flex-col 
        items-center 
        justify-between 
        gap-4 
        text-center 
        bg-amber-100
        border border-amber-300
        rounded-2xl 
        shadow-md
        p-4 sm:p-5
        transition
        hover:shadow-lg
        hover:-translate-y-0.5
      "
    >
      <div className="w-full flex justify-center">
        <Image
          src={product.image}
          alt={`product image ${product.name}`}
          width={250}
          height={250}
          className="object-contain rounded-xl"
        />
      </div>

      <p className="text-center font-extrabold text-sm sm:text-base text-zinc-900 line-clamp-2">
        {product.name}
      </p>

      <p className="font-extrabold text-lg sm:text-xl flex justify-center items-center text-emerald-900">
        COP$
        {product.price.toLocaleString("es-CO", {
          minimumFractionDigits: 0,
        })}
      </p>

      <div className="w-full flex justify-center items-center mt-2">
        <Link href={`/product/${product.id}`} className="w-full">
          <button
            type="button"
            className="
              cursor-pointer
              rounded-lg 
              px-4 
              py-2 
              w-full
              bg-emerald-800
              text-amber-50
              border border-emerald-900/40
              hover:bg-emerald-900
              transition
            "
          >
            Ver Producto
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Card;
