
import { UUID, DateString } from '../types';

export interface IDiscountCode {
  id: UUID;
  code: string;
  percent: number;
  isActive: boolean;
  expiresAt?: DateString;
  maxUses?: number;
  usedCount: number;
}

/**
 * Interface de Discount Usage
 */
export interface IDiscountUsage {
  id: UUID;
  discountCodeId: UUID;
  userId: UUID;
  orderId: UUID;
  usedAt: DateString;
}

/**
 * Discount Code con detalles de uso
 */
export interface IDiscountCodeWithStats extends IDiscountCode {
  remainingUses?: number;
  isExpired: boolean;
  isAvailable: boolean;
}

/**
 * Datos para crear un código de descuento
 */
export interface IDiscountCodeCreate {
  code: string;
  percent: number;
  expiresAt?: string;
  maxUses?: number;
}

/**
 * Datos para actualizar código de descuento
 */
export interface IDiscountCodeUpdate {
  percent?: number;
  isActive?: boolean;
  expiresAt?: string;
  maxUses?: number;
}

/**
 * Resultado de validación de código
 */
export interface IDiscountValidation {
  isValid: boolean;
  code?: IDiscountCode;
  error?: string;
  discount?: number;
}