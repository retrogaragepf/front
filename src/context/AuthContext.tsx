"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IUserSession } from "@/src/interfaces/usersession.interface";

interface AuthContextProps {
  dataUser: IUserSession | null;
  setDataUser: (dataUser: IUserSession | null) => void;
  logout: () => void;
  isLoadingUser: boolean;
}

const AUTH_KEY = "userSession";

export const AuthContext = createContext<AuthContextProps>({
  dataUser: null,
  setDataUser: () => {},
  logout: () => {},
  isLoadingUser: true,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [dataUser, setDataUser] = useState<IUserSession | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    try {
      const userdata = localStorage.getItem(AUTH_KEY);
      if (userdata) {
        const parsed = JSON.parse(userdata) as IUserSession;
        setDataUser(parsed);
      }
    } catch (error) {
      console.error("Error leyendo userSession de localStorage:", error);
      setDataUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    if (dataUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(dataUser));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [dataUser]);

  const logout = () => {
    setDataUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ dataUser, setDataUser, logout, isLoadingUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
