"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
};

interface AuthContextProps {
  dataUser: UserSession | null;
  isAuth: boolean;
  isLoadingUser: boolean;

  // ✅ ahora soporta: login({token}) o login({user, token})
  login: (payload: Partial<UserSession> & { token: string }) => void;
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

  // ✅ Cargar sesión
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as UserSession;
      if (parsed?.user && parsed?.token) setDataUser(parsed);
    } catch (e) {
      console.error("Error leyendo auth de localStorage:", e);
      setDataUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  // ✅ Persistir sesión
  useEffect(() => {
    try {
      if (dataUser) localStorage.setItem(AUTH_KEY, JSON.stringify(dataUser));
      else localStorage.removeItem(AUTH_KEY);
    } catch (e) {
      console.error("Error guardando auth en localStorage:", e);
    }
  }, [dataUser]);

  // ✅ Login NORMALIZADO: siempre deja user completo (id, name, email, isAdmin, iat, exp)
  const login = (payload: Partial<UserSession> & { token: string }) => {
    const token = payload.token;
    const decoded = decodeJwtPayload(token) || {};

    const normalizedUser: User = {
      // soporta múltiples claves por si cambian
      id:
        decoded.id ?? decoded.userId ?? decoded.sub ?? payload.user?.id ?? null,
      name: decoded.name ?? decoded.fullName ?? payload.user?.name ?? "",
      email: decoded.email ?? decoded.mail ?? payload.user?.email ?? "",
      isAdmin: Boolean(decoded.isAdmin ?? payload.user?.isAdmin),
      iat: decoded.iat,
      exp: decoded.exp,
      ...payload.user, // si en algún momento agregas /users/me, lo mezcla
    };

    setDataUser({ user: normalizedUser, token });
  };

  const logout = () => {
    setDataUser(null);
    localStorage.removeItem(AUTH_KEY);
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
