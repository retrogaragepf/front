export interface IRegisterErrors {
  name?: string;
  email?: string;
  password?: string;
 
}
export interface IValidationResult {
  isValid: boolean;
  errorMessage: string;
}
