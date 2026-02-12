"use client";

import { ReactNode, useState } from "react";

type Props = {
  children: ReactNode;
  section: "users" | "products";
  setSection: (s: "users" | "products") => void;
};

export default function AdminLayout({ children, section, setSection }: Props) {
  return (
    <div className="min-h-screen flex bg-[#f5f2ea]">
      <aside className="w-64 bg-white border-r-4 border-black p-6">
        <h2 className="text-2xl font-extrabold mb-6">Admin</h2>

        <button
          onClick={() => setSection("users")}
          className={`block w-full text-left mb-4 font-bold ${
            section === "users" ? "text-red-600" : ""
          }`}
        >
          Users
        </button>

        <button
          onClick={() => setSection("products")}
          className={`block w-full text-left font-bold ${
            section === "products" ? "text-red-600" : ""
          }`}
        >
          Product Requests
        </button>
      </aside>

      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
