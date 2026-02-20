import { authService } from "@/src/services/auth";
import { ChatConversation, ChatMessage } from "@/src/types/chat.types";

type ApiRecord = Record<string, any>;

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "https://back-0o27.onrender.com"
  );
}

function getToken(): string | null {
  return authService.getToken?.() || null;
}

function assertToken(): string {
  const token = getToken();
  if (!token) throw new Error("NO_AUTH");
  return token;
}

function parseJwtPayload(token: string | null): Record<string, any> | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getCurrentUserIdFromToken(): string | null {
  const payload = parseJwtPayload(getToken());
  const id = payload?.id ?? payload?.sub ?? payload?.userId ?? null;
  return id ? String(id) : null;
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  const isJson = response.headers.get("content-type")?.includes("application/json");
  return isJson && text ? JSON.parse(text) : text;
}

function formatTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizeConversation(raw: ApiRecord): ChatConversation {
  const row = raw?.conversation ?? raw;
  const participants: ApiRecord[] = Array.isArray(raw?.participants)
    ? raw.participants
    : Array.isArray(row?.participants)
      ? row.participants
      : [];

  const currentUserId = getCurrentUserIdFromToken();
  const otherParticipant =
    participants.find((p) => String(p?.id ?? p?.userId ?? "") !== currentUserId) ??
    participants[0] ??
    null;

  const otherName =
    otherParticipant?.name ?? otherParticipant?.fullName ?? otherParticipant?.email ?? "Usuario";
  const ownParticipant =
    participants.find((p) => String(p?.id ?? p?.userId ?? "") === currentUserId) ?? null;
  const ownName = ownParticipant?.name ?? ownParticipant?.fullName ?? "Tú";

  const participantIds = participants
    .map((p) => String(p?.id ?? p?.userId ?? ""))
    .filter(Boolean);

  return {
    id: String(row?.id ?? row?._id ?? ""),
    sellerName: String(otherName),
    sellerId: otherParticipant?.id ? String(otherParticipant.id) : undefined,
    seller: { name: String(otherName) },
    customer: String(ownName),
    customerId: ownParticipant?.id ? String(ownParticipant.id) : currentUserId ?? undefined,
    participantIds,
    product: String(row?.product ?? row?.productTitle ?? "Chat privado"),
    lastMessage: String(
      row?.lastMessage?.content ??
        row?.lastMessage ??
        raw?.lastMessage?.content ??
        raw?.lastMessage ??
        "",
    ),
    timestamp: String(row?.updatedAt ?? row?.createdAt ?? "Ahora"),
    unreadCount: Number(raw?.unreadCount ?? row?.unreadCount ?? 0) || 0,
  };
}

function normalizeMessage(
  raw: ApiRecord,
  conversationId: string,
  currentUserId?: string | null,
): ChatMessage {
  const sender = raw?.sender ?? {};
  const senderId = String(sender?.id ?? raw?.senderId ?? "");
  const mine = Boolean(currentUserId && senderId && senderId === currentUserId);
  const createdAt = new Date(raw?.createdAt ?? Date.now()).getTime();
  const safeCreatedAt = Number.isFinite(createdAt) ? createdAt : Date.now();

  return {
    id: String(raw?.id ?? raw?._id ?? `${conversationId}-${safeCreatedAt}`),
    conversationId: String(raw?.conversationId ?? conversationId),
    senderId: senderId || undefined,
    senderName: sender?.name ?? sender?.fullName ?? sender?.email ?? undefined,
    isRead: Boolean(raw?.isRead),
    from: mine ? "customer" : "seller",
    content: String(raw?.content ?? ""),
    time: formatTime(safeCreatedAt),
    createdAt: safeCreatedAt,
  };
}

async function requestGet(path: string) {
  const token = assertToken();
  const base = getApiBaseUrl();
  const response = await fetch(`${base}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : (data as any)?.message || "Error consultando chat.";
    throw new Error(message);
  }
  return data;
}

async function requestPost(path: string, body: Record<string, any>) {
  const token = assertToken();
  const base = getApiBaseUrl();
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : (data as any)?.message || "Error enviando datos de chat.";
    throw new Error(message);
  }
  return data;
}

export const chatService = {
  isAuthenticated(): boolean {
    return Boolean(getToken());
  },

  getSocketUrl(): string {
    return getApiBaseUrl();
  },

  getSocketToken(): string | null {
    return getToken();
  },

  getCurrentUserId(): string | null {
    return getCurrentUserIdFromToken();
  },

  normalizeSocketMessage(raw: ApiRecord, fallbackConversationId: string): ChatMessage | null {
    const conversationId = String(raw?.conversationId ?? fallbackConversationId ?? "");
    if (!conversationId) return null;
    return normalizeMessage(raw, conversationId, getCurrentUserIdFromToken());
  },

  async getConversations(): Promise<ChatConversation[]> {
    const data = await requestGet("/chat/my-conversations");
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
        ? (data as any).data
        : [];

    return list
      .map((row: ApiRecord) => normalizeConversation(row))
      .filter((conversation: ChatConversation) => Boolean(conversation.id));
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const encodedId = encodeURIComponent(conversationId);
    const data = await requestGet(`/chat/conversation/${encodedId}/messages`);
    const currentUserId = getCurrentUserIdFromToken();
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
        ? (data as any).data
        : [];

    return list.map((row: ApiRecord) =>
      normalizeMessage(row, conversationId, currentUserId),
    );
  },

  async createConversation(payload: {
    type: "PRIVATE";
    participantIds: string[];
  }): Promise<ChatConversation> {
    const created = await requestPost("/chat/conversation", payload);
    return normalizeConversation(created as ApiRecord);
  },

  async sendMessage(payload: {
    conversationId: string;
    content: string;
  }): Promise<ChatMessage> {
    const created = await requestPost("/chat/message", payload);
    return normalizeMessage(
      created as ApiRecord,
      payload.conversationId,
      getCurrentUserIdFromToken(),
    );
  },
};
