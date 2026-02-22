//import { IValidationResult } from "@/types/types";

const validations = {
  // ----------Nombre y apellido (permite espacios y acentos)-------------
  name: (value: string) => {
    const normalized = value.trim().replace(/\s+/g, " ");
    const hasOnlyLettersAndSpaces =
      /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ ]+$/.test(normalized);
    const nameParts = normalized.split(" ").filter(Boolean);
    const hasAtLeastTwoWords = nameParts.length >= 2;
    const hasMinLettersPerWord = nameParts.every((part) => part.length >= 2);
    const isValid =
      hasOnlyLettersAndSpaces && hasAtLeastTwoWords && hasMinLettersPerWord;

    return {
      isValid,
      errorMessage: isValid
        ? ""
        : "Debes ingresar nombre y apellido (solo letras y espacios).",
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
