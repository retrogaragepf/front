import { authService } from "@/src/services/auth";

export type AdminChatConversation = {
  id: string;
  deleteCandidates?: string[];
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: "active" | "blocked";
  unreadCount: number;
  lastMessage: string;
  timestamp: string;
};

type ApiRecord = Record<string, unknown>;

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "https://back-0o27.onrender.com"
  );
}

function getConfiguredPaths(envKey: string): string[] {
  const rawMap: Record<string, string | undefined> = {
    NEXT_PUBLIC_ADMIN_CHAT_ENDPOINTS: process.env.NEXT_PUBLIC_ADMIN_CHAT_ENDPOINTS,
    NEXT_PUBLIC_ADMIN_CHAT_DELETE_ENDPOINTS:
      process.env.NEXT_PUBLIC_ADMIN_CHAT_DELETE_ENDPOINTS,
    NEXT_PUBLIC_ADMIN_CHAT_BLOCK_ENDPOINTS:
      process.env.NEXT_PUBLIC_ADMIN_CHAT_BLOCK_ENDPOINTS,
  };
  const raw = rawMap[envKey];
  if (!raw) return [];

  return raw
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);
}

function uniquePaths(paths: string[]): string[] {
  return Array.from(new Set(paths));
}

function assertToken(): string {
  const token = authService.getToken?.() || null;
  if (!token) throw new Error("NO_AUTH");
  return token;
}

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null;
}

function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getNameFromRecord(record: ApiRecord): string {
  const directName =
    getString(record.name) ||
    getString(record.fullName) ||
    getString(record.username);

  if (directName) return directName;

  const firstName = getString(record.firstName);
  const lastName = getString(record.lastName);
  const joined = `${firstName} ${lastName}`.trim();
  if (joined) return joined;

  const nestedUser = asRecord(record.user);
  const nestedName =
    getString(nestedUser.name) ||
    getString(nestedUser.fullName) ||
    getString(nestedUser.username);
  if (nestedName) return nestedName;

  return getString(record.email);
}

function getEmailFromRecord(record: ApiRecord): string {
  const directEmail = getString(record.email) || getString(record.mail);
  if (directEmail) return directEmail;

  const nestedUser = asRecord(record.user);
  return getString(nestedUser.email) || getString(nestedUser.mail);
}

function getBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseJwtPayload(token: string | null): ApiRecord | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getCurrentUserId(token: string): string {
  const payload = parseJwtPayload(token);
  const nestedUser = asRecord(payload?.user);
  const id =
    payload?.id ??
    payload?.sub ??
    payload?.userId ??
    nestedUser.id ??
    nestedUser.userId ??
    "";
  return id ? String(id) : "";
}

function parseErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "string" && data) return data;
  if (isRecord(data) && typeof data.message === "string") return data.message;
  return fallback;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") && text ? JSON.parse(text) : text;
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const token = assertToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new HttpError(
      response.status,
      parseErrorMessage(data, `Error HTTP ${response.status}`),
    );
  }

  return data;
}

function getArrayPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.conversations)) return data.conversations;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function getParticipantId(record: ApiRecord): string {
  const id = record.id ?? record.userId ?? record._id ?? "";
  return String(id || "");
}

function getParticipantName(record: ApiRecord): string {
  return getNameFromRecord(record);
}

function getParticipantEmail(record: ApiRecord): string {
  return getEmailFromRecord(record);
}

function getParticipantStatus(record: ApiRecord): "active" | "blocked" {
  const isBlocked = getBoolean(record.isBanned) || getBoolean(record.isBlocked);
  return isBlocked ? "blocked" : "active";
}

function getConversationStatus(raw: ApiRecord, base: ApiRecord): "active" | "blocked" {
  const isBlocked =
    getBoolean(raw.isBlocked) ||
    getBoolean(base.isBlocked) ||
    getBoolean(raw.blocked) ||
    getBoolean(base.blocked) ||
    getBoolean(raw.isBanned) ||
    getBoolean(base.isBanned);
  return isBlocked ? "blocked" : "active";
}

function getConversationRecord(raw: ApiRecord): ApiRecord {
  const nested = asRecord(raw.conversation);
  return Object.keys(nested).length > 0 ? nested : raw;
}

