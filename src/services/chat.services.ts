import { authService } from "@/src/services/auth";
import { ChatConversation, ChatMessage } from "@/src/types/chat.types";

type ApiRecord = Record<string, unknown>;

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

function parseJwtPayload(token: string | null): Record<string, unknown> | null {
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

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "string") return data;
  if (isRecord(data) && typeof data.message === "string") return data.message;
  return fallback;
}

function getDataArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.data)) return data.data;
  return [];
}

function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getParticipantId(record: ApiRecord): string {
  return String(record.id ?? record.userId ?? record._id ?? "");
}

function getParticipantName(record: ApiRecord): string {
  return (
    getString(record.name) ||
    getString(record.fullName) ||
    getString(record.username) ||
    getString(record.email)
  );
}

function getProductLabel(record: ApiRecord): string {
  const direct = getString(record.productTitle) || getString(record.productName);
  if (direct) return direct;
  if (typeof record.product === "string") return record.product;
  if (isRecord(record.product)) {
    return (
      getString(record.product.title) ||
      getString(record.product.name) ||
      getString(record.product.description)
    );
  }
  return "";
}

function formatTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizeConversation(raw: ApiRecord): ChatConversation {
  const row = asRecord(raw.conversation);
  const rowRecord = Object.keys(row).length > 0 ? row : raw;
  const participantCandidates: unknown[] = [
    ...(Array.isArray(raw.participants) ? raw.participants : []),
    ...(Array.isArray(rowRecord.participants) ? rowRecord.participants : []),
    ...(Array.isArray(raw.users) ? raw.users : []),
    ...(Array.isArray(rowRecord.users) ? rowRecord.users : []),
    raw.user,
    rowRecord.user,
    raw.otherUser,
    rowRecord.otherUser,
    raw.participant,
    rowRecord.participant,
  ];
  const participants: ApiRecord[] = participantCandidates.filter(isRecord);

  const currentUserId = getCurrentUserIdFromToken();
  const otherParticipant =
    participants.find((p) => getParticipantId(p) !== currentUserId) ??
    participants[0] ??
    null;

  const otherName = otherParticipant ? getParticipantName(otherParticipant) : "";
  const ownParticipant =
    participants.find((p) => getParticipantId(p) === currentUserId) ?? null;
  const ownName =
    getString(ownParticipant?.name) || getString(ownParticipant?.fullName) || "Tú";

  const participantIds = participants
    .map((p) => getParticipantId(p))
    .filter(Boolean);

  const productLabel = getProductLabel(rowRecord) || getProductLabel(raw);

  return {
    id: String(rowRecord.id ?? rowRecord._id ?? ""),
    sellerName: String(otherName || "Usuario"),
    sellerId: otherParticipant ? getParticipantId(otherParticipant) || undefined : undefined,
    seller: { name: String(otherName || "Usuario") },
    customer: String(ownName),
    customerId: ownParticipant ? getParticipantId(ownParticipant) || undefined : currentUserId ?? undefined,
    participantIds,
    product: String(productLabel),
    lastMessage: String(
      (isRecord(rowRecord.lastMessage) ? rowRecord.lastMessage.content : null) ??
        rowRecord.lastMessage ??
        (isRecord(raw.lastMessage) ? raw.lastMessage.content : null) ??
        raw.lastMessage ??
        "",
    ),
    timestamp: String(
      (isRecord(rowRecord.lastMessage) ? rowRecord.lastMessage.createdAt : null) ??
        rowRecord.updatedAt ??
        rowRecord.createdAt ??
        "",
    ),
    unreadCount: Number(raw.unreadCount ?? rowRecord.unreadCount ?? 0) || 0,
  };
}

function normalizeMessage(
  raw: ApiRecord,
  conversationId: string,
  currentUserId?: string | null,
): ChatMessage {
  const sender = asRecord(raw.sender);
  const senderId = String(sender.id ?? raw.senderId ?? "");
  const mine = Boolean(currentUserId && senderId && senderId === currentUserId);
  const createdAtValue = raw.createdAt;
  const createdAt =
    typeof createdAtValue === "string" || typeof createdAtValue === "number"
      ? new Date(createdAtValue).getTime()
      : Date.now();
  const safeCreatedAt = Number.isFinite(createdAt) ? createdAt : Date.now();

  return {
    id: String(raw.id ?? raw._id ?? `${conversationId}-${safeCreatedAt}`),
    conversationId: String(raw.conversationId ?? conversationId),
    senderId: senderId || undefined,
    senderName:
      getString(sender.name) || getString(sender.fullName) || getString(sender.email) || undefined,
    isRead: Boolean(raw.isRead),
    from: mine ? "customer" : "seller",
    content: String(raw.content ?? ""),
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
    const message = getErrorMessage(data, "Error consultando chat.");
    throw new Error(message);
  }
  return data;
}

async function requestPost(path: string, body: Record<string, unknown>) {
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
    const message = getErrorMessage(data, "Error enviando datos de chat.");
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
    const list = getDataArray(data);

    return list
      .filter(isRecord)
      .map((row) => normalizeConversation(row))
      .filter((conversation: ChatConversation) => Boolean(conversation.id));
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const encodedId = encodeURIComponent(conversationId);
    const data = await requestGet(`/chat/conversation/${encodedId}/messages`);
    const currentUserId = getCurrentUserIdFromToken();
    const list = getDataArray(data);

    return list
      .filter(isRecord)
      .map((row) => normalizeMessage(row, conversationId, currentUserId));
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
