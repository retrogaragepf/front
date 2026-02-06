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
      errorMessage: isValid ? "" : "Solo peude llevar letras , y espacios",
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
        : "Contraseña no valida. La conraseña debe tener min 8 caracteres,al menos  1 letra mayuscula y caracter especial ",
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
};

export default validations;
