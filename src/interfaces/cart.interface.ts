
import { UUID, DateString, DecimalString } from '../types';
import { IProduct } from './product.interface';

/**
 * Interface de Cart
 */
export interface ICart {
  id: UUID;
  userId: UUID;
  createdAt: DateString;
}

/**
 * Interface de CartItem
 */
export interface ICartItem {
  id: UUID;
  cartId: UUID;
  productId: UUID;
  quantity: number;
  unitPrice: DecimalString;
}

/**
 * CartItem con detalles del producto
 */
export interface ICartItemWithProduct extends ICartItem {
  product: IProduct;
  subtotal: number;
}

/**
 * Cart completo con items
 */
export interface ICartWithItems extends ICart {
  items: ICartItemWithProduct[];
  total: number;
  itemCount: number;
}

/**
 * Datos para agregar item al carrito
 */
export interface IAddToCart {
  productId: UUID;
  quantity: number;
}

/**
 * Datos para actualizar cantidad
 */
export interface IUpdateCartItem {
  quantity: number;
}