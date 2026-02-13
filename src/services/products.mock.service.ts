import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import { getAllProductsFromStore } from "@/src/helpers/products.store.mock";

const LS_KEY = "retrogarage_products";

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

function readFromLocalStorage(): IProductWithDetails[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];

    return arr.map((p: any) => ({
      ...p,
      id: String(p.id),
      price: Number(p.price), // en el form llega como string
      images: Array.isArray(p.images) ? p.images : [],
      stock: typeof p.stock === "number" ? p.stock : Number(p.stock ?? 0),
      category: { name: CATEGORY_MAP[p.categoryId] ?? "Sin categoría" },
      era: { name: ERA_MAP[p.eraId] ?? "Sin era" },
    })) as IProductWithDetails[];
  } catch {
    return [];
  }
}

export const mockGetAllProducts = async (): Promise<IProductWithDetails[]> => {
  await new Promise((r) => setTimeout(r, 250));

  // 1) Primero: lo que crean en "Vender"
  const fromLS = readFromLocalStorage();
  if (fromLS.length > 0) return fromLS;

  // 2) Fallback: productos mock fijos
  return getAllProductsFromStore();
};

export const mockGetProductById = async (
  id: string,
): Promise<IProductWithDetails> => {
  await new Promise((r) => setTimeout(r, 150));

  const products = await mockGetAllProducts();
  const product = products.find((p) => String(p.id) === String(id));
  if (!product) throw new Error(`Producto no encontrado con ID: ${id}`);

  return product;
};
