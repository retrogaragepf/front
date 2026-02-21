"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  section: "users" | "products" | "chats";
  setSection: (s: "users" | "products" | "chats") => void;
};

export default function AdminLayout({ children, section, setSection }: Props) {
  return (
    <div className="min-h-screen flex bg-amber-100]">
      {/* Sidebar */}
      <aside className="w-72 bg-amber-100 -r-2 border-amber-900 p-8 flex flex-col shadow-[6px_0px_0px_0px_rgba(0,0,0,0.85)]">
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
            Usuarios Registrados
          </button>

          <button
            onClick={() => setSection("products")}
            className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
              section === "products"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
          >
            Validacion Productos
          </button>

          <button
            onClick={() => setSection("chats")}
            className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
              section === "chats"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
          >
            Gestión de Chats
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
