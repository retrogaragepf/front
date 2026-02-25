"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type User = {
  id?: string | number | null;
  name?: string;
  email?: string;
  fullName?: string;
  username?: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;

  // ✅ NUEVO (no rompe nada)
  avatarPublicId?: string | null;
  avatarUrl?: string | null;

  [key: string]: unknown;
};

export type UserSession = {
  user: User;
  token: string | null;
  email: string;
};

interface AuthContextProps {
  dataUser: UserSession | null;
  isAuth: boolean;
  isLoadingUser: boolean;
  login: (payload: UserSession) => void;
  logout: () => void;
}

const AUTH_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getOptionalId(value: unknown): string | number | null {
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}

// ✅ opcional pero muy útil: validar expiración del token
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp ?? 0);
  if (!exp) return false; // si no trae exp, no lo invalidamos aquí
  const nowSec = Math.floor(Date.now() / 1000);
  return exp <= nowSec;
}

export const AuthContext = createContext<AuthContextProps>({
  dataUser: null,
  isAuth: false,
  isLoadingUser: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const [dataUser, setDataUser] = useState<UserSession | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const router = useRouter();

  // ✅ evita borrar localStorage en el primer render antes de hidratar
  const didHydrateRef = useRef(false);

  // ✅ NUEVO: evita fetch duplicado de /users/profile en dev/strict mode
  const didSyncProfileRef = useRef(false);

  const persistSession = (session: UserSession | null) => {
    try {
      if (typeof window === "undefined") return;

      if (session?.token) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    } catch (e) {
      console.error("Error guardando auth:", e);
    }
  };

  // ✅ Cargar sesión (una sola vez)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const raw = localStorage.getItem(AUTH_KEY);

      if (!raw) {
        setDataUser(null);
        return;
      }

      let parsed: unknown = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw; // compatibilidad JWT plano
      }

      // Forma esperada: { user, token, email }
      if (isRecord(parsed) && typeof parsed.token === "string") {
        if (isTokenExpired(parsed.token)) {
          localStorage.removeItem(AUTH_KEY);
          setDataUser(null);
          return;
        }

        const normalized: UserSession = {
          user: isRecord(parsed.user) ? (parsed.user as User) : {},
          token: parsed.token,
          email:
            (typeof parsed.email === "string" ? parsed.email : "") ||
            (isRecord(parsed.user) && typeof parsed.user.email === "string"
              ? parsed.user.email
              : ""),
        };

        setDataUser(normalized);
        return;
      }

      // Compatibilidad: JWT plano guardado por versiones anteriores
      if (typeof parsed === "string" && parsed.includes(".")) {
        if (isTokenExpired(parsed)) {
          localStorage.removeItem(AUTH_KEY);
          setDataUser(null);
          return;
        }

        const payload = decodeJwtPayload(parsed);
        const normalized: UserSession = {
          user: {
            id: getOptionalId(payload?.id),
            name: getStringValue(payload?.name),
            email: getStringValue(payload?.email),
            isAdmin: Boolean(payload?.isAdmin),
            iat: typeof payload?.iat === "number" ? payload.iat : undefined,
            exp: typeof payload?.exp === "number" ? payload.exp : undefined,
          },
          token: parsed,
          email: getStringValue(payload?.email),
        };

        setDataUser(normalized);
        return;
      }

      // Si llega algo raro/corrupto, limpia
      localStorage.removeItem(AUTH_KEY);
      setDataUser(null);
    } catch (e) {
      console.error("Error leyendo auth:", e);
      setDataUser(null);
    } finally {
      didHydrateRef.current = true; // ✅ ya terminó hidratación
      setIsLoadingUser(false);
    }
  }, []);

  // ✅ NUEVO: sincroniza perfil real desde backend (incluye avatar)
  useEffect(() => {
    if (!didHydrateRef.current || isLoadingUser) return;
    if (!dataUser?.token) return;
    if (didSyncProfileRef.current) return;

    didSyncProfileRef.current = true;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${dataUser.token}`,
          },
          cache: "no-store",
        });

        const text = await res.text();
        const isJson = res.headers
          .get("content-type")
          ?.includes("application/json");

        let profile: any = text;
        try {
          profile = isJson && text ? JSON.parse(text) : text;
        } catch {
          profile = text;
        }

        if (!res.ok || !profile || typeof profile !== "object") return;

        // ✅ Mezcla perfil en user sin romper shape actual
        setDataUser((prev) => {
          if (!prev) return prev;

          const mergedUser: User = {
            ...(prev.user ?? {}),
            ...(profile as Record<string, unknown>),
          };

          return {
            ...prev,
            user: mergedUser,
            email:
              prev.email ||
              (typeof mergedUser.email === "string" ? mergedUser.email : ""),
          };
        });
      } catch (e) {
        // No rompemos sesión si falla profile
        console.error("No se pudo sincronizar /users/profile:", e);
      }
    })();
  }, [dataUser?.token, isLoadingUser]);

  // ✅ Persistir sesión SOLO después de hidratar
  useEffect(() => {
    if (!didHydrateRef.current || isLoadingUser) return;
    persistSession(dataUser);
  }, [dataUser, isLoadingUser]);

  const login = (payload: UserSession) => {
    // normaliza un poco por seguridad
    const normalized: UserSession = {
      user: payload?.user ?? {},
      token: payload?.token ?? null,
      email: payload?.email ?? payload?.user?.email ?? "",
    };

    // ✅ permite re-sync profile en nuevo login
    didSyncProfileRef.current = false;

    persistSession(normalized); // guardado inmediato (evita carrera con router.push)
    setDataUser(normalized);
  };

  const logout = () => {
    didSyncProfileRef.current = false; // ✅ reset
    setDataUser(null);
    persistSession(null);
    router.push("/login");
  };

  const isAuth = useMemo(() => Boolean(dataUser?.token), [dataUser]);

  return (
    <AuthContext.Provider
      value={{ dataUser, isAuth, isLoadingUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => useContext(AuthContext);
