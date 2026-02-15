import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import { getAllProductsFromStore } from "@/src/helpers/products.store.mock";

/* ================================
   🔹 TIPOS
================================ */

export type ProductStatus = "pending" | "approved" | "rejected";

export interface IModerationProduct {
  id: string;
  title: string;
  description?: string;
  price: string;
  stock: number;
  sellerId: string;
  categoryId: string;
  eraId: string;
  createdAt: string;
  status: ProductStatus;
  images: string[];
}

const STORAGE_KEY = "retrogarage_products";

/* ================================
   🔹 HELPERS BASE
================================ */

const getAllRawProducts = (): IModerationProduct[] => {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : [];

  if (!Array.isArray(parsed)) return [];

  return parsed.map((p: any) => ({
    id: String(p.id),
    title: p.title,
    description: p.description,
    price: String(p.price),
    stock: Number(p.stock ?? 0),
    sellerId: String(p.sellerId),
    categoryId: String(p.categoryId),
    eraId: String(p.eraId),
    createdAt: String(p.createdAt),
    status: p.status as ProductStatus,
    images: Array.isArray(p.images) ? p.images : [],
  }));
};

const saveAllProducts = (products: IModerationProduct[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

/* ================================
   🔹 MODERACIÓN (ADMIN)
================================ */

export const localGetPendingProducts = async (): Promise<IModerationProduct[]> => {
  return getAllRawProducts().filter((p) => p.status === "pending");
};

export const localApproveProduct = async (id: string) => {
  const updated: IModerationProduct[] = getAllRawProducts().map((p) =>
    p.id === id ? { ...p, status: "approved" as ProductStatus } : p
  );

  saveAllProducts(updated);
};


export const localRejectProduct = async (id: string) => {
  const updated: IModerationProduct[] = getAllRawProducts().map((p) =>
    p.id === id ? { ...p, status: "rejected" as ProductStatus } : p
  );

  saveAllProducts(updated);
};


/* ================================
   🔹 MAPS MOCK
================================ */

const CATEGORY_MAP: Record<string, string> = {
  "11111111-1111-1111-1111-111111111111": "Videojuegos Retro",
  "dddddddd-dddd-dddd-dddd-dddddddddddd": "Audio Retro",
  "55555555-5555-5555-5555-555555555555": "Decoración Retro",
};

const ERA_MAP: Record<string, string> = {
  "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": "70s",
  "cccccccc-cccc-cccc-cccc-cccccccccccc": "80s",
  "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee": "90s",
};

/* ================================
   🔹 TIENDA (SOLO APROBADOS)
================================ */

function mapToStoreFormat(
  products: IModerationProduct[]
): IProductWithDetails[] {
  return products
    .filter((p) => p.status === "approved")
    .map((p) => ({
      id: String(p.id),
      title: p.title,
      description: p.description,
      price: Number(p.price),
      images: p.images,
      stock: p.stock,

      category: {
        name: CATEGORY_MAP[p.categoryId] ?? "Sin categoría",
      },

      era: {
        name: ERA_MAP[p.eraId] ?? "Sin era",
      },

      seller: {
        id: p.sellerId,
        name: `Usuario ${p.sellerId.slice(0, 4)}`,
      },
    }));
}

export const mockGetAllProducts = async (): Promise<IProductWithDetails[]> => {
  await new Promise((r) => setTimeout(r, 250));

  const localProducts = getAllRawProducts();

  if (localProducts.length > 0) {
    return mapToStoreFormat(localProducts);
  }

  return getAllProductsFromStore();
};

export const mockGetProductById = async (
  id: string
): Promise<IProductWithDetails> => {
  const products = await mockGetAllProducts();
  const product = products.find((p) => String(p.id) === String(id));

  if (!product) {
    throw new Error(`Producto no encontrado con ID: ${id}`);
  }

  return product;
};
