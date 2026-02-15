"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

import Sidebar from "@/src/components/dashboard/Sidebar";
import SellerReviews from "@/src/components/dashboard/SellerReviews";
import { useAuth } from "@/src/context/AuthContext";

export default function ReviewsPage() {
  const router = useRouter();
  const { dataUser, isLoadingUser } = useAuth();

  const isLogged =
    Boolean((dataUser as any)?.user?.email) ||
    Boolean((dataUser as any)?.email) ||
    Boolean((dataUser as any)?.user) ||
    Boolean(dataUser);

  useEffect(() => {
    if (!isLoadingUser && !isLogged) {
      showToast.warning("Debes registrarte para acceder a tus reseñas", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        sound: true,
      });

      router.replace("/register");
    }
  }, [isLoadingUser, isLogged, router]);

  if (isLoadingUser) return null;
  if (!isLogged) return null;

  return (
    <div className="flex min-h-screen bg-amber-200">
      <Sidebar />

      <main className="flex-1 p-10 space-y-6">
        <section className="bg-amber-50 border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-amber-900">
                Reseñas como vendedor
              </h1>
              <p className="mt-1 text-sm text-zinc-700">
                Aquí ves la reputación de tu tienda y comentarios de
                compradores.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2 rounded-xl border-2 border-amber-900 bg-white text-amber-900 font-extrabold tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:translate-x-1px hover:translate-y-1px active:translate-x-2px active:translate-y-2pxtransition"
            >
              Volver al Dashboard
            </button>
          </div>
        </section>

        {/* ✅ Solo reseñas */}
        <SellerReviews />
      </main>
    </div>
  );
}
