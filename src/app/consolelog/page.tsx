"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";

export default function Page() {
  const { dataUser } = useAuth();

  useEffect(() => {
    console.log("ID logueado:", dataUser?.user?.id);
  }, [dataUser?.user?.id]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Debug Auth</h1>
      <p className="mt-2 text-zinc-700">
        Abre la consola (F12) para ver el ID.
      </p>

      <div className="mt-4 p-4 bg-white border rounded-lg">
        <p className="text-sm text-zinc-600">ID (render):</p>
        <p className="font-mono">{String(dataUser?.user?.id ?? "null")}</p>
      </div>
    </main>
  );
}
