"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";

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
  const pathname = usePathname();

  // ✅ Cargar sesión
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) {
        setIsLoadingUser(false);
        return;
      }

      const parsed = JSON.parse(raw) as UserSession;
      if (parsed?.user) {
        setDataUser(parsed);
        console.log('✅ Sesión cargada:', parsed.user);
      }
    } catch (e) {
      console.error("Error leyendo auth:", e);
      setDataUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  // ✅ Persistir sesión
  useEffect(() => {
    try {
      if (dataUser) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(dataUser));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    } catch (e) {
      console.error("Error guardando auth:", e);
    }
  }, [dataUser]);

  const login = (payload: UserSession) => {
    console.log('Login - Guardando:', payload.user);
    setDataUser(payload);
  };

  const logout = () => {
    setDataUser(null);
    localStorage.removeItem(AUTH_KEY);
    router.push('/login');
  };

  // ✅ ahora valida sesión por token o email
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