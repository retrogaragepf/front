"use client";

import React from "react";
import { AuthProvider } from "@/src/context/AuthContext";
import { CartProvider } from "@/src/context/CartContext";
import { SessionProvider } from "next-auth/react";
import { ChatProvider } from "@/src/context/ChatContext";
import { NotificationProvider } from "@/src/context/NotificationContext";
import ChatModal from "@/src/components/chat/chat-modal/ChatModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <ChatProvider>
              {children}
              <ChatModal />
            </ChatProvider>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
