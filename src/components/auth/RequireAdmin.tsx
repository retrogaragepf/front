"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { getIsAdminFromToken } from "@/src/utils/jwt";

export default function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { dataUser, isLoadingUser } = useAuth();

  const token = (dataUser as any)?.token ?? null;
  const isLogged = !!token;

  const isAdmin = getIsAdminFromToken(token);

  useEffect(() => {
    if (isLoadingUser) return;

    if (!isLogged) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isAdmin) {
      router.replace("/"); // o "/dashboard"
    }
  }, [isLoadingUser, isLogged, isAdmin, router, pathname]);

  if (isLoadingUser) return null;
  if (!isLogged || !isAdmin) return null;

  return <>{children}</>;
}
