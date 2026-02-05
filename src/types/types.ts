/*-------Errores de registro--------*/

export interface IRegisterErrors {
  name?: string;
  email?: string;
  password?: string;
 
}

/*---------Resultado de validación----------*/
export interface IValidationResult {
  isValid: boolean;
  errorMessage: string;
}

/**---------- Tipos de datos primitivos----------*/
export type UUID = string;
export type DateString = string;
export type DecimalString = string;

/*---------------- Tipo para respuestas de API------------*/
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/*---------Tipo para paginación----------*/
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/*----------Tipo para filtros comune-------*/
export type FilterParams = {
  search?: string;
  category?: string;
  era?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
};
