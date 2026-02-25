const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type NotificationDTO = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export async function getMyNotifications(
  token: string,
): Promise<NotificationDTO[]> {
  const res = await fetch(`${API_URL}/notifications/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Error al obtener notificaciones");
  }

  return res.json();
}

export async function markNotificationAsRead(
  notificationId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error("Error al marcar notificación como leída");
  }
}