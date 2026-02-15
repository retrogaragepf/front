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
  status: "pending" | "approved" | "rejected";
  images: string[];
}

const STORAGE_KEY = "retrogarage_products";

// Obtener todos los productos
const getAllProducts = (): IModerationProduct[] => {
  if (typeof window === "undefined") return [];

  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
};

// Guardar todos los productos
const saveAllProducts = (products: IModerationProduct[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

// 🔎 Obtener solo pendientes
export const localGetPendingProducts = async (): Promise<IModerationProduct[]> => {
  const products = getAllProducts();
  return products.filter((p) => p.status === "pending");
};

// ✅ Aprobar producto
export const localApproveProduct = async (id: string) => {
  const products = getAllProducts();

  const updated = products.map((p) =>
    p.id === id ? { ...p, status: "approved" } : p
  );

  saveAllProducts(updated);
};

export const localRejectProduct = async (id: string) => {
  const products = getAllProducts();

  const updated = products.map((p) =>
    p.id === id ? { ...p, status: "rejected" } : p
  );

  saveAllProducts(updated);
};
