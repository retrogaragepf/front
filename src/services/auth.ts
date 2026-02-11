import axios from "axios";
import { AuthResponse, LoginData, RegisterData } from "../types";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ✅ Función para decodificar JWT (va aquí)
const decodeToken = (token: string | null): any => {
  if (!token) return null; // ✅ Validar entrada
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decodificando token:", e);
    return null;
  }
};

// ✅ Interceptores

axiosInstance.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem(TOKEN_KEY);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const token = parsed?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Error leyendo token:", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("-----TOKEN INVALIDO O EXPIRADO-----");
      localStorage.removeItem(TOKEN_KEY);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ✅ Servicio de autenticación
export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post("/auth/signin", data);

      if (response.data?.token) {
        const decodedToken = decodeToken(response.data.token);
        localStorage.setItem(
          TOKEN_KEY,
          JSON.stringify({
            user: {
              id: decodedToken?.id,
              name: decodedToken?.name,
              email: decodedToken?.email,
              isAdmin: decodedToken?.isAdmin,
            },
            token: response.data.token,
          }),
        );
      }

      return response.data;
    } catch (error: any) {
      return (
        error.response?.data || { success: false, error: "Error en login" }
      );
    }
  },

  //-----REGISTRO DE USUARIOS GOOGLE OAUTH----//

  googleLogin: async (data: { idToken: string }): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post("/auth/google", data);

      if (response.data?.token) {
        const decodedToken = decodeToken(response.data.token);
        localStorage.setItem(
          TOKEN_KEY,
          JSON.stringify({
            user: {
              id: decodedToken?.id,
              name: decodedToken?.name,
              email: decodedToken?.email,
              isAdmin: decodedToken?.isAdmin,
            },
            token: response.data.token,
          }),
        );
      }

      return response.data;
    } catch (error: any) {
      return (
        error.response?.data || {
          success: false,
          error: "Error en Google login",
        }
      );
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post("/auth/signup", data);
      return response.data;
    } catch (error: any) {
      return (
        error.response?.data || { success: false, error: "Error en registro" }
      );
    }
  },

  getToken: (): string | null => {
    try {
      const authData = localStorage.getItem(TOKEN_KEY);
      if (!authData) return null; // ✅ Validar que no sea null
      return JSON.parse(authData)?.token || null;
    } catch (e) {
      return null;
    }
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export default authService;
