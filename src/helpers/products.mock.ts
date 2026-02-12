// src/helpers/products.mock.ts
import { IProductWithDetails } from "@/src/interfaces/product.interface";

/** ✅ RAW: formato simple que me pasaste */
const rawProducts = [
  {
    id: 1,
    titulo: "Walkman Sony TPS-L2",
    precio: 2499,
    descripcion:
      "Reproductor portátil de cassette icónico de finales de los 70s.",
    categoria: "Audio Retro",
    stock: 10,
    imagen:
      "https://imgs.search.brave.com/EKo-HbbDTJs8qE8gfJRo-SHdtWLn8n2ipxksteHfPMk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzEwLzEy/Lzc0LzEwMTI3NDE2/MTlkYTY0OTEyYTA2/NmFjN2I3N2M3YzA3/LmpwZw",
  },
  {
    id: 2,
    titulo: "Game Boy Classic 1989",
    precio: 3299,
    descripcion: "Consola portátil original de Nintendo.",
    categoria: "Videojuegos Retro",
    stock: 10,
    imagen:
      "https://imgs.search.brave.com/jQAEC_C9HUZ0vyWhvN0mstKPh9-i7H9eqErght4oPZs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmV0/c3lzdGF0aWMuY29t/LzE5Mjk2NzAyL3Iv/aWwvZjViZWVmLzQw/Mjk5OTk4MDcvaWxf/NjAweDYwMC40MDI5/OTk5ODA3X3FybDEu/anBn",
  },
  {
    id: 3,
    titulo: "Polaroid OneStep SX-70",
    precio: 4599,
    descripcion: "Cámara instantánea clásica.",
    categoria: "Fotografía Retro",
    stock: 10,
    imagen:
      "https://imgs.search.brave.com/1dmNBVls9r2RY0QJwadZthpcX1XDZjDi4CD61lOmkzQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmV0/c3lzdGF0aWMuY29t/LzY0ODQ1MTEvYy8x/ODIzLzE0NDkvMTI0/LzgxOC9pbC8yZjYx/YWQvNTIxNzE3NzIw/My9pbF8zNDB4Mjcw/LjUyMTcxNzcyMDNf/czQ3ei5qcGc",
  },
  {
    id: 4,
    titulo: "Teléfono Rotatorio Vintage",
    precio: 1899,
    descripcion: "Teléfono clásico de disco.",
    categoria: "Hogar Retro",
    stock: 10,
    imagen:
      "https://imgs.search.brave.com/ky2M8euy8gWMzxXYhw4OlA1OwIEXnd7zY_ORqr1UdaE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmVi/YXlpbWcuY29tL2lt/YWdlcy9nLzJxNEFB/T1N3ZnBWblhlb2Ev/cy1sNDAwLndlYnA",
  },
  {
    id: 5,
    titulo: "Consola Atari 2600",
    precio: 3999,
    descripcion: "La consola que inició la era gamer.",
    categoria: "Videojuegos Retro",
    stock: 10,
    imagen:
      "https://www.shutterstock.com/image-photo/pavia-lombardy-italy-november-23-600nw-2580471643.jpg",
  },
  {
    id: 6,
    titulo: "Radio AM/FM Retro",
    precio: 1499,
    descripcion: "Radio analógica ochentera.",
    categoria: "Audio Retro",
    stock: 10,
    imagen:
      "https://img.freepik.com/foto-gratis/musica-electrica-fondo-antiguo-retro_1172-313.jpg?semt=ais_hybrid&w=740&q=80",
  },
  {
    id: 7,
    titulo: "Cassette Mix 80s Hits",
    precio: 399,
    descripcion: "Cassette clásico de los 80s.",
    categoria: "Música Retro",
    stock: 10,
    imagen:
      "https://imgs.search.brave.com/cHKWb_0p5ZmEag-krPjmkKtaqv_wQhveBOGYpc_iSn8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvODQz/ODg0NTg4L3Bob3Rv/Lzgwcy1taXhlZC10/YXBlLmpwZz9zPTYx/Mng2MTImdz0wJms9/MjAmYz1UVGVxT3d2/VXBLRGRvMlNrMUdy/VnFMLVFyUC1EN2V0/NE9EUV9vUGFYYlBz/PQ",
  },
  {
    id: 8,
    titulo: "Arcade Mini Desktop",
    precio: 2799,
    descripcion: "Arcade clásico de sobremesa.",
    categoria: "Arcade Retro",
    stock: 10,
    imagen:
      "https://imgs.search.brave.com/9czNqX2vEb2aN0ki9ivfYcwso65hmdztbHNi6nUIdfo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmVi/YXlpbWcuY29tL2lt/YWdlcy9nL1g0TUFB/ZVN3aEZob1JWR0Ev/cy1sNDAwLndlYnA",
  },
  {
    id: 9,
    titulo: "Reproductor VHS Panasonic",
    precio: 3499,
    descripcion: "Reproductor VHS clásico.",
    categoria: "Video Retro",
    stock: 10,
    imagen:
      "https://imgs.search.brave.com/gcPPBS6ZXe_qOhmSDzzyNN9zhbRQ01gOoi9zh6aXG0M/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmVi/YXlpbWcuY29tL2lt/YWdlcy9nL0xYVUFB/ZVN3cXc1cEhSa00v/cy1sOTYwLndlYnA",
  },
  {
    id: 10,
    titulo: "Lámpara Lava Psicodélica",
    precio: 999,
    descripcion: "Lámpara lava estilo 70s.",
    categoria: "Decoración Retro",
    stock: 10,
    imagen:
      "https://imgs.search.brave.com/ESoRzELm2L-Mn8fhhRzHlSXij5PIAwuTDKTf5HmTCVw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmVi/YXlpbWcuY29tL3Ro/dW1icy9pbWFnZXMv/Zy94dkFBQWVTd0Ns/dG9xNThyL3MtbDQw/MC53ZWJw",
  },
] as const;

