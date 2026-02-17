import axios from 'axios';
import { AuthResponse, LoginData, RegisterData } from "../types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com"
).replace(/\/$/, "");
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post('/users', data);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, error: 'Error en registro' };
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post('/auth/signin', data);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, error: 'Error en login' };
    }
  },

  googleLogin: async (data: { idToken: string }): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post('/auth/google', data);
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

 
  /**
   *  saveToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
   */
   
};

 
