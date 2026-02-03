import * as Yup from "yup";

export interface ILoginFormValues {
  email: string;
  password: string;
}

export const loginInitialValues: ILoginFormValues = {
  email: "",
  password: "",
};

export const loginValidationSchema = Yup.object({
  email: Yup.string()
    .email("Email invalido.")
    .matches(/\.com$/i, "El email debe terminar en .com")
    .required("Este campo es obligatorio"),
  password: Yup.string()
    .min(6, "Minimo 6 Caracteres")
    .required("Este campo es obligatorio"),
});
