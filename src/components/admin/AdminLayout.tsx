"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";

type Props = {
  children: ReactNode;
  section: "users" | "products";
  setSection: (s: "users" | "products") => void;
};

const AUTH_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function getIsAdminFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.user?.isAdmin);
  } catch {
    return false;
  }
}

export default function AdminLayout({ children, section, setSection }: Props) {
  const router = useRouter();
  const { dataUser, isLoadingUser } = useAuth();

  // ✅ Protección admin (mínimo cambio)
  useEffect(() => {
    if (isLoadingUser) return;

    const token = (dataUser as any)?.token || null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const isAdmin =
      Boolean((dataUser as any)?.user?.isAdmin) || getIsAdminFromStorage();

    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [dataUser, isLoadingUser, router]);

  // ✅ Evita “flash” mientras valida
  if (isLoadingUser) return null;

  const token = (dataUser as any)?.token || null;
  const isAdmin =
    Boolean((dataUser as any)?.user?.isAdmin) ||
    (typeof window !== "undefined" && getIsAdminFromStorage());

  if (!token || !isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-[#f5f2ea]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r-2 border-amber-900 p-8 flex flex-col shadow-[6px_0px_0px_0px_rgba(0,0,0,0.85)]">
        <h2 className="font-display text-2xl text-amber-900 font-extrabold mb-10">
          Panel de Administración
        </h2>

        <nav className="flex flex-col gap-4">
          <button
            onClick={() => setSection("users")}
            className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
              section === "users"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
          >
            Usuarios
          </button>

          <button
            onClick={() => setSection("products")}
            className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
              section === "products"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
          >
            Solicitudes de Productos
          </button>
        </nav>

        <div className="mt-auto pt-10 text-sm text-zinc-500">
          RetroGarage™ Admin
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
