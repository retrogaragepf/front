"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";

export type CartItem = {
  id: string;
  title: string;
  price: number; // number (en tu mock viene string)
  image?: string;
  quantity: number;

  stock?: number;
  categoryName?: string;
  eraName?: string;
};

type CartContextValue = {
  cartItems: CartItem[];

  // ✅ Lo que tú quieres: pasarle el producto entero (mock o real)
  addProduct: (product: IProductWithDetails, quantity?: number) => void;

  // (Opcional) por si ya venías usando addToCart con un objeto armado
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;

  removeFromCart: (id: string) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;

  itemsCount: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = process.env.NEXT_PUBLIC_CART_STORAGE_KEY || "retrogarage_cart";

function normalizePrice(price: unknown) {
  const n = Number(price);
  return Number.isFinite(n) ? n : 0;
}

function normalizeQty(qty?: number) {
  const n = Number(qty ?? 1);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

function toCartItem(product: IProductWithDetails, quantity?: number): CartItem {
  return {
    id: String(product.id),
    title: product.title,
    price: normalizePrice(product.price),
    image: product.images?.[0],
    stock: product.stock,
    categoryName: product.category?.name,
    eraName: product.era?.name,
    quantity: normalizeQty(quantity),
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // ✅ Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) setCartItems(parsed);
    } catch (e) {
      console.warn("CartContext: error leyendo localStorage", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Save
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn("CartContext: error guardando localStorage", e);
    }
  }, [cartItems]);

  // ✅ ADD (desde product)
  const addProduct = (product: IProductWithDetails, quantity?: number) => {
    const incoming = toCartItem(product, quantity);

    setCartItems((prev) => {
      const idx = prev.findIndex((p) => p.id === incoming.id);

      if (idx !== -1) {
        const copy = [...prev];
        const current = copy[idx];
        const nextQty = current.quantity + incoming.quantity;

        // si hay stock, no pasarse
        const maxQty =
          typeof current.stock === "number" ? current.stock : undefined;

        copy[idx] = {
          ...current,
          quantity: maxQty ? Math.min(nextQty, maxQty) : nextQty,
        };
        return copy;
      }

      // si hay stock y quantity viene grande, limitar
      if (typeof incoming.stock === "number") {
        incoming.quantity = Math.min(incoming.quantity, incoming.stock);
      }

      return [...prev, incoming];
    });
  };

  // ✅ ADD (genérico)
  const addToCart: CartContextValue["addToCart"] = (item) => {
    const qtyToAdd = normalizeQty(item.quantity);

    setCartItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);

      if (idx !== -1) {
        const copy = [...prev];
        const current = copy[idx];
        const nextQty = current.quantity + qtyToAdd;

        const maxQty =
          typeof current.stock === "number" ? current.stock : undefined;

        copy[idx] = {
          ...current,
          quantity: maxQty ? Math.min(nextQty, maxQty) : nextQty,
        };
        return copy;
      }

      return [
        ...prev,
        {
          id: item.id,
          title: item.title,
          price: normalizePrice(item.price),
          image: item.image,
          stock: item.stock,
          categoryName: item.categoryName,
          eraName: item.eraName,
          quantity: qtyToAdd,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((p) => p.id !== id));
  };

  const increaseQty = (id: string) => {
    setCartItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextQty = p.quantity + 1;
        const maxQty = typeof p.stock === "number" ? p.stock : undefined;
        return { ...p, quantity: maxQty ? Math.min(nextQty, maxQty) : nextQty };
      }),
    );
  };

  const decreaseQty = (id: string) => {
    setCartItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity: p.quantity - 1 } : p))
        .filter((p) => p.quantity >= 1),
    );
  };

  const setQty = (id: string, qty: number) => {
    const cleanQty = normalizeQty(qty);

    setCartItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const maxQty = typeof p.stock === "number" ? p.stock : undefined;
        return {
          ...p,
          quantity: maxQty ? Math.min(cleanQty, maxQty) : cleanQty,
        };
      }),
    );
  };

  const clearCart = () => setCartItems([]);

  const itemsCount = useMemo(
    () => cartItems.reduce((acc, it) => acc + it.quantity, 0),
    [cartItems],
  );

  const totalPrice = useMemo(
    () => cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0),
    [cartItems],
  );

  const value: CartContextValue = {
    cartItems,
    addProduct,
    addToCart,
    removeFromCart,
    increaseQty,
    decreaseQty,
    setQty,
    clearCart,
    itemsCount,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider />");
  return ctx;
}
