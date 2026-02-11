"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

import Sidebar from "@/src/components/dashboard/Sidebar";
import StatsGrid from "@/src/components/dashboard/StatsGrid";
import ProfileHeader from "@/src/components/dashboard/ProfileHeader";
// ❌ ya no va en el main
// import SellerReviews from "@/src/components/dashboard/SellerReviews";
import MyProductsPanel from "@/src/components/dashboard/MyProductsPanel";

import { useAuth } from "@/src/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { dataUser, isLoadingUser } = useAuth();

  const isLogged =
    Boolean((dataUser as any)?.user?.email) ||
    Boolean((dataUser as any)?.email) ||
    Boolean((dataUser as any)?.user) ||
    Boolean(dataUser);

  useEffect(() => {
    if (!isLoadingUser && !isLogged) {
      showToast.warning("Debes registrarte para acceder al Dashboard", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });

      router.replace("/register");
    }
  }, [isLoadingUser, isLogged, router]);

  if (isLoadingUser) return null;
  if (!isLogged) return null;

  const email =
    (dataUser as any)?.email ?? (dataUser as any)?.user?.email ?? "";

  return (
    <div className="flex min-h-screen bg-amber-200">
      <Sidebar />

      <main className="flex-1 p-10 space-y-10">
        <ProfileHeader />

        {!isLoadingUser && email ? (
          <section className="bg-amber-50 border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-zinc-800">
              <span className="font-extrabold tracking-wide text-amber-900">
                Email:
              </span>{" "}
              {email}
            </p>
            <div className="mt-4 h-0.5 w-full bg-amber-300" />
            <p className="mt-3 text-sm text-zinc-700">
              Panel de vendedor: métricas, reseñas y reputación.
            </p>
            <div className="mt-4 h-2 bg-emerald-900 rounded-lg" />
          </section>
        ) : null}

        <StatsGrid />

        {/* ✅ En el espacio donde estaban las reseñas, ahora van tus productos */}
        <MyProductsPanel />
      </main>
    </div>
  );
}
