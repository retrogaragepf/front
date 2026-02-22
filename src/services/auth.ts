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

function normalizeAuthResponse(payload: any): AuthResponse {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Respuesta inválida del servidor" };
  }

  const token = payload.token ?? payload.access_token ?? null;
  return {
    ...payload,
    token: typeof token === "string" ? token : undefined,
    success:
      typeof payload.success === "boolean"
        ? payload.success
        : Boolean(token || payload.user),
  };
}

function extractApiErrorMessage(error: any): string {
  const status = Number(error?.response?.status ?? 0);
  if (status === 404) {
    return "Registro no disponible en este momento.";
  }

  const data = error?.response?.data;
  const message = data?.message ?? data?.error ?? error?.message;

  if (Array.isArray(message)) {
    const normalized = message
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    if (normalized.length > 0) return normalized.join(". ");
  }

  if (typeof message === "string" && message.trim()) return message;

  if (status === 400) return "Datos inválidos para registro.";
  if (status === 409) return "El usuario ya existe.";
  if (status === 422) return "Datos incompletos o inválidos para registro.";
  if (status >= 500) return "Error interno del servidor al registrar usuario.";
  if (status > 0) return `Error de registro (HTTP ${status}).`;

  return "Error en registro";
}

function includesConfirmPasswordFieldError(message: unknown): boolean {
  if (Array.isArray(message)) {
    return message.some(
      (item) =>
        typeof item === "string" &&
        item.toLowerCase().includes("confirmpassword") &&
        item.toLowerCase().includes("should not exist"),
    );
  }

  return (
    typeof message === "string" &&
    message.toLowerCase().includes("confirmpassword") &&
    message.toLowerCase().includes("should not exist")
  );
}

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const payload = data as RegisterData & { confirmPassword?: string };

    try {
      const response = await apiPost("/auth/signup", payload);
      return normalizeAuthResponse(response.data);
    } catch (error: any) {
      // Compatibilidad: algunos backends rechazan campos extra (whitelist).
      if (
        payload.confirmPassword &&
        includesConfirmPasswordFieldError(error?.response?.data?.message)
      ) {
        const { confirmPassword, ...fallbackPayload } = payload;
        try {
          const fallbackResponse = await apiPost("/auth/signup", fallbackPayload);
          return normalizeAuthResponse(fallbackResponse.data);
        } catch (fallbackError: any) {
          return {
            success: false,
            error: extractApiErrorMessage(fallbackError),
          };
        }
      }

      return {
        success: false,
        error: extractApiErrorMessage(error),
      };
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await apiPost("/auth/signin", data);
      return normalizeAuthResponse(response.data);
    } catch (error: any) {
      return error.response?.data || { success: false, error: "Error en login" };
    }
  },

  googleLogin: async (data: { idToken: string }): Promise<AuthResponse> => {
    try {
      const response = await apiPost("/auth/google", data);
      return normalizeAuthResponse(response.data);
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
