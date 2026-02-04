import { IProduct } from "@/src/interfaces/product.interface";
import { mockGetAllProducts } from "@/src/helpers/products.mock";

const APIURL = process.env.NEXT_PUBLIC_API_URL;

export const getAllProducts = async (): Promise<IProduct[]> => {
  if (!APIURL) {
    return await mockGetAllProducts();
  }

  try {
    const res = await fetch(`${APIURL}/products`, { method: "GET" });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al obtener productos`);
    }

    const productsResponse: IProduct[] = await res.json();
    return productsResponse;
  } catch {
    return await mockGetAllProducts();
  }
};

export const getProductById = async (id: string): Promise<IProduct> => {
  const allProducts = await getAllProducts();

  const numericId = Number(id);
  const product = allProducts.find((p) => p.id === numericId);

  if (!product) {
    throw new Error(`Producto no encontrado con el ID: ${id}`);
  }

  return product;
};