/** ✅ Tipos del mock anidado */
export type MockUserWithProducts = {
  id: string;
  fullName: string;
  email: string;
  products: IProductWithDetails[];
};

/** ✅ IDs mock por categoría (estables) */
const CATEGORY_ID_MAP: Record<string, string> = {
  "Audio Retro": "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "Videojuegos Retro": "11111111-1111-1111-1111-111111111111",
  "Fotografía Retro": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "Hogar Retro": "99999999-9999-9999-9999-999999999999",
  "Música Retro": "22222222-2222-2222-2222-222222222222",
  "Arcade Retro": "33333333-3333-3333-3333-333333333333",
  "Video Retro": "44444444-4444-4444-4444-444444444444",
  "Decoración Retro": "55555555-5555-5555-5555-555555555555",
};

function inferEra(input: {
  titulo: string;
  descripcion: string;
  categoria: string;
}) {
  const text =
    `${input.titulo} ${input.descripcion} ${input.categoria}`.toLowerCase();

  if (text.includes("70") || text.includes("setenta")) {
    return {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "70s",
      description: "Artículos de los años 70.",
      yearRange: "1970-1979",
      createdAt: "2026-02-05",
    };
  }

  if (text.includes("80") || text.includes("ochent")) {
    return {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "80s",
      description: "Artículos de los años 80.",
      yearRange: "1980-1989",
      createdAt: "2026-02-05",
    };
  }

  if (
    text.includes("90") ||
    text.includes("noventa") ||
    text.includes("1989")
  ) {
    return {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      name: "90s",
      description: "Artículos de los años 90.",
      yearRange: "1990-1999",
      createdAt: "2026-02-05",
    };
  }

  return {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    name: "90s",
    description: "Artículos retro.",
    yearRange: "1990-1999",
    createdAt: "2026-02-05",
  };
}

/** ✅ Helper: transforma raw → IProductWithDetails para un seller */
function toProductWithDetails(
  raw: (typeof rawProducts)[number],
  seller: { id: string; fullName: string; email: string },
): IProductWithDetails {
  const categoryId =
    CATEGORY_ID_MAP[raw.categoria] ?? "ffffffff-ffff-ffff-ffff-ffffffffffff";

  const era = inferEra(raw);

  return {
    id: String(raw.id),
    title: raw.titulo,
    description: raw.descripcion,
    price: String(raw.precio), // 👈 tu UI vieja lo maneja como string
    stock: raw.stock,

    sellerId: seller.id,
    categoryId,
    eraId: era.id,
    createdAt: "2026-02-05",

    seller,

    category: {
      id: categoryId,
      name: raw.categoria,
      description: "Categoría retro",
      createdAt: "2026-02-05",
    },

    era,

    images: [raw.imagen],

    // si tu UI usa ratings, quedan mock
    averageRating: 4.5,
    totalReviews: 10,
  };
}

/** ✅ 1) MOCK ANIDADO: usuarios con products[] */
export const mockUsersWithProducts: MockUserWithProducts[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    fullName: "Retro Seller",
    email: "seller@retrogarage.com",
    products: rawProducts.map((p) =>
      toProductWithDetails(p, {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        fullName: "Retro Seller",
        email: "seller@retrogarage.com",
      }),
    ),
  },
  // ✅ si quieres simular más vendedores, descomenta y ajusta:
  // {
  //   id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  //   fullName: "Nico Seller",
  //   email: "nico@retrogarage.com",
  //   products: rawProducts.slice(0, 3).map((p) =>
  //     toProductWithDetails(p, {
  //       id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  //       fullName: "Nico Seller",
  //       email: "nico@retrogarage.com",
  //     })
  //   ),
  // },
];

/** ✅ 2) COMPAT: lista flat derivada (por si tu UI actual la usa) */
export const mockProducts: IProductWithDetails[] =
  mockUsersWithProducts.flatMap((u) => u.products);

/** ✅ Getters */
export const mockGetUsersWithProducts = async (): Promise<
  MockUserWithProducts[]
> => {
  await new Promise((r) => setTimeout(r, 250));
  return mockUsersWithProducts;
};

export const mockGetAllProducts = async (): Promise<IProductWithDetails[]> => {
  await new Promise((r) => setTimeout(r, 250));
  return mockProducts;
};

export const mockGetProductsByUserId = async (
  userId: string,
): Promise<IProductWithDetails[]> => {
  await new Promise((r) => setTimeout(r, 250));
  const user = mockUsersWithProducts.find((u) => u.id === userId);
  return user?.products ?? [];
};
