
import { UUID, DateString } from '../types';
import { IUserPublic } from './user.interface';
import { IProduct } from './product.interface';

/**
 * Interface de Review
 */
export interface IReview {
  id: UUID;
  rating: number; // 1-5
  comment?: string;
  reviewerId: UUID;
  sellerId: UUID;
  orderId: UUID;
  productId: UUID;
  createdAt: DateString;
}

/**
 * Review con detalles completos
 */
export interface IReviewWithDetails extends IReview {
  reviewer: IUserPublic;
  seller: IUserPublic;
  product: IProduct;
}

/**
 * Datos para crear un review
 */
export interface IReviewCreate {
  rating: number;
  comment?: string;
  orderId: UUID;
  productId: UUID;
  sellerId: UUID;
}

/**
 * Datos para actualizar un review
 */
export interface IReviewUpdate {
  rating?: number;
  comment?: string;
}

/**
 * Estadísticas de reviews
 */
export interface IReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}