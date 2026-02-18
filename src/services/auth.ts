import axios from "axios";
import { AuthResponse, LoginData, RegisterData } from "../types";

const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL no está definido");
  return url;
}
// YA NO USAMOS AXXIOSINSTANCE GLOBAL  CN BASE FIJA
async function apiPost(path: string, data: unknown) {
  const baseURL = getApiBaseUrl();
  return axios.post(`${baseURL}${path}`, data, {
    headers: { "Content-Type": "application/json" },
  });
}

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await apiPost("/users", data);
      return response.data;
    } catch (error: any) {
      return (
        error.response?.data || { success: false, error: "Error en registro" }
      );
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await apiPost("/auth/signin", data);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, error: "Error en login" };
    }
  },

  googleLogin: async (data: { idToken: string }): Promise<AuthResponse> => {
    try {
      const response = await apiPost("/auth/google", data);
      return response.data;
    } catch (error: any) {
      return (
        error.response?.data || {
          success: false,
          error: "Error en login con Google",
        }
      );
    }
  },

  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return parsed?.token ?? null;
    } catch {
      return raw;
    }
  },
};
