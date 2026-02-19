import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-amber-100 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border-2 border-zinc-900 bg-amber-50 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            Cargando…
          </div>
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
