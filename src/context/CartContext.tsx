"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import type { IUserProduct } from "@/src/interfaces/userProduct.interface";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;

  stock?: number;
  categoryName?: string;
  eraName?: string;
};

type CartContextValue = {
  cartItems: CartItem[];

  addProduct: (product: IProductWithDetails, quantity?: number) => void;
  addUserProduct: (product: IUserProduct, quantity?: number) => void;

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

function toCartItemFromUserProduct(
  p: IUserProduct,
  quantity?: number,
): CartItem {
  return {
    id: String(p.id),
    title: p.titulo,
    price: normalizePrice(p.precio),
    image: p.imagen,
    stock: p.stock,
    categoryName: p.categoria,
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

  // ✅ ADD (solo una vez)
  const addProduct = (product: IProductWithDetails, quantity?: number) => {
    const incoming = toCartItem(product, quantity);

    setCartItems((prev) => {
      const exists = prev.some((p) => p.id === incoming.id);
      if (exists) return prev;

      if (typeof incoming.stock === "number") {
        incoming.quantity = Math.min(incoming.quantity, incoming.stock);
      }
      return [...prev, incoming];
    });
  };

  // ✅ ADD (solo una vez) - desde arreglo por usuario
  const addUserProduct = (product: IUserProduct, quantity?: number) => {
    const incoming = toCartItemFromUserProduct(product, quantity);

    setCartItems((prev) => {
      const exists = prev.some((p) => p.id === incoming.id);
      if (exists) return prev;

      if (typeof incoming.stock === "number") {
        incoming.quantity = Math.min(incoming.quantity, incoming.stock);
      }
      return [...prev, incoming];
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
    addUserProduct,
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
