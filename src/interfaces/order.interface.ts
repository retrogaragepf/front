
import { OrderStatus, PaymentStatus, UUID, DateString, DecimalString } from '../types';
import { IProduct } from './product.interface';
import { IUserPublic } from './user.interface';

/**
 * Interface de Order
 */
export interface IOrder {
  id: UUID;
  buyerId: UUID;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: DecimalString;
  discountAmount?: DecimalString;
  total: DecimalString;
  discountCodeId?: UUID;
  createdAt: DateString;
  shippedAt?: DateString;
  deliveredAt?: DateString;
}

/**
 * Interface de OrderItem
 */
export interface IOrderItem {
  id: UUID;
  orderId: UUID;
  productId: UUID;
  quantity: number;
  unitPrice: DecimalString;
}

/**
 * OrderItem con detalles del producto
 */
export interface IOrderItemWithProduct extends IOrderItem {
  product: IProduct;
  subtotal: number;
}

/**
 * Order completa con todos los detalles
 */
export interface IOrderWithDetails extends IOrder {
  buyer: IUserPublic;
  items: IOrderItemWithProduct[];
  discountCode?: {
    code: string;
    percent: number;
  };
}

/**
 * Datos para crear una orden
 */
export interface IOrderCreate {
  items: {
    productId: UUID;
    quantity: number;
    unitPrice: number;
  }[];
  discountCodeId?: UUID;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

/**
 * Datos para actualizar estado de orden
 */
export interface IOrderUpdateStatus {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}