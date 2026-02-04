"use client";

const RegisterForm = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-64 h-64  bg-emerald-800 rounded-full transform translate-x-20 translate-y-20 opacity-80"></div>

            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-800 rounded-full transform -translate-x-12 translate-y-24 opacity-70"></div>

            <div className="absolute bottom-8 left-1/4 w-32 h-32 bg-amber-200 rounded-full opacity-60"></div>
          </div>

          <div className="relative z-10">
            {/* Encabezado */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-800">¡Hola de Nuevo!</h2>
              <p className="text-sm text-gray-500">
                Inicia sesión para acceder a tu cuenta
              </p>
            </div>
            {/* -------------------FORM ----------------------- */}
            <form className="space-y-4 mt-6">
             
              {/* ----------EMIL-----------------*/}
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
                  className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                  placeholder="juan@email.com"
                />
              </div>

              {/* ----------------PASSWOPRD----------- */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Contraseña
                  </label>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="w-full rounded-xl border-0 bg-gray-100 px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Checkbox Remember */}
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-gray-600"
                >
                  Recordar este dispositivo
                </label>
              </div>

              {/* ------------ENVIAR-------------- */}
              <button
                type="submit"
                className="w-full rounded-xl bg-gray-600 hover:bg-gray-700 px-4 py-4 font-semibold text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6"
              >
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
                <span>Registrarse</span>
              </button>
            </form>

            {/* ---------LINK A LOGIN--------- */}
            <p className="text-center text-sm text-gray-500 pt-4">
              ¿No tienes cuenta?{" "}
              <a
                href="/registro"
                className="font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                Registrate
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
