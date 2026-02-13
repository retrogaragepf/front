"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import type { IUserProduct } from "@/src/interfaces/userProduct.interface";
import { useAuth } from "@/src/context/AuthContext";

// =====================
// Types
// =====================
export type CartItem = {
  // ✅ En UI seguimos usando id como "productId" (para no romper tu app)
  id: string; // productId

  // ✅ Esto es lo que necesita DELETE /cart/{itemId}
  itemId?: string; // cartItemId (del back)

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

  removeFromCart: (productId: string) => void;
  increaseQty: (productId: string) => void;
  decreaseQty: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;

  itemsCount: number;
  totalPrice: number;

  isRemote: boolean;
  isSyncing: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

// =====================
// Axios client (con token)
// =====================
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

const cartApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

cartApi.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return config;

  try {
    const parsed = JSON.parse(raw);
    const token = parsed?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore
  }
  return config;
});

// =====================
// Helpers
// =====================
const CART_KEY_BASE =
  process.env.NEXT_PUBLIC_CART_STORAGE_KEY || "retrogarage_cart";

function buildCartKey(userId?: string | number | null) {
  const id =
    userId === undefined || userId === null || userId === ""
      ? null
      : String(userId);
  return id ? `${CART_KEY_BASE}:${id}` : `${CART_KEY_BASE}:guest`;
}

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

/**
 * ✅ Mapea lo que venga del back (Swagger GET /cart) a tu UI
 * Soporta varias formas comunes:
 * - [{ id, quantity, product: {...} }]
 * - [{ itemId, quantity, product: {...} }]
 * - { items: [...] }
 */
function mapRemoteCartToUI(payload: any): CartItem[] {
  const items = Array.isArray(payload) ? payload : (payload?.items ?? []);

  if (!Array.isArray(items)) return [];

  return items
    .map((it: any) => {
      const prod = it.product ?? it.Product ?? it.productData ?? it.product_id;
      const productId = String(
        it.productId ??
          it.product_id ??
          prod?.id ??
          prod?.productId ??
          prod?._id ??
          "",
      );

      const itemId = String(it.itemId ?? it.id ?? it.cartItemId ?? "");

      return {
        id: productId,
        itemId: itemId || undefined,
        quantity: normalizeQty(it.quantity),
        title: prod?.title ?? prod?.name ?? "Producto",
        price: normalizePrice(prod?.price),
        image: prod?.images?.[0] ?? prod?.image,
        stock: prod?.stock,
        categoryName: prod?.category?.name ?? prod?.categoryName,
        eraName: prod?.era?.name ?? prod?.eraName,
      } as CartItem;
    })
    .filter((x) => x.id);
}

// =====================
// Remote operations (Swagger)
// =====================
async function remoteGetCart(): Promise<CartItem[]> {
  const res = await cartApi.get("/cart");
  return mapRemoteCartToUI(res.data);
}

/**
 * Swagger muestra POST /cart
 * Lo normal es que reciba: { productId, quantity }
 * (Si tu back usa otro nombre, abajo está el fallback product_id)
 */
async function remoteUpsertItem(productId: string, quantity: number) {
  try {
    const res = await cartApi.post("/cart", { productId, quantity });
    return res.data;
  } catch {
    // fallback por si back espera product_id
    const res = await cartApi.post("/cart", {
      product_id: productId,
      quantity,
    });
    return res.data;
  }
}

async function remoteDeleteItem(itemId: string) {
  const res = await cartApi.delete(`/cart/${itemId}`);
  return res.data;
}

