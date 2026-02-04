import { useState } from 'react';

interface UseFormSubmitProps {
  onValidate: () => boolean;
  onGetData: () => any;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useFormSubmit = ({
  onValidate,
  onGetData,
  onSuccess,
  onError,
}: UseFormSubmitProps) => {
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
      
      // ------AQUI SE LLAMARAA. A AL APAI 
      console.log('📦 Datos a enviar:', formData);
      
      // -----------ENVIO FAKE ----------
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess?.();
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