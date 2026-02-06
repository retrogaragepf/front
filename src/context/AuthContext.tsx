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

  login: (payload: UserSession) => void;
  logout: () => void;
}

const AUTH_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

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
      if (parsed?.user) setDataUser(parsed);
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

  const login = (payload: UserSession) => {
    setDataUser(payload);
  };

  const logout = () => {
    setDataUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  const isAuth = useMemo(() => Boolean(dataUser?.user?.email), [dataUser]);

  return (
    <AuthContext.Provider
      value={{ dataUser, isAuth, isLoadingUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
