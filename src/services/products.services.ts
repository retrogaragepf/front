// import { IProduct } from "@/src/interfaces/product.interface";

// const APIURL = process.env.NEXT_PUBLIC_API_URL;

// export const getAllProducts = async () => {
//   try {
//     const res = await fetch(`${APIURL}/products`, {
//       method: "GET",
//     });
//     const productsResponse: IProduct[] = await res.json();
//     return productsResponse;
//   } catch (error: any) {
//     throw new Error(error as string);
//   }
// };

// export const getProductById = async (id: string) => {
//   try {
//     const AllProducts = await getAllProducts();
//     const product = AllProducts.find((product) => product.id === Number(id));
//     if (!product) {
//       throw new Error(`Producto no encontrado con el ID: ${id} `);
//     }
//     return product;
//   } catch (error) {
//     throw new Error(error as string);
//   }
// };
import { IProduct } from "@/src/interfaces/product.interface";
import { mockGetAllProducts } from "@/src/helpers/products.mock";

export const getAllProducts = async (): Promise<IProduct[]> => {
  const APIURL = process.env.NEXT_PUBLIC_API_URL;

  // ✅ Si no hay backend configurado, NO hacemos fetch -> usamos mock
  if (!APIURL) {
    return mockGetAllProducts();
  }

  try {
    const res = await fetch(`${APIURL}/products`, { method: "GET" });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al obtener productos`);
    }

    const productsResponse: IProduct[] = await res.json();
    return productsResponse;
  } catch (error) {
    // ✅ Opcional: si el backend existe pero está caído, igual devolvemos mock
    return mockGetAllProducts();
  }
};

export const getProductById = async (id: string): Promise<IProduct> => {
  const allProducts = await getAllProducts();

  const product = allProducts.find((p) => p.id === Number(id));

  if (!product) {
    throw new Error(`Producto no encontrado con el ID: ${id}`);
  }

  return product;
};
