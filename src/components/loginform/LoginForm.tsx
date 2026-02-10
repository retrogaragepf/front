"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import useFormSubmit from "@/hooks/useFormSubmit";
import { showToast } from "@/utils/toast";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const { handleSubmit, errors } = useFormSubmit({
    onValidate: (values) => {
      const newErrors: any = {};

      if (!values.email) newErrors.email = "El email es obligatorio";
      if (!values.password) newErrors.password = "La contraseña es obligatoria";

      return newErrors;
    },

    onSuccess: async (data) => {
      try {
        const response: any = await authService.login(data);

        if (!response?.token) {
          showToast.error(response?.error || "Credenciales inválidas", {
            duration: 3000,
            position: "top-center",
          });
          return;
        }

        const TOKEN_KEY =
          process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

        const authData = localStorage.getItem(TOKEN_KEY);

        if (!authData) {
          showToast.error("Error al guardar sesión. Intenta de nuevo", {
            duration: 3000,
            position: "top-center",
          });
          return;
        }

        const savedData = JSON.parse(authData);

        login({
          user: {
            id: savedData.user.id,
            name: savedData.user.name,
            email: savedData.user.email,
          },
          token: savedData.token,
        });

        showToast.success("¡Ingreso Exitoso!", {
          duration: 3000,
          position: "top-center",
        });

        router.push("/dashboard");

      } catch (error) {
        console.error("Error en login:", error);

        showToast.error("Error en login", {
          duration: 3000,
          position: "top-center",
        });
      }
    },

    onError: (errors) => {
      console.log("Errores del formulario:", errors);
    },
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-8 rounded-2xl border-4 border-black shadow-xl w-full max-w-md"
    >
      <h2 className="text-2xl font-extrabold text-center">Iniciar Sesión</h2>

      <div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border-2 border-black rounded-xl px-4 py-2"
        />
        {errors?.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full border-2 border-black rounded-xl px-4 py-2"
        />
        {errors?.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-black text-white py-2 rounded-xl font-bold hover:bg-zinc-800 transition"
      >
        Ingresar
      </button>

      <p className="text-sm text-center">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-bold underline">
          Registrate
        </Link>
      </p>
    </form>
  );
}
