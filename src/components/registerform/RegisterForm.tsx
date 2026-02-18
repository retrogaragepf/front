"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import useFormField from "@/src/hooks/useFormField";
import { useFormSubmit } from "@/src/hooks/useFormSubmit";
import { authService } from "@/src/services/auth";
import { useAuth } from "@/src/context/AuthContext";
import { signIn, useSession } from "next-auth/react";

const RegisterForm = () => {
  const router = useRouter();

  const { login, isAuth } = useAuth();
  const { data: session } = useSession();

  const nameField = useFormField("name");
  const emailField = useFormField("email");
  const passwordField = useFormField("password");
  const confirmPasswordField = useFormField("confirmPassword"); // ✅ NUEVO
  //const addressField = useFormField("address");

  // ✅ Mantener "ver contraseña" con icono ojo
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // -----------------GOOGLE CON AUTcONTEXT-------------------

  const [googleClicked, setGoogleClicked] = useState(false);

  useEffect(() => {
    const pendingGoogle = sessionStorage.getItem("google-register");
    if (session?.user && !isAuth && pendingGoogle) {
      sessionStorage.removeItem("google-login");

      const registerGoogleUser = async () => {
        try {
          const randomPassWord = crypto.randomUUID(); // GENERA UNA CONTRASEÑA ÚNICA Y SEGURA PARA EL USUARIO DE GOOGLE
          const response: any = await authService.googleLogin({
            idToken: (session as any).idToken, // -----------TOKEN DE GOOGLE
          });
          console.log("GOOGLE REGISTER EN BACK:", response);

          //--------------AUNQUE LE. BACK DIGA QUE YA ESTA LO GUARDA EN CONTEXT PAR QUE SE LOGUE DIRECT--------

          if (response.token) {
            login({
              user: {
                id: response.user?.id || session.user.email || "",
                name: response.user?.name || session.user.name || "",
                email: response.user?.email || session.user.email || "",
                image: response.user?.image,
              },
              token: response.token,
            });

            showToast.success("¡Ingreso con Google exitoso!", {
              duration: 1000,
              progress: true,
              position: "top-center",
              icon: "",
              sound: true,
            });
            router.push("/dashboard");
          } else {
            showToast.error(
              response?.error || "Error al registrar con Google",
              {
                duration: 2000,
                progress: true,
                position: "top-center",
                transition: "popUp",
                icon: "",
                sound: true,
              },
            );
          }
        } catch (error) {
          console.error("Error autenticando con Google:", error);
          showToast.error("Error al conectar con Google", {
            duration: 2000,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
          });
        }
      };
      registerGoogleUser();
    }
  }, [session, isAuth, login, router, googleClicked]);

  const validateAll = () => {
    const isNameValid = nameField.validate();
    const isEmailValid = emailField.validate();
    const isPasswordValid = passwordField.validate();
    const isConfirmValid = confirmPasswordField.validate(); // ✅ NUEVO
    //const isAddressValid = addressField.validate();

    // ✅ Validación cruzada (sin tocar tu hook): confirmar === password
    const pass = passwordField.value ?? "";
    const confirm = confirmPasswordField.value ?? "";
    const matchOk = pass.length > 0 && confirm.length > 0 && pass === confirm;

    if (!matchOk && (confirmPasswordField.touched || passwordField.touched)) {
      // ❗ Solo mensaje, no cambia tu flujo
      showToast.error("Las contraseñas no coinciden.", {
        duration: 2000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
    }

    return (
      isNameValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmValid &&
      //isAddressValid &&
      matchOk
    );
  };

  // ✅ ÚNICO CAMBIO necesario: incluir confirmPassword en el payload
  const getFormData = () => ({
    name: nameField.value.trim(),
    email: emailField.value.trim(),
    //address: addressField.value.trim(),
    password: passwordField.value,
    confirmPassword: confirmPasswordField.value, // ✅ NUEVO: se envía al backend
  });

  const { handleSubmit, isSubmitting } = useFormSubmit({
    onValidate: validateAll,
    onGetData: getFormData,

    onSuccess: async (data) => {
      // ✅ Seguridad final (por si no tocó blur)
      if ((passwordField.value ?? "") !== (confirmPasswordField.value ?? "")) {
        throw new Error("Las contraseñas no coinciden.");
      }

      const response: any = await authService.register(data);

      if (!response) {
        throw new Error("El servidor no devolvió respuesta al registrar.");
      }

      if (
        typeof response === "object" &&
        (response?.error ||
          response?.message?.toLowerCase?.().includes("error"))
      ) {
        throw new Error(response?.message || "Error registrando usuario.");
      }

      showToast.success("¡Usuario registrado! Ahora inicia sesión ✅", {
        duration: 1000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });

      router.push("/login");
    },

    onError: (error: any) => {
      const msg = error?.message || "No se pudo registrar. Revisa tus datos.";
      showToast.error(String(msg), {
        duration: 1000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      console.error("Error register:", error);
    },
  });

  const passwordsMismatch =
    (confirmPasswordField.touched || passwordField.touched) &&
    (passwordField.value ?? "") !== (confirmPasswordField.value ?? "");

  return (
    <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6 relative overflow-hidden">
          {/* decor */}
          <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-800 rounded-full transform translate-x-20 translate-y-20 opacity-80"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-800 rounded-full transform -translate-x-12 translate-y-24 opacity-70"></div>
            <div className="absolute bottom-8 left-1/4 w-32 h-32 bg-amber-200 rounded-full opacity-60"></div>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="font-bold text-amber-800 font-display text-4xl">
                ¡Bienvenido!
              </h1>
              <p className="text-lg text-emerald-800 font-handwritten">
                Regístrate para crear una cuenta
              </p>
            </div>

            {/* ----------------------BOTÓN DE GOOGLE ----------------------------*/}
            <div className="p-1 rounded-xl bg-gray-200">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem("google-register", "true");
                  signIn("google", { callbackUrl: "/register" });
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">
                  o usa tu email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NOMBRE */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider"
                >
                  Nombre Completo
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={nameField.value}
                  onChange={nameField.handleChange}
                  onBlur={nameField.handleBlur}
                  className={`w-full rounded-xl border-0 px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    nameField.error && nameField.touched
                      ? "bg-red-50 focus:ring-red-300"
                      : "bg-gray-100 focus:ring-gray-300"
                  }`}
                  placeholder="Nombre y Apellido"
                />
                {nameField.touched && nameField.error && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {nameField.error}
                  </p>
                )}
              </div>

              {/* EMAIL */}
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
                  placeholder="correo@ejemplo.com"
                />
                {emailField.touched && emailField.error && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {emailField.error}
                  </p>
                )}
              </div>

              {/* PASSWORD (sin ojo) */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider"
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

              {/* CONFIRM PASSWORD (sin ojo) */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider"
                >
                  Confirmar contraseña
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPasswordField.value}
                  onChange={confirmPasswordField.handleChange}
                  onBlur={confirmPasswordField.handleBlur}
                  className={`w-full rounded-xl border-0 px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    (confirmPasswordField.error &&
                      confirmPasswordField.touched) ||
                    passwordsMismatch
                      ? "bg-red-50 focus:ring-red-300"
                      : "bg-gray-100 focus:ring-gray-300"
                  }`}
                  placeholder="••••••••"
                />

                {confirmPasswordField.touched &&
                  (confirmPasswordField.error || passwordsMismatch) && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">
                      {passwordsMismatch
                        ? "Las contraseñas no coinciden."
                        : confirmPasswordField.error}
                    </p>
                  )}
              </div>

              {/* SUBMIT */}
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Procesando...</span>
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
                    <span className=" text-md">
                      Registrarse
                    </span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-emerald-800 font-handwritten">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-semibold text-amber-800 hover:text-gray-900 transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
