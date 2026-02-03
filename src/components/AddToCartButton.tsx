"use client";

import { useCart } from "@/src/context/CartContext";
import { IProduct } from "@/src/interfaces/product.interface";

interface ButtonProps {
  product: IProduct;
}

function AddToCartButton({ product }: ButtonProps) {
  const { addToCart } = useCart();
  return (
    <button
      onClick={() => addToCart(product)}
      className="bg-azulapple cursor-pointer text-white rounded-lg px-4 py-2 w-full lg:w-auto"
    >
      Agregar al Carrito
    </button>
  );
}

export default AddToCartButton;