function collectParticipants(raw: ApiRecord, base: ApiRecord): ApiRecord[] {
  const list: unknown[] = [
    ...(Array.isArray(raw.participants) ? raw.participants : []),
    ...(Array.isArray(base.participants) ? base.participants : []),
    ...(Array.isArray(raw.users) ? raw.users : []),
    ...(Array.isArray(base.users) ? base.users : []),
    raw.user,
    base.user,
    raw.otherUser,
    base.otherUser,
    raw.participant,
    base.participant,
    raw.customer,
    base.customer,
    raw.buyer,
    base.buyer,
  ];

  const participants = list.filter(isRecord);
  const byId = new Map<string, ApiRecord>();

  participants.forEach((participant) => {
    const id = getParticipantId(participant);
    if (!id) return;
    if (!byId.has(id)) byId.set(id, participant);
  });

  return Array.from(byId.values());
}

function collectParticipantIds(raw: ApiRecord, base: ApiRecord): string[] {
  const list: unknown[] = [
    ...(Array.isArray(raw.participantIds) ? raw.participantIds : []),
    ...(Array.isArray(base.participantIds) ? base.participantIds : []),
    ...(Array.isArray(raw.userIds) ? raw.userIds : []),
    ...(Array.isArray(base.userIds) ? base.userIds : []),
    ...(Array.isArray(raw.users) ? raw.users : []),
    ...(Array.isArray(base.users) ? base.users : []),
    raw.userId,
    base.userId,
    raw.customerId,
    base.customerId,
    raw.sellerId,
    base.sellerId,
  ];

  const ids = list
    .map((entry) => {
      if (typeof entry === "string" || typeof entry === "number") return String(entry);
      if (isRecord(entry)) return getParticipantId(entry);
      return "";
    })
    .filter(Boolean);

  return Array.from(new Set(ids));
}

function pickChatUser(participants: ApiRecord[], currentUserId: string): ApiRecord | null {
  if (participants.length === 0) return null;

  const nonAdmin = participants.find((participant) => {
    const role = getString(participant.role).toLowerCase();
    return role && role !== "admin";
  });

  if (nonAdmin) return nonAdmin;

  const notMe = participants.find(
    (participant) => getParticipantId(participant) !== currentUserId,
  );

  return notMe || participants[0];
}

function parseUnreadCount(raw: ApiRecord, base: ApiRecord): number {
  const value = raw.unreadCount ?? base.unreadCount ?? 0;
  const count = typeof value === "number" ? value : Number(value);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

function parseLastMessage(raw: ApiRecord, base: ApiRecord): string {
  const fromNested = asRecord(base.lastMessage);
  const fromRaw = asRecord(raw.lastMessage);

  return String(
    fromNested.content ??
      base.lastMessage ??
      fromRaw.content ??
      raw.lastMessage ??
      "",
  );
}

function parseTimestamp(raw: ApiRecord, base: ApiRecord): string {
  const fromNested = asRecord(base.lastMessage);
  const fromRaw = asRecord(raw.lastMessage);

  const value =
    fromNested.createdAt ??
    base.updatedAt ??
    base.createdAt ??
    fromRaw.createdAt ??
    raw.updatedAt ??
    raw.createdAt ??
    "";

  return String(value || "");
}

function parseSubject(raw: ApiRecord, base: ApiRecord): string {
  const value =
    raw.subject ??
    base.subject ??
    raw.asunto ??
    base.asunto ??
    raw.topic ??
    base.topic ??
    raw.title ??
    base.title ??
    raw.reason ??
    base.reason ??
    raw.productTitle ??
    base.productTitle ??
    raw.productName ??
    base.productName;

  if (typeof value === "string" && value.trim()) return value.trim();

  const productRecord = asRecord(base.product);
  const productSubject =
    getString(productRecord.title) ||
    getString(productRecord.name) ||
    getString(productRecord.description);
  if (productSubject) return productSubject;

  const firstMessage = parseLastMessage(raw, base);
  return firstMessage ? `Consulta: ${firstMessage.slice(0, 50)}` : "Sin asunto";
}

function parseSubjectFromMessage(content: string): string {
  if (!content) return "";
  const match = content.match(/asunto\s*:\s*([^\n\r]+)/i);
  return match?.[1]?.trim() || "";
}

function resolveConversationId(raw: ApiRecord, base: ApiRecord): string {
  const idCandidate =
    base.conversationId ??
    raw.conversationId ??
    base.chatId ??
    raw.chatId ??
    base.id ??
    raw.id ??
    base._id ??
    raw._id ??
    "";

  return String(idCandidate || "");
}

function collectConversationIds(raw: ApiRecord, base: ApiRecord): string[] {
  const ids = [
    base.conversationId,
    raw.conversationId,
    base.chatId,
    raw.chatId,
    base.id,
    raw.id,
    base._id,
    raw._id,
  ]
    .map((value) => (value ? String(value) : ""))
    .filter(Boolean);

  return Array.from(new Set(ids));
}

function isMissingName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return !normalized || normalized === "usuario";
}

function isMissingEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return !normalized || normalized === "email no disponible";
}

function isMissingSubject(subject: string): boolean {
  const normalized = subject.trim().toLowerCase();
  return !normalized || normalized === "sin asunto";
}

function shouldHydrateConversation(conversation: AdminChatConversation): boolean {
  return (
    isMissingName(conversation.userName) ||
    isMissingEmail(conversation.userEmail) ||
    isMissingSubject(conversation.subject)
  );
}

function normalizeConversation(raw: ApiRecord, currentUserId: string): AdminChatConversation | null {
  const base = getConversationRecord(raw);
  const resolvedIds = collectConversationIds(raw, base);
  const id = resolveConversationId(raw, base) || resolvedIds[0] || "";
  if (!id) return null;

  const participants = collectParticipants(raw, base);
  const participantIds = collectParticipantIds(raw, base);
  const userRecord = pickChatUser(participants, currentUserId);
  const fallbackUserId =
    participantIds.find((participantId) => participantId !== currentUserId) || "";

  const fallbackName = getString(raw.userName) || getString(base.userName) || "Usuario";
  const fallbackEmail =
    getString(raw.userEmail) || getString(base.userEmail) || "Email no disponible";

  const userName = userRecord ? getParticipantName(userRecord) || fallbackName : fallbackName;
  const userEmail = userRecord ? getParticipantEmail(userRecord) || fallbackEmail : fallbackEmail;
  const subject = parseSubject(raw, base);
  const conversationStatus = getConversationStatus(raw, base);
  const participantStatus = userRecord ? getParticipantStatus(userRecord) : "active";

  return {
    id,
    deleteCandidates: resolvedIds,
    userId: userRecord ? getParticipantId(userRecord) : fallbackUserId,
    userName,
    userEmail,
    subject,
    status: conversationStatus === "blocked" ? "blocked" : participantStatus,
    unreadCount: parseUnreadCount(raw, base),
    lastMessage: parseLastMessage(raw, base),
    timestamp: parseTimestamp(raw, base),
  };
}

async function tryMany(paths: string[], init?: RequestInit): Promise<unknown> {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      return await request(path, init);
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.status === 401 || error.status === 403) throw error;
        if (error.status === 404 || error.status === 405) {
          lastError = error;
          continue;
        }
      }
      lastError = error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("No se pudo completar la operación de chats.");
}

async function tryDeleteMany(paths: string[]): Promise<void> {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      await request(path, { method: "DELETE" });
      return;
    } catch (error) {
      if (error instanceof HttpError) {
        // Algunos endpoints responden 400/404/405/422 según el tipo de id.
        if ([400, 404, 405, 422].includes(error.status)) {
          lastError = error;
          continue;
        }
      }
      lastError = error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("No se pudo borrar la conversación.");
}

async function getConversationMessages(conversationId: string): Promise<ApiRecord[]> {
  const encodedId = encodeURIComponent(conversationId);
  const data = await tryMany([
    `/chat/admin/conversation/${encodedId}/messages`,
    `/chat/conversation/${encodedId}/messages`,
    `/chat/conversations/${encodedId}/messages`,
  ]);

  return getArrayPayload(data).filter(isRecord);
}

async function hydrateConversationFromMessages(
  conversation: AdminChatConversation,
  currentUserId: string,
): Promise<AdminChatConversation> {
  const shouldHydrate = shouldHydrateConversation(conversation);
  if (!shouldHydrate) return conversation;

  try {
    const messages = await getConversationMessages(conversation.id);
    if (messages.length === 0) return conversation;

    let nextName = conversation.userName;
    let nextEmail = conversation.userEmail;
    let nextSubject = conversation.subject;
    let nextUserId = conversation.userId;

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = asRecord(messages[i]);
      const sender = asRecord(message.sender);
      const senderId = String(
        sender.id ?? sender.userId ?? message.senderId ?? message.userId ?? "",
      );

      if (senderId && senderId === currentUserId) continue;

      if (isMissingName(nextName)) {
        const parsedName = getNameFromRecord(sender);
        if (parsedName) nextName = parsedName;
      }

      if (isMissingEmail(nextEmail)) {
        const parsedEmail = getEmailFromRecord(sender);
        if (parsedEmail) nextEmail = parsedEmail;
      }

      if (!nextUserId && senderId && senderId !== currentUserId) {
        nextUserId = senderId;
      }

      if (isMissingSubject(nextSubject)) {
        const content = getString(message.content);
        const parsedSubject = parseSubjectFromMessage(content);
        if (parsedSubject) nextSubject = parsedSubject;
      }

      if (
        !isMissingName(nextName) &&
        !isMissingEmail(nextEmail) &&
        !isMissingSubject(nextSubject)
      ) {
        break;
      }
    }

    return {
      ...conversation,
      userName: nextName,
      userEmail: nextEmail,
      subject: nextSubject,
      userId: nextUserId,
    };
  } catch {
    return conversation;
  }
}

