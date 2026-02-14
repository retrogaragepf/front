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
  id: string; // productId (UI)
  itemId?: string; // cartItemId (back)

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
// Config
// =====================
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";

// ⚠️ tu proyecto ha usado varias keys en distintos momentos.
// Esta lista hace el token “a prueba de cambios”.
const TOKEN_KEYS = [
  process.env.NEXT_PUBLIC_JWT_TOKEN_KEY,
  "retrogarage_auth",
  "auth_token",
  "authToken",
  "token",
].filter(Boolean) as string[];

const CART_KEY_BASE =
  process.env.NEXT_PUBLIC_CART_STORAGE_KEY || "retrogarage_cart";

// =====================
// Token helper (robusto)
// =====================
function getTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  for (const key of TOKEN_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    // Caso 1: JSON {"token":"..."}
    try {
      const parsed = JSON.parse(raw);
      const t = parsed?.token;
      if (typeof t === "string" && t.length > 10) return t;
    } catch {
      // Caso 2: string plano "eyJ..."
      if (raw.length > 10) return raw;
    }
  }

  return null;
}

// =====================
// Axios client
// =====================
const cartApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

cartApi.interceptors.request.use((config) => {
  const token = getTokenFromStorage();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// =====================
// Helpers
// =====================
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

function safeProductId(p: any) {
  return String(p?.id ?? p?._id ?? p?.productId ?? "");
}

function toCartItem(product: IProductWithDetails, quantity?: number): CartItem {
  const p: any = product as any;
  const id = safeProductId(p);

  return {
    id,
    title: p.title ?? p.name ?? "Producto",
    price: normalizePrice(p.price),
    image: p.imgUrl ?? p.imageUrl ?? p.images?.[0] ?? p.image,
    stock: p.stock,
    categoryName: p.category?.name ?? p.categoryName,
    eraName: p.era?.name ?? p.eraName,
    quantity: normalizeQty(quantity),
  };
}

function toCartItemFromUserProduct(
  p: IUserProduct,
  quantity?: number,
): CartItem {
  const anyP: any = p as any;
  return {
    id: String(anyP.id ?? anyP._id ?? ""),
    title: anyP.titulo ?? anyP.title ?? "Producto",
    price: normalizePrice(anyP.precio ?? anyP.price),
    image: anyP.imagen ?? anyP.image,
    stock: anyP.stock,
    categoryName: anyP.categoria ?? anyP.categoryName,
    quantity: normalizeQty(quantity),
  };
}

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
        image:
          prod?.images?.[0] ?? prod?.imgUrl ?? prod?.imageUrl ?? prod?.image,
        stock: prod?.stock,
        categoryName: prod?.category?.name ?? prod?.categoryName,
        eraName: prod?.era?.name ?? prod?.eraName,
      } as CartItem;
    })
    .filter((x) => x.id);
}

// =====================
// Remote operations
// =====================
async function remoteGetCart(): Promise<CartItem[]> {
  const res = await cartApi.get("/cart");
  return mapRemoteCartToUI(res.data);
}

async function remoteUpsertItem(productId: string, quantity: number) {
  try {
    const res = await cartApi.post("/cart", { productId, quantity });
    return res.data;
  } catch {
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

  // ✅ userId robusto (por si cambia el shape de auth)
  const userId =
    dataUser?.user?.id ??
    (dataUser as any)?.id ??
    (dataUser as any)?.userId ??
    null;

  // ✅ remoto SOLO si hay token; si falla, no nos quedamos sin carrito
  const hasToken = Boolean(dataUser?.token || getTokenFromStorage());
  const isRemote = Boolean(userId && hasToken);

  const cartKey = useMemo(() => buildCartKey(userId), [userId]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // ---------
  // Local upsert (optimista)
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

  // ---------
  // Hydrate
  // ---------
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      // 1) carga local siempre (para que el badge no quede en 0)
      try {
        const raw = localStorage.getItem(cartKey);
        const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
        if (!cancelled) setCartItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        if (!cancelled) setCartItems([]);
      }

      // 2) si remoto, intenta reemplazar con lo del back
      if (!isRemote) return;

      setIsSyncing(true);
      try {
        const remote = await remoteGetCart();
        if (!cancelled) setCartItems(remote);
      } catch (e) {
        // ✅ si el back falla, nos quedamos con local (no “rompe” el carrito)
        console.warn("CartContext: GET /cart falló (fallback a local)", e);
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
  // Save local always (incluye usuario)
  // ---------
  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartKey, cartItems]);

  // ---------
  // Refetch remote
  // ---------
  const refetchRemote = useCallback(async () => {
    if (!isRemote) return;
    setIsSyncing(true);
    try {
      const remote = await remoteGetCart();
      setCartItems(remote);
    } catch (e) {
      console.warn("CartContext: refetchRemote falló (se mantiene local)", e);
    } finally {
      setIsSyncing(false);
    }
  }, [isRemote]);

  // =====================
  // Actions
  // =====================
  const addProduct = (product: IProductWithDetails, quantity?: number) => {
    const incoming = toCartItem(product, quantity);

    // ✅ si no hay id/_id válido, no rompemos estado
    if (!incoming.id) {
      console.warn("CartContext: producto sin id/_id:", product);
      return;
    }

    // ✅ OPTIMISTA: actualiza UI SIEMPRE
    upsertLocalSum(incoming);

    // ✅ luego intenta sync remoto (si aplica)
    if (!isRemote) return;

    setIsSyncing(true);
    remoteUpsertItem(incoming.id, incoming.quantity)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: POST /cart falló (se mantiene local)", e);
        setIsSyncing(false);
      });
  };

  const addUserProduct = (product: IUserProduct, quantity?: number) => {
    const incoming = toCartItemFromUserProduct(product, quantity);

    if (!incoming.id) {
      console.warn("CartContext: userProduct sin id/_id:", product);
      return;
    }

    upsertLocalSum(incoming);

    if (!isRemote) return;

    setIsSyncing(true);
    remoteUpsertItem(incoming.id, incoming.quantity)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: POST /cart falló (se mantiene local)", e);
        setIsSyncing(false);
      });
  };

  const setQty = (productId: string, qty: number) => {
    const cleanQty = normalizeQty(qty);

    // ✅ actualiza local primero
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

    if (!isRemote) return;

    setIsSyncing(true);
    remoteUpsertItem(productId, cleanQty)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn(
          "CartContext: POST /cart (setQty) falló (se mantiene local)",
          e,
        );
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
    // ✅ local primero
    setCartItems((prev) => prev.filter((p) => p.id !== productId));

    if (!isRemote) return;

    const found = cartItems.find((p) => p.id === productId);
    const itemId = found?.itemId;

    if (!itemId) {
      // si no hay itemId, intenta refetch (pero sin romper UI)
      refetchRemote().catch(() => {});
      return;
    }

    setIsSyncing(true);
    remoteDeleteItem(itemId)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn(
          "CartContext: DELETE /cart/{itemId} falló (se mantiene local)",
          e,
        );
        setIsSyncing(false);
      });
  };

  const clearCart = () => {
    // ✅ local primero
    setCartItems([]);

    if (!isRemote) return;

    const ids = cartItems.map((p) => p.itemId).filter(Boolean) as string[];
    if (ids.length === 0) return;

    setIsSyncing(true);
    Promise.allSettled(ids.map((id) => remoteDeleteItem(id)))
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: clearCart falló (se mantiene local)", e);
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
