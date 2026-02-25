export type NotificationType = "sale" | "system" | "info";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}