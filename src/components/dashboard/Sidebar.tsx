"use client";

import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-64 min-h-screen bg-white border-r-4 border-slate-900 flex flex-col">
      <div className="p-6 border-b-2 border-dashed">
        <h1 className="font-display text-2xl">Mi Cuenta</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 font-sans">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full px-4 py-3 rounded-lg border-2 bg-amber-400 border-slate-900 font-bold text-left"
        >
          Panel Principal
        </button>

        <button
          onClick={() => router.push("/createProduct")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          Vender
        </button>

        <button
          onClick={() => router.push("/dashboard#mis-ventas")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          Mis Ventas
        </button>

        <button
          onClick={() => router.push("/dashboard#mis-compras")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          Mis Compras
        </button>

        <button
          onClick={() => router.push("/dashboard/reviews")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          Reseñas como vendedor
        </button>
      </nav>

      <div className="p-4 border-t-2 border-dashed space-y-3">
      </div>
    </aside>
  );
}
