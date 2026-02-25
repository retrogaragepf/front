"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/src/context/AuthContext";

export type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
};

const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dataUser, isAuth } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 🔔 Traer notificaciones del usuario
  const refreshNotifications = useCallback(async () => {
    if (!isAuth || !dataUser?.token) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/me?includeDailySummary=false`,
        {
          headers: {
            Authorization: `Bearer ${dataUser.token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error cargando notificaciones");

      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("❌ Error notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuth, dataUser?.token]);

  // 🔔 Marcar como leída
  const markAsRead = async (id: string) => {
    if (!dataUser?.token) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${dataUser.token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error("❌ Error markAsRead:", err);
    }
  };

  // 🔁 Cargar al loguearse
  useEffect(() => {
    if (isAuth) {
      refreshNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuth, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications debe usarse dentro de NotificationProvider"
    );
  }
  return ctx;
}