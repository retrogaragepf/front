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

  removeFromCart: (productIdOrItemId: string) => void;
  increaseQty: (productIdOrItemId: string) => void;
  decreaseQty: (productIdOrItemId: string) => void;
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

    try {
      const parsed = JSON.parse(raw);
      const t = parsed?.token;
      if (typeof t === "string" && t.length > 10) return t;
    } catch {
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

// helper: arma headers con token (prioriza token del context)
function authHeaders(tokenOverride?: string | null) {
  const token = tokenOverride || getTokenFromStorage();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

/**
 * ✅ Tu schema real:
 * CartItem = { id, quantity, priceAtMoment, product: {...} }
 *
 * ✅ FIX 1.1:
 * - itemId = id del cartItem
 * - id = product.id (productId UI)
 */
function mapRemoteCartToUI(payload: any): CartItem[] {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.cartItems)
      ? payload.cartItems
      : [];

  if (!Array.isArray(items)) return [];

  return items
    .map((it: any) => {
      const prod = it?.product;

      const productId = String(
        prod?.id ?? it?.productId ?? it?.product_id ?? "",
      ).trim();

      const itemId = String(
        it?.id ?? it?.itemId ?? it?.cartItemId ?? "",
      ).trim();

      if (!productId) return null;

      return {
        id: productId,
        itemId: itemId || undefined,

        quantity: normalizeQty(it?.quantity),
        title: prod?.title ?? "Producto",
        price: normalizePrice(it?.priceAtMoment ?? prod?.price),
        image:
          prod?.imgUrl ?? prod?.imageUrl ?? prod?.images?.[0] ?? prod?.image,

        stock: prod?.stock,
        categoryName: prod?.category?.name ?? prod?.categoryName,
        eraName: prod?.era?.name ?? prod?.eraName,
      } as CartItem;
    })
    .filter(Boolean) as CartItem[];
}

// =====================
// Remote operations (con token override)
// =====================
async function remoteGetCart(token?: string | null): Promise<CartItem[]> {
  const res = await cartApi.get("/cart", { headers: authHeaders(token) });
  return mapRemoteCartToUI(res.data);
}

/**
 * ⚠️ BACK: POST /cart SUMA quantity
 * => quantity es DELTA (puede ser + o - si el back lo permite)
 */
async function remoteUpsertItem(
  productId: string,
  quantityDelta: number,
  token?: string | null,
) {
  const res = await cartApi.post(
    "/cart",
    { productId, quantity: quantityDelta },
    { headers: authHeaders(token) },
  );
  return res.data;
}

async function remoteDeleteItem(itemId: string, token?: string | null) {
  const res = await cartApi.delete(`/cart/${itemId}`, {
    headers: authHeaders(token),
  });
  return res.data;
}

// =====================
// Provider
// =====================
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { dataUser } = useAuth();

  const tokenFromCtx =
    (dataUser as any)?.token ?? (dataUser as any)?.user?.token ?? null;

  const userId =
    (dataUser as any)?.user?.id ??
    (dataUser as any)?.id ??
    (dataUser as any)?.userId ??
    null;

  const hasToken = Boolean(tokenFromCtx || getTokenFromStorage());

  // ✅ MANTENGO tu lógica original: remoto solo si hay userId + token
  // (si más adelante quieres remoto solo por token, lo cambiamos)
  const isRemote = Boolean(userId && hasToken);

  const cartKey = useMemo(() => buildCartKey(userId), [userId]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // ---------
  // Local upsert (optimista)
  // ---------
  const upsertLocalSum = useCallback((incoming: CartItem) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((p) => String(p.id) === String(incoming.id));
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

  // ✅ helper: remover SOLO 1 item local
  const removeOneLocal = useCallback((key: string) => {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (p) => String(p.itemId ?? "") === key || String(p.id) === key,
      );
      if (idx === -1) return prev;

      const copy = prev.slice();
      copy.splice(idx, 1);
      return copy;
    });
  }, []);

  // ---------
  // Hydrate
  // ---------
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      // 1) carga local
      try {
        const raw = localStorage.getItem(cartKey);
        const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
        if (!cancelled) setCartItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        if (!cancelled) setCartItems([]);
      }

      // 2) si remoto, pisar con DB (precio/stock actualizados)
      if (!isRemote) return;

      setIsSyncing(true);
      try {
        const remote = await remoteGetCart(tokenFromCtx);
        if (!cancelled) setCartItems(remote);
      } catch (e) {
        console.warn("CartContext: GET /cart falló (fallback a local)", e);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [isRemote, cartKey, tokenFromCtx]);

  // ---------
  // Save local always (como lo tenías)
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
      const remote = await remoteGetCart(tokenFromCtx);
      setCartItems(remote);
    } catch (e) {
      console.warn("CartContext: refetchRemote falló (se mantiene local)", e);
    } finally {
      setIsSyncing(false);
    }
  }, [isRemote, tokenFromCtx]);

  // ✅ Resolver: si UI pasa itemId, lo convertimos a productId para qty
  const resolveProductId = useCallback(
    (idOrItemId: string) => {
      const key = String(idOrItemId ?? "").trim();
      if (!key) return null;

      const byProduct = cartItems.find((p) => String(p.id) === key);
      if (byProduct) return String(byProduct.id);

      const byItem = cartItems.find((p) => String(p.itemId ?? "") === key);
      if (byItem) return String(byItem.id);

      return null;
    },
    [cartItems],
  );

  // =====================
  // Actions
  // =====================
  const addProduct = (product: IProductWithDetails, quantity?: number) => {
    const incoming = toCartItem(product, quantity);
    if (!incoming.id) return;

    upsertLocalSum(incoming);

    if (!isRemote) return;

    setIsSyncing(true);
    remoteUpsertItem(incoming.id, incoming.quantity, tokenFromCtx)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: POST /cart falló (se mantiene local)", e);
        setIsSyncing(false);
      });
  };

  const addUserProduct = (product: IUserProduct, quantity?: number) => {
    const incoming = toCartItemFromUserProduct(product, quantity);
    if (!incoming.id) return;

    upsertLocalSum(incoming);

    if (!isRemote) return;

    setIsSyncing(true);
    remoteUpsertItem(incoming.id, incoming.quantity, tokenFromCtx)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn("CartContext: POST /cart falló (se mantiene local)", e);
        setIsSyncing(false);
      });
  };

  /**
   * ✅ CAMBIO MÍNIMO por POST /cart SUMA:
   * setQty manda DELTA = desired - current
   */
  const setQty = (productId: string, qty: number) => {
    const cleanQty = normalizeQty(qty);

    const current = cartItems.find((p) => String(p.id) === String(productId));
    const currentQty = current?.quantity ?? 0;

    setCartItems((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(productId)) return p;
        const maxQty = typeof p.stock === "number" ? p.stock : undefined;
        return {
          ...p,
          quantity: maxQty ? Math.min(cleanQty, maxQty) : cleanQty,
        };
      }),
    );

    if (!isRemote) return;

    const delta = cleanQty - currentQty;
    if (delta === 0) return;

    setIsSyncing(true);
    remoteUpsertItem(String(productId), delta, tokenFromCtx)
      .then(() => refetchRemote())
      .catch((e) => {
        console.warn(
          "CartContext: POST /cart (delta) falló (se mantiene local)",
          e,
        );
        setIsSyncing(false);
      });
  };

  const increaseQty = (idOrItemId: string) => {
    const productId = resolveProductId(idOrItemId);
    if (!productId) return;

    const current = cartItems.find((p) => String(p.id) === String(productId));
    const next = (current?.quantity ?? 0) + 1;
    setQty(productId, next);
  };

  const decreaseQty = (idOrItemId: string) => {
    const productId = resolveProductId(idOrItemId);
    if (!productId) return;

    const current = cartItems.find((p) => String(p.id) === String(productId));
    const next = (current?.quantity ?? 0) - 1;

    if (next <= 0) {
      removeFromCart(productId);
      return;
    }

    setQty(productId, next);
  };

  /**
   * ✅ FIX 1.1:
   * - delete remoto SOLO con itemId real
   * - no refetchRemote si no hay itemId
   */
  const removeFromCart = (productIdOrItemId: string) => {
    const key = String(productIdOrItemId ?? "").trim();
    if (!key) return;

    removeOneLocal(key);

    if (!isRemote) return;

    const found =
      cartItems.find((p) => String(p.itemId ?? "") === key) ??
      cartItems.find((p) => String(p.id) === key);

    const itemId = found?.itemId;
    if (!itemId) return;

    setIsSyncing(true);
    remoteDeleteItem(String(itemId), tokenFromCtx)
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
    setCartItems([]);

    if (!isRemote) return;

    const ids = cartItems.map((p) => p.itemId).filter(Boolean) as string[];
    if (ids.length === 0) return;

    setIsSyncing(true);
    Promise.allSettled(ids.map((id) => remoteDeleteItem(id, tokenFromCtx)))
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
