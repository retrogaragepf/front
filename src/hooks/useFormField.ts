import { useState } from "react";
import validations from "../validations/validations";
import { IValidationResult } from "../types/types";

type FieldName = "name" | "email" | "address" | "password" | "confirmPassword";

// ✅ Solo para TypeScript (no cambia runtime)
const typedValidations = validations as Record<
  FieldName,
  (value: string) => IValidationResult
>;

const useFormField = (fieldName: FieldName, initialValue: string = "") => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const validate = (): boolean => {
    const result: IValidationResult = typedValidations[fieldName](value);
    setError(result.errorMessage);
    return result.isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (touched) {
      //VALIDA MIENTARS ESRIBE SOLO SI TOCO EL COMAPO--------
      const result: IValidationResult = typedValidations[fieldName](
        e.target.value,
      );
      setError(result.errorMessage);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validate();
  };

  const reset = () => {
    setValue("");
    setError("");
    setTouched(false);
  };

  return {
    value,
    error,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
  };
};

export default useFormField;
