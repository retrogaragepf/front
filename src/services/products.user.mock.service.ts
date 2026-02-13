import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import {
  createProductForUser,
  ensureUserInStore,
  getProductsByUserId,
} from "@/src/helpers/products.store.mock";

export async function mockGetMyProductsSafe(userId?: string | number | null) {
  await new Promise((r) => setTimeout(r, 150));
  if (!userId) return [] as IProductWithDetails[];
  return getProductsByUserId(String(userId));
}

export async function mockEnsureUserStore(params: {
  userId?: string | number | null;
  fullName?: string;
  email?: string;
}) {
  if (!params.userId) return;
  ensureUserInStore({
    userId: String(params.userId),
    fullName: params.fullName,
    email: params.email,
  });
}

export async function mockCreateMyProduct(params: {
  userId: string | number;
  fullName?: string;
  email?: string;
  title: string;
  description: string;
  price: number | string;
  stock: number;
  categoryName: string;
  imageUrl: string;
}) {
  await new Promise((r) => setTimeout(r, 200));
  return createProductForUser({
    userId: String(params.userId),
    fullName: params.fullName,
    email: params.email,
    title: params.title,
    description: params.description,
    price: params.price,
    stock: params.stock,
    categoryName: params.categoryName,
    imageUrl: params.imageUrl,
  });
}
