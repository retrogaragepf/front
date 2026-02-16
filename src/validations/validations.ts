//import { IValidationResult } from "@/types/types";

const validations = {
  // ----------Nombre y apellido (permite espacios y acentos)-------------
  name: (value: string) => {
    const isValid =
      /^(?=(?:.*[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]){5,})[A-Za-zÁÉÍÓÚÜáéíóúüÑñ ]+$/.test(
        value,
      );
    return {
      isValid,
      errorMessage: isValid ? "" : "Solo Puede llevar letras , y espacios",
    };
  },

  // -------------EMAIL----------
  email: (value: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return {
      isValid,
      errorMessage: isValid ? "" : "Debes escribir un email valido",
    };
  },

  // -----------PASSWORD -------------
  password: (value: string) => {
    const isValid =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&._\-+=^~()[\]{}|/\\:;"'<>,])[A-Za-z\d@$!%*?#&._\-+=^~()[\]{}|/\\:;"'<>,]{8,}$/.test(
        value,
      );
    return {
      isValid,
      errorMessage: isValid
        ? ""
        : "Contraseña no valida. La contraseña debe tener min 8 caracteres:  1 letra mayuscula y caracter especial ",
    };
  },

  // -----------ADDRESS -------------
  address: (value: string) => {
    const isValid = /^.{5,}$/.test(value.trim());

    return {
      isValid,
      errorMessage: isValid
        ? ""
        : "La dirección debe tener al menos 5 caracteres",
    };
  },

  // ✅ CONFIRM PASSWORD (solo valida que no esté vacío)
  // La comparación "confirmPassword === password" la haces en el RegisterForm.
  confirmPassword: (value: string) => {
    const isValid = value.trim().length > 0;
    return {
      isValid,
      errorMessage: isValid ? "" : "Confirma tu contraseña",
    };
  },
};

export default validations;
