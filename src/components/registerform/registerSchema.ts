import * as Yup from "yup";

export interface IRegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  address: string;
  phone: string;
}

export const registerInitialValues: IRegisterFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  address: "",
  phone: "",
};

export const registerValidationSchema = Yup.object({
  email: Yup.string()
    .email("Email invalido.")
    .matches(/\.com$/i, "El email debe terminar en .com")
    .required("Este campo es obligatorio"),
  password: Yup.string()
    .min(6, "Minimo 6 Caracteres")
    .required("Este campo es obligatorio"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Las 2 contraseñas deben ser iguales.")
    .required("Este campo es obligatorio"),
  name: Yup.string().required("Este campo es obligatorio"),
  address: Yup.string().required("Este campo es obligatorio"),
  phone: Yup.string()
    .matches(
      /^(\+57\s?)?(3\d{2}|60[1-8])\d{7}$/,
      "Ingresa un número de teléfono de Colombia Válido"
    )
    .required("Este campo es obligatorio"),
});
