import { IProduct } from "@/src/interfaces/product.interface";
import { authService } from "@/src/services/auth";

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "https://back-0o27.onrender.com"
  );
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  return isJson && text ? JSON.parse(text) : text;
}

export const getAllProducts = async (): Promise<IProduct[]> => {
  const API_BASE_URL = getApiBaseUrl(); // SE OBTIENE EN TIEMPO DE EJECUCIÓN CUANDO SE NECESITA.
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data
        : data?.message
          ? Array.isArray(data.message)
            ? data.message.join(", ")
            : String(data.message)
          : "Error obteniendo productos";
    throw new Error(msg);
  }

  return data as IProduct[];
};

/* ============================
   GET BY ID (PUBLIC)
============================ */
export const getProductById = async (id: string): Promise<IProduct> => {
  const API_BASE_URL = getApiBaseUrl();
  const token = authService.getToken?.() || null;

  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data
        : data?.message
          ? Array.isArray(data.message)
            ? data.message.join(", ")
            : String(data.message)
          : "Error obteniendo producto";
    throw new Error(msg);
  }

  return data as IProduct;
};

/* ============================
   CREATE (PROTECTED + dual mode)
   - JSON + imgUrl (nuevo recomendado)
   - multipart + image (compatibilidad)
============================ */
function getTokenOrThrow() {
  const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";
  const token = authService.getToken?.() || localStorage.getItem(TOKEN_KEY);

  if (!token) throw new Error("No hay sesión activa. Inicia sesión.");
  return token;
}

export const createProduct = async (
  data: {
    title: string;
    description?: string;
    price: number;
    stock: number;
    erasId: string;
    categoryId: string;
    imgUrl: string; // ✅ soportado por back actualizado
  },
  file?: File | null,
): Promise<IProduct> => {
  const API_BASE_URL = getApiBaseUrl();
  const token = getTokenOrThrow();

  // ✅ Compatibilidad dual:
  // - Si llega file => multipart (flujo viejo)
  // - Si NO llega file => JSON con imgUrl (flujo recomendado con Cloudinary widget)
  if (file) {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description ?? "");
    formData.append("price", String(data.price));
    formData.append("stock", String(data.stock));
    formData.append("erasId", data.erasId);
    formData.append("categoryId", data.categoryId);

    // ✅ Si llega imgUrl también, el back prioriza imgUrl (compatibilidad)
    formData.append("imgUrl", data.imgUrl);

    // ✅ archivo exacto que espera Swagger
    formData.append("image", file);

    const res = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const created = await parseJsonSafe(res);

    if (!res.ok) {
      const msg =
        typeof created === "string"
          ? created
          : created?.message
            ? Array.isArray(created.message)
              ? created.message.join(", ")
              : String(created.message)
            : "Error creando producto";
      throw new Error(msg);
    }

    return created as IProduct;
  }

  // ✅ Flujo nuevo recomendado (sin duplicado en Cloudinary)
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: data.title,
      description: data.description ?? "",
      price: data.price,
      stock: data.stock,
      categoryId: data.categoryId,
      erasId: data.erasId,
      imgUrl: data.imgUrl,
    }),
  });

  const created = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      typeof created === "string"
        ? created
        : created?.message
          ? Array.isArray(created.message)
            ? created.message.join(", ")
            : String(created.message)
          : "Error creando producto";
    throw new Error(msg);
  }

  return created as IProduct;
};

/* ============================
   ADMIN: APPROVE / REJECT (PROTECTED)
============================ */
export const updateProductStatus = async (
  productId: string,
  status: "approved" | "rejected",
): Promise<IProduct> => {
  const API_BASE_URL = getApiBaseUrl();
  const token = getTokenOrThrow();

  const endpoint =
    status === "approved"
      ? `/products/${productId}/approve`
      : `/products/${productId}/reject`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data
        : data?.message
          ? Array.isArray(data.message)
            ? data.message.join(", ")
            : String(data.message)
          : "Error actualizando estado del producto";
    throw new Error(msg);
  }

  return data as IProduct;
};
