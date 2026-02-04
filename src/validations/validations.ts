//import { IValidationResult } from "@/types/types";

const validations = {
  // ----------Nombre y apellido (permite espacios y acentos)-------------
  name: (value: string) => {
    const isValid = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$/.test(
      value
    );
    return {
      isValid,
      errorMessaage: isValid ? "" : "Solo peude llevar letras , y espacios",
    };
  },
  // -------------Email----------
  email: (value: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return {
      isValid,
      errorMessage: isValid ? "" : "Debes escribir un email valido",
    };
  },

  // -----------Password -------------
  password: (value: string) => {
    const isValid =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&._\-+=^~()[\]{}|/\\:;"'<>,])[A-Za-z\d@$!%*?#&._\-+=^~()[\]{}|/\\:;"'<>,]{8,}$/.test(
        value
      );
    return {
      isValid,
      errorMessage: isValid
        ? ""
        : "Contraseña no valida. La conraseña debe tener min 8 caracteres,al menos  1 letra mayuscula y caracter especial ",
    };
  },
};

export default validations;
