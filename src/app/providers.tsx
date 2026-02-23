"use client";

import React from "react";
import { AuthProvider } from "@/src/context/AuthContext";
import { CartProvider } from "@/src/context/CartContext"; // nuevo
import { SessionProvider } from "next-auth/react";
import { ChatProvider } from "@/src/context/ChatContext";
import ChatModal from "@/src/components/chat/chat-modal/ChatModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
            {children}
            <ChatModal />
          </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
