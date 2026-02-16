import { ChatConversation, ChatMessage } from "@/src/types/chat.types";

export const sampleConversations: ChatConversation[] = [
  {
    id: "conv-1",
    sellerName: "Retro Garage",
    seller: { name: "Retro Garage" },
    customer: "Clara Restrepo",
    product: "Maleta de cuero vintage",
    lastMessage: "¿Podrías reservarla hasta mañana?",
    timestamp: "Hoy, 14:02",
    unreadCount: 2,
  },
  {
    id: "conv-2",
    sellerName: "Retro Garage",
    seller: { name: "Retro Garage" },
    customer: "Julio Álvarez",
    product: "Cámara Polaroid 636",
    lastMessage: "Gracias, me llega perfecto.",
    timestamp: "Ayer, 20:17",
    unreadCount: 0,
  },
  {
    id: "conv-3",
    sellerName: "Retro Garage",
    seller: { name: "Retro Garage" },
    customer: "Mara Gómez",
    product: "Silla Eames réplica 50s",
    lastMessage: "¿Sigue disponible?",
    timestamp: "12 feb, 09:45",
    unreadCount: 0,
  },
];

export const sampleMessages: ChatMessage[] = [
  {
    id: "msg-1",
    from: "customer",
    content: "Hola, ¿todavía tienes la maleta completa?",
    time: "13:58",
  },
  {
    id: "msg-2",
    from: "seller",
    content: "¡Hola Clara! Sí, está impecable, con forro original y candado funcionando.",
    time: "14:00",
  },
  {
    id: "msg-3",
    from: "customer",
    content: "Perfecto, ¿podrías reservarla hasta mañana en la tarde?",
    time: "14:02",
  },
  {
    id: "msg-4",
    from: "seller",
    content: "Claro, la dejo apartada 24 horas. Si decides llevarla, coordinamos envío o retiro.",
    time: "14:05",
  },
];
