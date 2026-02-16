export type ChatParticipant = "customer" | "seller";

export interface ChatConversation {
  sellerName: any;
  seller: any;
  id: string;
  customer: string;
  product: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  from: ChatParticipant;
  content: string;
  time: string;
}

export interface ChatPanelProps {
  conversations: ChatConversation[];
  activeConversation: ChatConversation;
  messages: ChatMessage[];
}
