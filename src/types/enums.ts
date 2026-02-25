/**
 * Roles de usuario en el sistema
 */
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

/**
 * Estados de una orden (legacy / genérico)
 * ⚠️ Renombrado para no chocar con el OrderStatus del front
 */
export enum OrderState {
  CREATED = "CREATED",
  CONFIRMED = "CONFIRMED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
}

/**
 * Estados de pago
 */
export enum PaymentStatus {
  PAID = "PAID",
  FAILED = "FAILED",
}

/**
 * Proveedores de pago
 */
export enum PaymentProvider {
  STRIPE = "STRIPE",
}

/**
 * Estados del pago en Stripe
 */
export enum StripePaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}
