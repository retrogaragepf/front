
import { UserRole, UUID, DateString } from '../types';

/**
 * Interface completa del usuario (como viene del backend)
 */
export interface IUser {
  id: UUID;
  fullName: string;
  address: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: DateString;
}

/**
 * Usuario sin datos sensibles (para mostrar en frontend)
 */
export interface IUserPublic {
  id: UUID;
  fullName: string;
  address: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: DateString;
}

/**
 * Datos para crear un nuevo usuario
 */
export interface IUserCreate {
  fullName: string;
  email: string;
  address: string;
  password: string;
  role?: UserRole;
}

/**
 * Datos para login
 */
export interface IUserLogin {
  email: string;
  password: string;
}

/**
 * Datos para actualizar usuario
 */
export interface IUserUpdate {
  fullName?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

/**
 * Respuesta de autenticación
 */
export interface IAuthResponse {
  user: IUserPublic;
  token: string;
}