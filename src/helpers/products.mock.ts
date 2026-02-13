// src\helpers\products.mock.ts
import { IProductWithDetails } from "@/src/interfaces/product.interface";

export const mockProducts: IProductWithDetails[] = [
  {
    id: "1",
    title: "Cámara Retro 90s",
    description: "Cámara vintage funcional, ideal para colección.",
    price: "50000",
    stock: 1,
    sellerId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    categoryId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    eraId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    createdAt: "2026-02-05",

    seller: {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      fullName: "Retro Seller",
      email: "seller@retrogarage.com",
    },
    category: {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Cámaras",
      description: "Fotografía retro y vintage.",
      createdAt: "2026-02-05",
    },
    era: {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      name: "90s",
      description: "Artículos de los años 90.",
      yearRange: "1990-1999",
      createdAt: "2026-02-05",
    },
    images: [
      "https://res.cloudinary.com/dyylxjijf/image/upload/v1770321127/Camara_ypblyh.png",
    ],
    averageRating: 4.6,
    totalReviews: 12,
  },

  {
    id: "2",
    title: "Walkman Clásico",
    description: "Reproductor retro en buen estado, estilo nostálgico.",
    price: "50000",
    stock: 1,
    sellerId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    categoryId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    eraId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    createdAt: "2026-02-05",

    seller: {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      fullName: "Retro Seller",
      email: "seller@retrogarage.com",
    },
    category: {
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      name: "Audio",
      description: "Reproductores, casetes y sonido retro.",
      createdAt: "2026-02-05",
    },
    era: {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      name: "90s",
      description: "Artículos de los años 90.",
      yearRange: "1990-1999",
      createdAt: "2026-02-05",
    },
    images: [
      "https://res.cloudinary.com/dyylxjijf/image/upload/v1770321132/Walkman_aneqf3.png",
    ],
    averageRating: 4.2,
    totalReviews: 8,
  },

  {
    id: "3",
    title: "Máquina de Escribir",
    description:
      "Máquina de escribir vintage, ideal para decoración o colección.",
    price: "100000",
    stock: 1,
    sellerId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    categoryId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    eraId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    createdAt: "2026-02-05",

    seller: {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      fullName: "Retro Seller",
      email: "seller@retrogarage.com",
    },
    category: {
      id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      name: "Colección",
      description: "Piezas clásicas para amantes de lo retro.",
      createdAt: "2026-02-05",
    },
    era: {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "70s",
      description: "Artículos de los años 70.",
      yearRange: "1970-1979",
      createdAt: "2026-02-05",
    },
    images: [
      "https://res.cloudinary.com/dyylxjijf/image/upload/v1770321130/Maquina_mbf5rc.png",
    ],
    averageRating: 4.8,
    totalReviews: 21,
  },

  {
    id: "4",
    title: "Lámpara de Noche",
    description: "Lámpara retro de mesa para ambientar tu espacio con estilo.",
    price: "20000",
    stock: 1,
    sellerId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    categoryId: "99999999-9999-9999-9999-999999999999",
    eraId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    createdAt: "2026-02-05",

    seller: {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      fullName: "Retro Seller",
      email: "seller@retrogarage.com",
    },
    category: {
      id: "99999999-9999-9999-9999-999999999999",
      name: "Hogar",
      description: "Decoración y accesorios vintage.",
      createdAt: "2026-02-05",
    },
    era: {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "80s",
      description: "Artículos de los años 80.",
      yearRange: "1980-1989",
      createdAt: "2026-02-05",
    },
    images: [
      "https://res.cloudinary.com/dyylxjijf/image/upload/v1770321128/Lampara_vjyk6o.png",
    ],
    averageRating: 4.1,
    totalReviews: 5,
  },
];

export const mockGetAllProducts = async (): Promise<IProductWithDetails[]> => {
  await new Promise((r) => setTimeout(r, 250));
  return mockProducts;
};
