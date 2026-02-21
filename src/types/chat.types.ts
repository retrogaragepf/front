export type ChatParticipant = "customer" | "seller";

export interface ChatConversation {
  sellerName: string;
  sellerId?: string;
  seller: {
    name: string;
  };
  id: string;
  customer: string;
  customerId?: string;
  participantIds?: string[];
  product: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId?: string;
  senderName?: string;
  isRead?: boolean;
  from: ChatParticipant;
  content: string;
  time: string;
  createdAt: number;
}

export type ChatMessageMap = Record<string, ChatMessage[]>;

export interface OpenChatPayload {
  conversationId?: string;
  product?: string;
  sellerName?: string;
  sellerId?: string;
  customerName?: string;
  customerId?: string;
  initialMessage?: string;
  asParticipant?: ChatParticipant;
}
