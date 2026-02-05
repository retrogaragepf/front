

import { PaymentProvider, StripePaymentStatus, UUID, DateString, DecimalString } from '../types';

/**
 * Interface de Payment
 */
export interface IPayment {
  id: UUID;
  provider: PaymentProvider;
  providerPaymentId: string;
  status: StripePaymentStatus;
  amount: DecimalString;
  currency: string;
  paymentMethod?: string;
  failureReason?: string;
  createdAt: DateString;
  paidAt?: DateString;
  orderId: UUID;
}

/**
 * Interface de Stripe Event
 */
export interface IStripeEvent {
  id: UUID;
  stripeEvent: string;
  type: string;
  apiVersion?: string;
  livemode: boolean;
  payload: any; // JSON
  receivedAt: DateString;
  processedAt?: DateString;
  paymentId?: UUID;
  orderId?: UUID;
}

/**
 * Datos para crear un pago
 */
export interface IPaymentCreate {
  amount: number;
  currency: string;
  orderId: UUID;
  paymentMethod?: string;
}

/**
 * Respuesta de intención de pago de Stripe
 */
export interface IPaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

/**
 * Datos de confirmación de pago
 */
export interface IPaymentConfirmation {
  paymentIntentId: string;
  status: StripePaymentStatus;
  orderId: UUID;
}

/**
 * Detalles completos del pago
 */
export interface IPaymentWithDetails extends IPayment {
  order: {
    id: UUID;
    orderStatus: string;
    total: DecimalString;
  };
  stripeEvents?: IStripeEvent[];
}