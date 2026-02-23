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
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
  [key: string]: any;
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

function decodeJwtPayload(token: string): Record<string, any> | null {
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [dataUser, setDataUser] = useState<UserSession | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const router = useRouter();

  // ✅ evita borrar localStorage en el primer render antes de hidratar
  const didHydrateRef = useRef(false);

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

      let parsed: any = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw; // compatibilidad JWT plano
      }

      // Forma esperada: { user, token, email }
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed?.token === "string"
      ) {
        if (isTokenExpired(parsed.token)) {
          localStorage.removeItem(AUTH_KEY);
          setDataUser(null);
          return;
        }

        const normalized: UserSession = {
          user: parsed.user ?? {},
          token: parsed.token,
          email: parsed.email ?? parsed.user?.email ?? "",
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
            id: payload?.id ?? null,
            name: payload?.name ?? "",
            email: payload?.email ?? "",
            isAdmin: Boolean(payload?.isAdmin),
            iat: payload?.iat,
            exp: payload?.exp,
          },
          token: parsed,
          email: payload?.email ?? "",
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

  // ✅ Persistir sesión SOLO después de hidratar
  useEffect(() => {
    if (!didHydrateRef.current) return;
    persistSession(dataUser);
  }, [dataUser]);

  const login = (payload: UserSession) => {
    // normaliza un poco por seguridad
    const normalized: UserSession = {
      user: payload?.user ?? {},
      token: payload?.token ?? null,
      email: payload?.email ?? payload?.user?.email ?? "",
    };

    persistSession(normalized); // guardado inmediato (evita carrera con router.push)
    setDataUser(normalized);
  };

  const logout = () => {
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

export const useAuth = () => useContext(AuthContext);
