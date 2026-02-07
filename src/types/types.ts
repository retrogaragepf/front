/*-------AUTENTICACION--------*/
export interface RegisterData {
  name: string;
  email: string;
  //address: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    address: string;
  };
  error?: string;
  message?: string;
}

/*-------Errores de registro--------*/
export interface IRegisterErrors {
  name?: string;
  email?: string;
  address?: string;
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
