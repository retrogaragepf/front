"use client";
import { useFormik } from "formik";
import { loginInitialValues, loginValidationSchema } from "./loginSchema";
import { loginUser } from "@/src/services/auth.services";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

function LoginForm() {
  const { setDataUser } = useAuth();
  const router = useRouter();
  const formik = useFormik({
    initialValues: loginInitialValues,
    validationSchema: loginValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      const responseLogin = await loginUser(values);
      setDataUser(responseLogin);
      showToast.info("¡El Login se realizó con éxito!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      router.push("/dashboard");
      resetForm();
    },
  });
  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      {" "}
      <form
        className="shadow-lg w-full max-w-md rounded-xl p-6 sm:p-8 flex flex-col gap-6"
        onSubmit={formik.handleSubmit}
      >
        {" "}
        <div className="flex flex-col">
          {" "}
          <label
            htmlFor="email"
            className="mb-1 text-sm font-medium text-negroapple"
          >
            {" "}
            Email{" "}
          </label>{" "}
          <input
            className="shadow-lg bg-gray-200 w-full px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-gray-500"
            id="email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
          />{" "}
          {formik.errors.email && (
            <p className="text-red-600 text-sm mt-1">{formik.errors.email}</p>
          )}{" "}
        </div>{" "}
        <div className="flex flex-col">
          {" "}
          <label
            htmlFor="password"
            className="mb-1 text-sm font-medium text-negroapple "
          >
            {" "}
            Contraseña{" "}
          </label>{" "}
          <input
            className="shadow-lg bg-gray-200 w-full px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-gray-500"
            id="password"
            name="password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
          />{" "}
          {formik.errors.password && (
            <p className="text-red-600 text-sm mt-1">
              {" "}
              {formik.errors.password}{" "}
            </p>
          )}{" "}
        </div>{" "}
        <button
          type="submit"
          className="bg-negroapple text-white font-semibold border border-white cursor-pointer rounded-2xl px-4 py-2 mt-2 w-full sm:w-auto self-center transition"
        >
          {" "}
          iniciar sesión{" "}
        </button>{" "}
      </form>{" "}
    </div>
  );
}
export default LoginForm;
