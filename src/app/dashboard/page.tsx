"use client";

import Sidebar from "@/src/components/dashboard/Sidebar";
import StatsGrid from "@/src/components/dashboard/StatsGrid";
import ProfileHeader from "@/src/components/dashboard/ProfileHeader";
import SellerReviews from "@/src/components/dashboard/SellerReviews";
import { useAuth } from "@/src/context/AuthContext";

export default function DashboardPage() {
  const { dataUser, isLoadingUser } = useAuth();

  const email = dataUser?.email ?? "";

  return (
    <div className="flex min-h-screen bg-amber-200">
      <Sidebar />

      <main className="flex-1 p-10 space-y-10">
        {/* Header usuario (no lo tocamos) */}
        <ProfileHeader />

        {/* ✅ SOLO EMAIL (silencioso) */}
        {!isLoadingUser && email ? (
          <section className="bg-amber-50 border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-zinc-800">
              <span className="font-extrabold tracking-wide text-amber-900">
                Email:
              </span>{" "}
              {email}
            </p>
            <div className="mt-4 h-[2px] w-full bg-amber-300" />
            <p className="mt-3 text-sm text-zinc-700">
              Panel de vendedor: métricas, reseñas y reputación.
            </p>
            <div className="mt-4 h-2 bg-emerald-900 rounded-lg" />
          </section>
        ) : null}

        {/* Stats */}
        <StatsGrid />

        {/* ✅ Reseñas como vendedor */}
        <SellerReviews />
      </main>
    </div>
  );
}
