
import { UUID, DateString, DecimalString } from '../types';

/**
 * Interface de Categoría
 */
export interface ICategory {
  id: UUID;
  name: string;
  description?: string;
  createdAt: DateString;
}

/**
 * Interface de Era
 */
export interface IEra {
  id: UUID;
  name: string;
  description?: string;
  yearRange?: string;
  createdAt: DateString;
}

/**
 * Interface completa de Producto
 */
export interface IProduct {
  id: UUID;
  title: string;
  description?: string;
  price: DecimalString;
  stock: number;
  sellerId: UUID;
  categoryId: UUID;
  eraId: UUID;
  createdAt: DateString;
}

/**
 * Producto con datos relacionados (joins)
 */
export interface IProductWithDetails extends IProduct {
  seller: {
    id: UUID;
    fullName: string;
    email: string;
  };
  category: ICategory;
  era: IEra;
  images?: string[];
  averageRating?: number;
  totalReviews?: number;
}

/**
 * Datos para crear producto
 */
export interface IProductCreate {
  title: string;
  description?: string;
  price: number | string;
  stock: number;
  categoryId: UUID;
  eraId: UUID;
  images?: string[];
}

/**
 * Datos para actualizar producto
 */
export interface IProductUpdate {
  title?: string;
  description?: string;
  price?: number | string;
  stock?: number;
  categoryId?: UUID;
  eraId?: UUID;
  images?: string[];
}