"use client";

import { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import OrderList from "@/src/components/OrderList";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { dataUser, isLoadingUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingUser && !dataUser) {
      router.push("/");
    }
  }, [dataUser, isLoadingUser, router]);

  if (isLoadingUser) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-white">
        <p className="text-black">Cargando tu sesión...</p>
      </div>
    );
  }

  if (!dataUser) {
    return null;
  }

  const { user } = dataUser;

  return (
    <div className="w-full min-h-screen flex justify-center items-start bg-white px-4 py-10">
      <div className="w-full max-w-3xl bg-white p-6 sm:p-8 rounded-xl shadow-lg flex flex-col gap-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-black">Mi Perfil</h1>
            <p className="text-gray-600 text-sm">{user.email}</p>
          </div>
        </div>

        <hr className="border-gray-300" />

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Nombre
          </p>
          <p className="text-black text-sm sm:text-base font-medium">
            {user.name}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Dirección
          </p>
          <p className="text-black text-sm sm:text-base font-medium">
            {user.address ?? "No registrada"}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Teléfono
          </p>
          <p className="text-black text-sm sm:text-base font-medium">
            {user.phone ?? "No registrado"}
          </p>
        </div>

        <hr className="border-gray-300" />

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-black">
            Historial de Compras
          </h2>
          <OrderList />
        </div>
      </div>
    </div>
  );
}
