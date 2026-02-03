import { IProduct } from "@/src/interfaces/product.interface";

export const mockProducts: IProduct[] = [
  {
    id: 1,
    name: "Cámara Retro 90s",
    description: "Cámara vintage funcional, ideal para colección.",
    price: 250000,
    stock: 5,
    image: "https://picsum.photos/seed/retrocam/600/600",
    categoryId: 1,
  },
  {
    id: 2,
    name: "Walkman Clásico",
    description: "Reproductor retro en buen estado, estilo nostálgico.",
    price: 180000,
    stock: 8,
    image: "https://picsum.photos/seed/walkman/600/600",
    categoryId: 2,
  },
  {
    id: 3,
    name: "Teclado Mecánico Retro",
    description: "Teclado estilo retro, ideal para setup vintage.",
    price: 320000,
    stock: 12,
    image: "https://picsum.photos/seed/keyboard/600/600",
    categoryId: 3,
  },
];

export const mockGetAllProducts = async (): Promise<IProduct[]> => {
  // Simula una llamada real a API
  await new Promise((r) => setTimeout(r, 250));
  return mockProducts;
};
