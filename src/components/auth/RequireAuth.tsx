"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { dataUser, isLoadingUser } = useAuth();

  const isLogged = !!(dataUser as any)?.token;

  useEffect(() => {
    if (isLoadingUser) return; // ✅ espera a que cargue auth
    if (!isLogged) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isLoadingUser, isLogged, router, pathname]);

  if (isLoadingUser) return null;
  if (!isLogged) return null;

  return <>{children}</>;
}
