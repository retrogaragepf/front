import { AuthResponse, LoginData, RegisterData } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "auth_token";

// ✅ Endpoints (ajustables en 1 solo lugar)
const ENDPOINTS = {
  register: "/users", // si el back luego dice /users/register, cambia acá
  login: "/auth/login", // ajusta si el back usa /users/login o /auth/signin, etc.
};

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  const data = isJson && text ? JSON.parse(text) : text;

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || `Error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function assertApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("Falta NEXT_PUBLIC_API_BASE_URL en .env.local");
  }
  return API_BASE_URL;
}

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const base = assertApiBaseUrl();

    const response = await fetch(`${base}${ENDPOINTS.register}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return parseJsonSafe(response) as Promise<AuthResponse>;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const base = assertApiBaseUrl();

    const response = await fetch(`${base}${ENDPOINTS.login}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return parseJsonSafe(response) as Promise<AuthResponse>;
  },

  saveToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};
