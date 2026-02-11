import { IProductWithDetails } from "@/src/interfaces/product.interface";
import { getAllProductsFromStore } from "@/src/helpers/products.store.mock";

export const mockGetAllProducts = async (): Promise<IProductWithDetails[]> => {
  await new Promise((r) => setTimeout(r, 250));
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
