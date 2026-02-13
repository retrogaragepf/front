"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/src/context/AuthContext";
import { CartProvider } from "@/src/context/CartContext";
import { ProductProvider } from "@/src/context/ProductContext";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
