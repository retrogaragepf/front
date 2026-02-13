import { IProduct } from "@/src/interfaces/product.interface";

const PRODUCTS_KEY = "retrogarage_products";

/* ============================
   LOCAL HELPERS
============================ */

const getLocalProducts = (): IProduct[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalProducts = (products: IProduct[]) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

/* ============================
   GET ALL
============================ */

export const getAllProducts = async (): Promise<IProduct[]> => {
  return getLocalProducts();
};

/* ============================
   CREATE
============================ */

export const createProduct = async (
  data: Omit<IProduct, "id" | "createdAt" | "status">,
  sellerId: string
): Promise<IProduct> => {
  const products = getLocalProducts();

  const newProduct: IProduct = {
    ...data,
    id: crypto.randomUUID() as any,
    sellerId: sellerId as any,
    createdAt: new Date().toISOString() as any,
    status: "pending",
  };

  products.push(newProduct);
  saveLocalProducts(products);

  return newProduct;
};

/* ============================
   BY USER
============================ */

export const getProductsByUser = async (
  userId: string
): Promise<IProduct[]> => {
  const products = getLocalProducts();
  return products.filter((p) => p.sellerId === userId);
};

/* ============================
   UPDATE STATUS
============================ */

export const updateProductStatus = async (
  productId: string,
  status: "approved" | "rejected"
): Promise<void> => {
  const products = getLocalProducts();

  const updated = products.map((p) =>
    p.id === productId ? { ...p, status } : p
  );

  saveLocalProducts(updated);
};