// =====================
// Provider
// =====================
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { dataUser } = useAuth();
  const userId = dataUser?.user?.id ?? null;

  const isRemote = Boolean(userId); // ✅ si hay user, usamos back
  const cartKey = useMemo(() => buildCartKey(userId), [userId]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // ---------
  // Hydrate
  // ---------
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      // guest
      if (!isRemote) {
        try {
          const raw = localStorage.getItem(cartKey);
          if (!raw) {
            setCartItems([]);
            return;
          }
          const parsed = JSON.parse(raw) as CartItem[];
          setCartItems(Array.isArray(parsed) ? parsed : []);
        } catch {
          setCartItems([]);
        }
        return;
      }

      // remote
      setIsSyncing(true);
      try {
        const remote = await remoteGetCart();
        if (!cancelled) setCartItems(remote);
      } catch (e) {
        if (!cancelled) setCartItems([]);
        console.warn("CartContext: GET /cart falló", e);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [isRemote, cartKey]);

  // ---------
  // Save guest
  // ---------
  useEffect(() => {
    if (isRemote) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [isRemote, cartKey, cartItems]);

  // ---------
  // Sync helper (refetch)
  // ---------
  const refetchRemote = useCallback(async () => {
    setIsSyncing(true);
    try {
      const remote = await remoteGetCart();
      setCartItems(remote);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ---------
  // Local helper (sumar qty, como back)
  // ---------
  const upsertLocalSum = useCallback((incoming: CartItem) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((p) => p.id === incoming.id);
      if (idx === -1) {
        const maxQty =
          typeof incoming.stock === "number" ? incoming.stock : undefined;
        const q = maxQty
          ? Math.min(incoming.quantity, maxQty)
          : incoming.quantity;
        return [...prev, { ...incoming, quantity: q }];
      }

      const current = prev[idx];
      const nextQty = current.quantity + incoming.quantity;
      const maxQty =
        typeof current.stock === "number" ? current.stock : undefined;

      const q = maxQty ? Math.min(nextQty, maxQty) : nextQty;
      const updated = { ...current, quantity: q };

      return prev.map((p, i) => (i === idx ? updated : p));
    });
  }, []);

  // =====================
  // Actions
  // =====================
  const addProduct = (product: IProductWithDetails, quantity?: number) => {
    const incoming = toCartItem(product, quantity);

    if (!isRemote) {
      upsertLocalSum(incoming);
      return;
    }

    // remoto: POST /cart (back crea o actualiza CartItem)
    setIsSyncing(true);
    remoteUpsertItem(incoming.id, incoming.quantity)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: POST /cart falló", e);
        setIsSyncing(false);
      });
  };

  const addUserProduct = (product: IUserProduct, quantity?: number) => {
    const incoming = toCartItemFromUserProduct(product, quantity);

    if (!isRemote) {
      upsertLocalSum(incoming);
      return;
    }

    setIsSyncing(true);
    remoteUpsertItem(incoming.id, incoming.quantity)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: POST /cart falló", e);
        setIsSyncing(false);
      });
  };

  const setQty = (productId: string, qty: number) => {
    const cleanQty = normalizeQty(qty);

    if (!isRemote) {
      setCartItems((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const maxQty = typeof p.stock === "number" ? p.stock : undefined;
          return {
            ...p,
            quantity: maxQty ? Math.min(cleanQty, maxQty) : cleanQty,
          };
        }),
      );
      return;
    }

    setIsSyncing(true);
    remoteUpsertItem(productId, cleanQty)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: POST /cart (setQty) falló", e);
        setIsSyncing(false);
      });
  };

  const increaseQty = (productId: string) => {
    const current = cartItems.find((p) => p.id === productId);
    const next = (current?.quantity ?? 0) + 1;
    setQty(productId, next);
  };

  const decreaseQty = (productId: string) => {
    const current = cartItems.find((p) => p.id === productId);
    const next = (current?.quantity ?? 0) - 1;

    if (next <= 0) {
      removeFromCart(productId);
      return;
    }
    setQty(productId, next);
  };

  const removeFromCart = (productId: string) => {
    if (!isRemote) {
      setCartItems((prev) => prev.filter((p) => p.id !== productId));
      return;
    }

    // DELETE requiere itemId
    const found = cartItems.find((p) => p.id === productId);
    const itemId = found?.itemId;

    if (!itemId) {
      // Si por alguna razón no vino itemId, rehidrata y vuelve a intentar
      setIsSyncing(true);
      refetchRemote()
        .then(() => {
          const again = cartItems.find((p) => p.id === productId)?.itemId;
          if (!again) throw new Error("No hay itemId para borrar");
          return remoteDeleteItem(again);
        })
        .then(() => refetchRemote())
        .catch((e) => {
          console.warn("CartContext: DELETE /cart/{itemId} falló", e);
          setIsSyncing(false);
        });
      return;
    }

    setIsSyncing(true);
    remoteDeleteItem(itemId)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: DELETE /cart/{itemId} falló", e);
        setIsSyncing(false);
      });
  };

  const clearCart = () => {
    if (!isRemote) {
      setCartItems([]);
      return;
    }

    // No hay DELETE /cart para clear en tu swagger,
    // entonces borramos item por item usando DELETE /cart/{itemId}
    const ids = cartItems.map((p) => p.itemId).filter(Boolean) as string[];

    if (ids.length === 0) {
      setCartItems([]);
      return;
    }

    setIsSyncing(true);
    Promise.allSettled(ids.map((id) => remoteDeleteItem(id)))
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: clearCart falló", e);
        setIsSyncing(false);
      });
  };

  // =====================
  // Derived
  // =====================
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
    isRemote,
    isSyncing,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider />");
  return ctx;
}
