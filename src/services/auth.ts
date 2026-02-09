import axios from "axios";
import { AuthResponse, LoginData, RegisterData } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "auth_token";

if (!API_BASE_URL) {
  // Esto ayuda a detectar .env.local mal configurado
  // (en prod no rompe build si lo quitas)
  console.warn("Falta NEXT_PUBLIC_API_BASE_URL en .env.local");
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL?.replace(/\/$/, ""),
  headers: { "Content-Type": "application/json" },
});

// Si hay token guardado, lo inyecta automáticamente
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function normalizeAxiosError(error: any, fallback: string) {
  const data = error?.response?.data;

  // Muchos backends devuelven { message: string | string[] }
  const message =
    data?.message ??
    data?.error ??
    (typeof data === "string" ? data : null) ??
    fallback;

  return {
    success: false,
    error: Array.isArray(message) ? message.join(", ") : String(message),
    raw: data,
    status: error?.response?.status,
  };
}

export const authService = {
  // ✅ REGISTRO: ahora usa /auth/signup
  register: async (data: RegisterData): Promise<AuthResponse | any> => {
    try {
      const response = await axiosInstance.post("/auth/signup", data);
      return response.data;
    } catch (error: any) {
      return normalizeAxiosError(error, "Error en registro");
    }
  },

  // ✅ LOGIN: /auth/signin (como te dijo el backend)
  login: async (data: LoginData): Promise<AuthResponse | any> => {
    try {
      const response = await axiosInstance.post("/auth/signin", data);

      // ✅ si viene token, guárdalo
      const token = response.data?.token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
      }

      return response.data;
    } catch (error: any) {
      return normalizeAxiosError(error, "Error en login");
    }
  },

  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  logout: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
};
