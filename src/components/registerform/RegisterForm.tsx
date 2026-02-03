"use client";

import { useFormik } from "formik";
import {
  registerInitialValues,
  registerValidationSchema,
} from "./registerSchema";
import { registerUser } from "@/src/services/auth.services";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

function RegisterForm() {
  const router = useRouter();

  const formik = useFormik({
    initialValues: registerInitialValues,
    validationSchema: registerValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      const responseRegister = await registerUser(values);
      showToast.info("¡El Registro se realizó con éxito!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      router.push("/login");
      resetForm();
    },
  });

  return (
    <div className=" w-full min-h-125 flex justify-center items-center bg-white">
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col w-full max-w-md items-stretch gap-6  p-6 rounded-2xl shadow-lg"
      >
        <div className="text-negroapple flex flex-col">
          <label
            htmlFor="email"
            className="mb-1 text-sm font-medium text-negroapple "
          >
            Email
          </label>
          <input
            className="bg-gray-200 w-full px-2 py-1 rounded text-black "
            id="email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-red-600 text-sm">{formik.errors.email}</p>
          )}
        </div>

        <div className="text-negroapple flex flex-col">
          <label
            htmlFor="password"
            className="mb-1 text-sm font-medium text-negroapple "
          >
            Contraseña
          </label>
          <input
            className="bg-gray-200 w-full px-2 py-1 rounded text-black focus:ring-2 focus:ring-gray-500"
            id="password"
            name="password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-600 text-sm">{formik.errors.password}</p>
          )}
        </div>

        <div className="text-negroapple flex flex-col">
          <label
            htmlFor="confirmPassword"
            className="mb-1 text-sm font-medium text-negroapple "
          >
            Confirmar Contraseña
          </label>
          <input
            className="bg-gray-200 w-full px-2 py-1 rounded text-black focus:ring-2 focus:ring-gray-500"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p className="text-red-600 text-sm">
              {formik.errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="text-negroapple flex flex-col">
          <label
            htmlFor="name"
            className="mb-1 text-sm font-medium text-negroapple "
          >
            Nombre
          </label>
          <input
            className="bg-gray-200 w-full px-2 py-1 rounded text-black focus:ring-2 focus:ring-gray-500"
            id="name"
            name="name"
            type="text"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-red-600 text-sm">{formik.errors.name}</p>
          )}
        </div>

        <div className="text-negroapple flex flex-col">
          <label
            htmlFor="address"
            className="mb-1 text-sm font-medium text-negroapple "
          >
            Dirección
          </label>
          <input
            className="bg-gray-200 w-full px-2 py-1 rounded text-black focus:ring-2 focus:ring-gray-500"
            id="address"
            name="address"
            type="text"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.address && formik.errors.address && (
            <p className="text-red-600 text-sm">{formik.errors.address}</p>
          )}
        </div>

        <div className="text-negroapple flex flex-col">
          <label
            htmlFor="phone"
            className="mb-1 text-sm font-medium text-negroapple "
          >
            Teléfono
          </label>
          <input
            className="bg-gray-200 w-full px-2 py-1 rounded text-black focus:ring-2 focus:ring-gray-500"
            id="phone"
            name="phone"
            type="text"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.phone && formik.errors.phone && (
            <p className="text-red-600 text-sm">{formik.errors.phone}</p>
          )}
        </div>

        <button
          type="submit"
          className="bg-black w-50 self-center text-white border cursor-pointer rounded-2xl py-2"
        >
          Registrate
        </button>
      </form>
    </div>
  );
}

export default RegisterForm;
