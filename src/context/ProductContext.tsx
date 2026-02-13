"use client";

import React, { createContext, useContext, useState } from "react";

export type Product = {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  image: string;
  status: "approved" | "pending";
};

type ProductContextType = {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
};

const ProductContext = createContext<ProductContextType | null>(null);

const initialProducts: Product[] = [
  {
    id: "1",
    title: "Walkman Sony TPS-L2",
    price: 2499,
    description:
      "Reproductor portátil de cassette icónico de finales de los 70s.",
    category: "Audio Retro",
    stock: 10,
    image: "https://images.unsplash.com/photo-1585386959984-a41552231692",
    status: "approved",
  },
];

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
    };

    setProducts((prev) => [...prev, newProduct]);
  };

  return (
    <ProductContext.Provider value={{ products, addProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts debe usarse dentro de ProductProvider");
  }
  return context;
}