export const adminChatService = {
  async getConversations(): Promise<AdminChatConversation[]> {
    const token = assertToken();
    const currentUserId = getCurrentUserId(token);

    const configured = getConfiguredPaths("NEXT_PUBLIC_ADMIN_CHAT_ENDPOINTS");
    const defaults = [
      "/chat/my-conversations",
      "/chat/conversations",
      "/chat/all-conversations",
      "/chat/conversations/admin",
    ];

    let data: unknown;
    try {
      // Probamos defaults primero para evitar ruido de endpoints viejos en .env.
      data = await tryMany(uniquePaths([...defaults, ...configured]));
    } catch (error) {
      if (error instanceof HttpError && (error.status === 404 || error.status === 405)) {
        throw new Error(
          "El backend no expone un endpoint de listado de chats admin. Configura NEXT_PUBLIC_ADMIN_CHAT_ENDPOINTS con la ruta correcta.",
        );
      }
      throw error;
    }

    const normalized = getArrayPayload(data)
      .filter(isRecord)
      .map((raw) => normalizeConversation(raw, currentUserId))
      .filter((row): row is AdminChatConversation => Boolean(row));

    const hydrated = await Promise.all(
      normalized.map((conversation) =>
        hydrateConversationFromMessages(conversation, currentUserId),
      ),
    );

    return hydrated;
  },

  async deleteConversation(conversationId: string, idCandidates: string[] = []): Promise<void> {
    const uniqueIds = Array.from(new Set([conversationId, ...idCandidates].filter(Boolean)));
    let lastError: unknown = null;

    for (const candidateId of uniqueIds) {
      const encodedId = encodeURIComponent(candidateId);
      const configured = getConfiguredPaths("NEXT_PUBLIC_ADMIN_CHAT_DELETE_ENDPOINTS")
        .map((path) => path.replace(":id", encodedId));
      const defaults = [
        `/chat/${encodedId}`,
        `/chat/support/${encodedId}`,
        `/chat/admin/conversation/${encodedId}`,
        `/chat/conversation/${encodedId}`,
        `/chat/conversations/${encodedId}`,
      ];

      try {
        await tryDeleteMany(uniquePaths([...defaults, ...configured]));
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof HttpError && (lastError.status === 404 || lastError.status === 405)) {
      throw new Error(
        "El backend no expone un endpoint para borrar conversaciones admin. Configura NEXT_PUBLIC_ADMIN_CHAT_DELETE_ENDPOINTS con la ruta correcta.",
      );
    }
    if (lastError instanceof Error) throw lastError;
    throw new Error("No se pudo borrar la conversación seleccionada.");
  },

  async blockConversation(conversationId: string, blocked: boolean): Promise<void> {
    const encodedId = encodeURIComponent(conversationId);
    const configured = getConfiguredPaths("NEXT_PUBLIC_ADMIN_CHAT_BLOCK_ENDPOINTS")
      .map((path) => path.replace(":id", encodedId));
    const defaults = blocked
      ? [`/chat/${encodedId}/block`]
      : [`/chat/${encodedId}/unblock`, `/chat/${encodedId}/block`];

    // Swagger define PATCH /chat/{id}/block; soportamos body flexible.
    const bodyVariants: Record<string, unknown>[] = [
      { blocked },
      { isBlocked: blocked },
      { status: blocked ? "blocked" : "active" },
      {},
    ];

    let lastError: unknown = null;
    for (const path of uniquePaths([...configured, ...defaults])) {
      for (const body of bodyVariants) {
        try {
          await request(path, {
            method: "PATCH",
            body: JSON.stringify(body),
          });
          return;
        } catch (error) {
          if (error instanceof HttpError) {
            if (error.status === 401 || error.status === 403) throw error;
            if (error.status === 404 || error.status === 405) {
              lastError = error;
              continue;
            }
          }
          lastError = error;
        }
      }
    }

    if (lastError instanceof HttpError && (lastError.status === 404 || lastError.status === 405)) {
      throw new Error(
        "El backend no expone un endpoint para bloquear conversaciones admin. Configura NEXT_PUBLIC_ADMIN_CHAT_BLOCK_ENDPOINTS con la ruta correcta.",
      );
    }

    if (lastError instanceof Error) throw lastError;
    throw new Error("No se pudo actualizar el bloqueo de la conversación.");
  },
};
