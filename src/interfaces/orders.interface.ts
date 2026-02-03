import { IProduct } from "./product.interface";

export interface Order {
  id: number;
  products: IProduct[];
  date: string;
  status: string;
}
