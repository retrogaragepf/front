import { ChatConversation, ChatMessage } from "@/src/types/chat.types";

export const formatTime = (date = new Date()): string =>
  date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export function appendMessageSafe(
  messages: ChatMessage[],
  next: ChatMessage,
): ChatMessage[] {
  if (messages.some((message) => message.id === next.id)) return messages;
  return [...messages, next].sort((a, b) => a.createdAt - b.createdAt);
}

export function dedupeConversations(list: ChatConversation[]): ChatConversation[] {
  const map = new Map<string, ChatConversation>();
  list.forEach((conversation) => {
    if (!conversation.id) return;
    const previous = map.get(conversation.id);
    map.set(
      conversation.id,
      previous ? { ...previous, ...conversation } : conversation,
    );
  });
  return Array.from(map.values());
}

export function mergeConversationData(
  remote: ChatConversation,
  previous?: ChatConversation,
): ChatConversation {
  if (!previous) return remote;

  const remoteName = remote.sellerName?.trim() || "";
  const prevName = previous.sellerName?.trim() || "";
  const remoteProduct = remote.product?.trim() || "";
  const prevProduct = previous.product?.trim() || "";

  const sellerName =
    remoteName && remoteName !== "Usuario" ? remoteName : prevName || remoteName;
  const product = remoteProduct ? remoteProduct : prevProduct || "";

  return {
    ...remote,
    sellerName: sellerName || "Usuario",
    seller: {
      name: sellerName || remote.seller?.name || previous.seller?.name || "Usuario",
    },
    product: product || "",
    // Debe respetar el valor remoto para permitir que "no leídos" vuelva a 0.
    unreadCount: Number.isFinite(remote.unreadCount)
      ? remote.unreadCount
      : previous.unreadCount,
  };
}

export function replaceOptimisticMessage(
  list: ChatMessage[],
  optimisticId: string,
  persisted: ChatMessage,
): ChatMessage[] {
  const filtered = list.filter((message) => message.id !== optimisticId);
  return appendMessageSafe(filtered, persisted);
}

export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
