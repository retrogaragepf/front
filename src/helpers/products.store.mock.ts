// src/helpers/products.store.mock.ts
import type { IProductWithDetails } from "@/src/interfaces/product.interface";

const STORE_KEY = "retrogarage_users_products_v1";

type StoredUser = {
  id: string;
  fullName?: string;
  email?: string;
  products: IProductWithDetails[];
};

type StoreShape = {
  users: Record<string, StoredUser>;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readStore(): StoreShape {
  if (typeof window === "undefined") return { users: {} };
  return safeParse<StoreShape>(localStorage.getItem(STORE_KEY), { users: {} });
}

function writeStore(store: StoreShape) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

// ✅ ids mock por categoría (estables)
const CATEGORY_ID_MAP: Record<string, string> = {
  "Audio Retro": "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "Videojuegos Retro": "11111111-1111-1111-1111-111111111111",
  "Fotografía Retro": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "Hogar Retro": "99999999-9999-9999-9999-999999999999",
  "Música Retro": "22222222-2222-2222-2222-222222222222",
  "Arcade Retro": "33333333-3333-3333-3333-333333333333",
  "Video Retro": "44444444-4444-4444-4444-444444444444",
  "Decoración Retro": "55555555-5555-5555-5555-555555555555",
};

function inferEra(input: {
  title: string;
  description: string;
  categoryName: string;
}) {
  const text =
    `${input.title} ${input.description} ${input.categoryName}`.toLowerCase();

  if (text.includes("70") || text.includes("setenta")) {
    return {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "70s",
      description: "Artículos de los años 70.",
      yearRange: "1970-1979",
      createdAt: "2026-02-05",
    };
  }

  if (text.includes("80") || text.includes("ochent")) {
    return {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "80s",
      description: "Artículos de los años 80.",
      yearRange: "1980-1989",
      createdAt: "2026-02-05",
    };
  }

  if (
    text.includes("90") ||
    text.includes("noventa") ||
    text.includes("1989")
  ) {
    return {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      name: "90s",
      description: "Artículos de los años 90.",
      yearRange: "1990-1999",
      createdAt: "2026-02-05",
    };
  }

  return {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    name: "90s",
    description: "Artículos retro.",
    yearRange: "1990-1999",
    createdAt: "2026-02-05",
  };
}

function uid() {
  // id simple para mock (suficiente para UI)
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** ✅ Asegura que el usuario exista en el store */
export function ensureUserInStore(params: {
  userId: string;
  fullName?: string;
  email?: string;
}) {
  const store = readStore();
  const { userId, fullName, email } = params;

  if (!store.users[userId]) {
    store.users[userId] = { id: userId, fullName, email, products: [] };
  } else {
    // actualiza datos si vienen
    store.users[userId].fullName = fullName ?? store.users[userId].fullName;
    store.users[userId].email = email ?? store.users[userId].email;
  }

  writeStore(store);
}

/** ✅ Devuelve products[] del user */
export function getProductsByUserId(userId: string): IProductWithDetails[] {
  const store = readStore();
  return store.users[userId]?.products ?? [];
}

/** ✅ Aplana todos los productos (marketplace público) */
export function getAllProductsFromStore(): IProductWithDetails[] {
  const store = readStore();
  return Object.values(store.users).flatMap((u) => u.products);
}

/** ✅ Crear producto para el user (tu “publicar artículo”) */
export function createProductForUser(params: {
  userId: string;
  fullName?: string;
  email?: string;
  title: string;
  description: string;
  price: number | string;
  stock: number;
  categoryName: string;
  imageUrl: string;
}) {
  const {
    userId,
    fullName,
    email,
    title,
    description,
    price,
    stock,
    categoryName,
    imageUrl,
  } = params;

  ensureUserInStore({ userId, fullName, email });

  const categoryId =
    CATEGORY_ID_MAP[categoryName] ?? "ffffffff-ffff-ffff-ffff-ffffffffffff";
  const era = inferEra({ title, description, categoryName });

  const product: IProductWithDetails = {
    id: uid(),
    title,
    description,
    price: String(price), // 👈 mantiene compat con tu UI actual
    stock,

    sellerId: userId,
    categoryId,
    eraId: era.id,
    createdAt: new Date().toISOString().slice(0, 10),

    seller: {
      id: userId,
      fullName: fullName ?? "Seller",
      email: email ?? "seller@retrogarage.com",
    },

    category: {
      id: categoryId,
      name: categoryName,
      description: "Categoría retro",
      createdAt: new Date().toISOString().slice(0, 10),
    },

    era,

    images: [imageUrl],

    averageRating: 0,
    totalReviews: 0,
  };

  const store = readStore();
  store.users[userId].products.unshift(product);
  writeStore(store);

  return product;
}

/** ✅ Opcional: reset de store (solo para pruebas) */
export function resetProductsStore() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORE_KEY);
}
