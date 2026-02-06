"use client";
import useFormField from "@/src/hooks/useFormField";
import { useFormSubmit } from "@/src/hooks/useFormSubmit";
import { authService } from "@/src/services/auth";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/src/context/AuthContext";
import { showToast } from "nextjs-toast-notify";
import Link from "next/link";

const LoginForm = () => {
  const router = useRouter();
  const { login } = useAuth();

  const emailField = useFormField("email");
  const passwordField = useFormField("password");

  const validateAll = () => {
    const isEmailValid = emailField.validate();
    const isPasswordValid = passwordField.validate();
    return isEmailValid && isPasswordValid;
  };

  const getFormData = () => ({
    email: emailField.value,
    password: passwordField.value,
  });

  const { handleSubmit, isSubmitting } = useFormSubmit({
    onValidate: validateAll,
    onGetData: getFormData,
    onSuccess: async (data) => {
      try {
        const response: any = await authService.login(data);

        // ✅ Tu backend devuelve texto: "Usuario logueado (TOKEN)" (status 201)
        // No tenemos token real ni user real desde response, así que guardamos SOLO email para demo.
        // Si tu authService devolviera error object, lo detectamos:
        if (!response) {
          console.log("Login sin respuesta:", response);
          return;
        }
        if (
          typeof response === "object" &&
          (response?.error || response?.message?.includes?.("Error"))
        ) {
          console.log("Login falló:", response);
          return;
        }

        // ✅ Guardar sesión para que el Dashboard renderice el email
        login({
          user: { id: null, name: "Usuario", email: data.email },
          token: null,
        });

        // ✅ Toast éxito
        showToast.success("¡Ingreso Exitoso!", {
          duration: 4000,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });

        // ✅ Redirección
        router.push("/dashboard");
      } catch (error) {
        console.error("Error en login:", error);
      }
    },
    onError: (error) => {
      console.error("Error:", error);
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-800 rounded-full transform translate-x-20 translate-y-20 opacity-80"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-800 rounded-full transform -translate-x-12 translate-y-24 opacity-70"></div>
            <div className="absolute bottom-8 left-1/4 w-32 h-32 bg-amber-200 rounded-full opacity-60"></div>
          </div>

          <div className="relative z-10">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold text-amber-800 font-display">
                ¡Hola de Nuevo!
              </h2>
              <p className="text-lg text-emerald-800 font-handwritten">
                Inicia sesión para acceder a tu cuenta
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={emailField.value}
                  onChange={emailField.handleChange}
                  onBlur={emailField.handleBlur}
                  className={`w-full rounded-xl border-0 px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    emailField.error && emailField.touched
                      ? "bg-red-50 focus:ring-red-300"
                      : "bg-gray-100 focus:ring-gray-300"
                  }`}
                  placeholder="juan@email.com"
                />
                {emailField.touched && emailField.error && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {emailField.error}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-600 uppercase tracking-wider"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={passwordField.value}
                  onChange={passwordField.handleChange}
                  onBlur={passwordField.handleBlur}
                  className={`w-full rounded-xl border-0 px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    passwordField.error && passwordField.touched
                      ? "bg-red-50 focus:ring-red-300"
                      : "bg-gray-100 focus:ring-gray-300"
                  }`}
                  placeholder="••••••••"
                />
                {passwordField.touched && passwordField.error && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {passwordField.error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-4 font-semibold text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                    <span className="font-handwritten text-md">
                      Iniciar sesión
                    </span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-emerald-800 pt-4">
              ¿No tienes cuenta?{" "}
              <Link
                href="/register"
                className="font-semibold text-amber-800 hover:text-gray-900 transition-colors"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
