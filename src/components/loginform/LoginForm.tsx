"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import useFormField from "@/src/hooks/useFormField";
import { useFormSubmit } from "@/src/hooks/useFormSubmit";
import authService from "@/src/services/auth";
import { showToast } from "nextjs-toast-notify";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  isAdmin?: boolean;
};

const LoginForm = () => {
  const router = useRouter();
  const { login, isAuth } = useAuth();
  const { data: session } = useSession();
  const [googleClicked, setGoogleClicked] = useState(false);

  // ----------SINCRONIZA SESIÓN DE GOOGLE CON CONTEXT----------------
  useEffect(() => {
    const pendingGoogle = sessionStorage.getItem("google-login");
    if (session?.user && !isAuth && pendingGoogle) {
      sessionStorage.removeItem("google-login"); // LIMPIA EL FLAG

      //-----------ENVIA EL IDTOKEN AL BACK PAARA TENER EL JWT REAL----------

      const handleGoogleLogin = async () => {
        try {
          const response = await authService.googleLogin({
            idToken: (session as any).idToken ?? "", // -----------TOKEN DE GOOGLE
          });

          if (response.token) {
            // ✅ Guarda en context (igual que ya lo tienes)
            login({
              user: {
                id: response.user?.id ?? session.user?.email ?? "",
                name: response.user?.name ?? session.user?.name ?? "",
                email: response.user?.email ?? session.user?.email ?? "",
              },
              token: response.token,
            });

            // ✅ NUEVO: revisa isAdmin en el JWT y redirige
            let isAdmin = false;
            try {
              const decoded = jwtDecode<JwtPayload>(response.token);
              isAdmin = decoded?.isAdmin === true;
            } catch {}

            router.push(isAdmin ? "/admin/dashboard" : "/dashboard");
          }
        } catch (error) {
          console.error("Error autenticando en Google", error);

          showToast.error("Error autenticando con Google", {
            duration: 3000,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
          });
        }
      };
      handleGoogleLogin();
    }
  }, [session, isAuth, login, router, googleClicked]);

  const emailField = useFormField("email");
  const passwordField = useFormField("password");

  const validateAll = () => {
    const isEmailValid = emailField.validate();
    const isPasswordValid = passwordField.validate();
    return isEmailValid && isPasswordValid;
  };

  const getFormData = () => ({
    email: emailField.value.trim(),
    password: passwordField.value,
  });

  const { handleSubmit, isSubmitting } = useFormSubmit({
    onValidate: validateAll,
    onGetData: getFormData,

    onSuccess: async (data) => {
      try {
        const response: any = await authService.login(data);
        console.log("------RESPUESTA--------", response);
        console.log("response?.token:", response?.token);

        // ❌ si tu authService normaliza errores como { success:false, error,... }
        if (!response.token) {
          console.log("Login sin token");
          showToast.error(response?.error || "Credenciales inválidas", {
            duration: 3000,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
          });
          return;
        }

        if (!response?.token) {
          console.error("Login sin token");
          showToast.error(response?.error || "Credenciales inválidas", {
            duration: 3000,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
          });
          return;
        }

        //---------DATOS DEL LOCALSTORAGE ANTES DE GUARDAR SESIÓN----------------
        const TOKEN_KEY =
          process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";
        const authData = localStorage.getItem(TOKEN_KEY);
        if (!authData) {
          console.error("No hay datos en localStorage");
          showToast.error("Error al guardar sesión.Intenta de nuevo", {
            duration: 3000,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
          });
          return;
        }
        const savedData = JSON.parse(authData);
        console.log("DATOS DEL LOCALSTORAGE", savedData);

        //-----------GUARDA EN CONTEXTO CON DATOS REALES/ QUE VIENEN EN EL TOKEN----------------
        login({
          user: {
            id: savedData.user.id,
            name: savedData.user.name, // ← AQUÍ VIENE EL NOMBRE
            email: savedData.user.email,
          },
          token: savedData.token,
        });

        console.log("LOGIN EXITOSO - Datos guardados en contexto");

        showToast.success("¡Ingreso Exitoso!", {
          duration: 4000,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });

        // ✅ NUEVO: revisa isAdmin desde el token que YA guardaste (savedData.token)
        let isAdmin = false;
        try {
          const decoded = jwtDecode<JwtPayload>(savedData.token);
          isAdmin = decoded?.isAdmin === true;
        } catch (e) {
          console.warn("No se pudo decodificar JWT para isAdmin:", e);
        }

        router.push(isAdmin ? "/admin/dashboard" : "/dashboard");
      } catch (error) {
        console.error("Error en login:", error);
        showToast.error("Error en login", {
          duration: 3000,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });
      }
    },

    onError: (error) => {
      console.error("Error:", error);
      showToast.error("Error validando el formulario", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
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

          <div className="relative z-10 ">
            <div className="text-center space-y-2">
              <h2 className="text-4xl  text-amber-800 font-display">
                RetroGarage
              </h2>
              <p className="text-lg text-emerald-800 font-handwritten pb-2">
                Inicia sesión para acceder a tu cuenta
              </p>
            </div>

            {/* ----------------------BOTÓN DE GOOGLE ----------------------------*/}
            <div className="p-1 rounded-xl bg-amber-100">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem("google-login", "true");
                  signIn("google", { callbackUrl: "/login" });
                }}
                className="w-full rounded-xl bg-white border border-gray-300 hover:bg-gray-50 px-4 py-3 font-medium text-gray-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 pt-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-gray-300"></div>
              <span className="shrink-0 mx-4 text-gray-500 text-xs">
                O continúa con tu Email
              </span>
              <div className="grow border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
                className="w-full rounded-xl bg-emerald-800 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-4 font-semibold text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6"
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

            <p className="text-center text-sm text-black pt-4 font-handwritten">
              ¿No tienes cuenta?{" "}
              <Link
                href="/register"
                className="font-semibold text-shadow-emerald-900 hover:text-gray-900 transition-colors"
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
