"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/src/context/AuthContext";

export type NotificationType =
  | "purchase_success"
  | "sale_made"
  | "product_approved"
  | "product_rejected"
  | "product_shipped"
  | "product_delivered";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
};

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (data: {
    type: NotificationType;
    message: string;
    userId?: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { dataUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const currentUserId =
    dataUser?.user?.id?.toString() ?? null;

  const addNotification: NotificationContextProps["addNotification"] = ({
    type,
    message,
    userId,
  }) => {
    const targetUserId = userId ?? currentUserId;
    if (!targetUserId) return;

    setNotifications((prev) => [
      {
        id: crypto.randomUUID(),
        userId: targetUserId,
        type,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true })),
    );
  };

  const userNotifications = useMemo(
    () =>
      currentUserId
        ? notifications.filter(
            (n) => n.userId === currentUserId,
          )
        : [],
    [notifications, currentUserId],
  );

  const unreadCount = useMemo(
    () => userNotifications.filter((n) => !n.read).length,
    [userNotifications],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications: userNotifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () =>
  useContext(NotificationContext);