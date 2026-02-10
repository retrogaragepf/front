"use client";
import useFormField from "@/src/hooks/useFormField";
import { useFormSubmit } from "@/src/hooks/useFormSubmit";
import { authService } from "@/src/services/auth";
import { useRouter } from "next/navigation";
import React from "react";

const RegisterForm = () => {
  const router = useRouter();

  const nameField = useFormField("name");
  const emailField = useFormField("email");
  const passwordField = useFormField("password");
  const addressField = useFormField("address");

  const validateAll = () => {
    const isNameValid = nameField.validate();
    const isEmailValid = emailField.validate();
    const isPasswordValid = passwordField.validate();
    const isAddressValid = addressField.validate();
    return isNameValid && isEmailValid && isPasswordValid && isAddressValid;
  };

  const getFormData = () => ({
    name: nameField.value,
    email: emailField.value,
    address: addressField.value,
    password: passwordField.value,
  });

  const { handleSubmit, isSubmitting } = useFormSubmit({
    onValidate: validateAll,
    onGetData: getFormData,
    onSuccess: async (data) => {
  try {
    const response = await authService.register(data);

    // ✅ guardamos lo mínimo necesario en el front
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: data.name,
        mail: data.email,
      })
    );
    // 🔹 Push a la dashboard
    router.push("/dashboard");

  } catch (error) {
    console.error("Error en registro:", error);
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
              <h1 className="font-bold text-amber-800 font-display text-4xl">
                ¡Bienvenido!
              </h1>
              <p className="text-lg text-emerald-800 font-handwritten">
                Regístrate para crear una cuenta
              </p>
            </div>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 
             border border-gray-300 bg-white 
             hover:bg-gray-50 
             text-gray-800 font-medium 
             py-3 px-4 rounded-xl 
             transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.72 1.22 9.22 3.22l6.9-6.9C35.9 2.34 30.47 0 24 0 14.64 0 6.64 5.38 2.74 13.22l8.02 6.22C12.7 13.72 17.9 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.1 24.5c0-1.7-.14-3.34-.4-4.94H24v9.36h12.4c-.54 2.9-2.16 5.36-4.6 7.04l7.1 5.5c4.16-3.84 6.6-9.5 6.6-16.96z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.76 28.44c-.5-1.5-.78-3.1-.78-4.78s.28-3.28.78-4.78l-8.02-6.22C.98 16.1 0 19.96 0 24c0 4.04.98 7.9 2.74 11.34l8.02-6.22z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.92-2.14 15.9-5.8l-7.1-5.5c-1.98 1.34-4.52 2.14-8.8 2.14-6.1 0-11.3-4.22-13.24-9.94l-8.02 6.22C6.64 42.62 14.64 48 24 48z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

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
              {/* ------------NOMBRE-------------*/}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider"
                >
                  Nombre completo
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
                  placeholder="Juan Pérez"
                />
                {nameField.touched && nameField.error && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {nameField.error}
                  </p>
                )}
              </div>

              {/*-------------------CORREO--------------*/}
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

              {/*-------------------DIRECCION---------------*/}
              <div>
                <label
                  htmlFor="address"
                  className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider"
                >
                  Dirección
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={addressField.value}
                  onChange={addressField.handleChange}
                  onBlur={addressField.handleBlur}
                  className={`w-full rounded-xl border-0 px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    addressField.error && addressField.touched
                      ? "bg-red-50 focus:ring-red-300"
                      : "bg-gray-100 focus:ring-gray-300"
                  }`}
                  placeholder="Calle 123"
                />
                {addressField.touched && addressField.error && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {addressField.error}
                  </p>
                )}
              </div>

              {/* ----------------CONTRASEÑA--------------- */}
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

              {/* -------------SUBMIT ------------*/}
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
                    <span className="font-handwritten text-md">
                      Registrarse
                    </span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-emerald-800 pt-4">
              ¿Ya tienes cuenta?{" "}
              <a
                href="/login"
                className="font-semibold text-amber-800 hover:text-gray-900 transition-colors"
              >
                Inicia sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
