import { useState } from 'react';

interface UseFormSubmitProps<T> {
  onValidate: () => boolean;
  onGetData: () => T;
  onSuccess: (data: T) => void | Promise<void>;
  onError?: (error: string) => void;
}

export const useFormSubmit = <T,>({
  onValidate,
  onGetData,
  onSuccess,
  onError,
}: UseFormSubmitProps<T>) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ----VALIDA TODOS LOS CAMPOS------
    if (!onValidate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = onGetData();
      
      console.log('Datos a enviar:', formData);
      
      // ------ESPERA LA RESPUESTA DEL SERVIDOR------
      await onSuccess(formData);
      
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
  };
};