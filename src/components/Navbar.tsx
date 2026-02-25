"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { useChat } from "@/src/context/ChatContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import { signOut } from "next-auth/react";
import { adminChatService } from "@/src/services/adminChat.services";
import { chatService } from "@/src/services/chat.services";
import type { UserSession } from "@/src/context/AuthContext";
import type { SocketLike } from "@/src/context/chat/useChatSocket";
import { useNotifications } from "@/src/context/NotificationContext";

const ADMIN_READ_CHATS_STORAGE_KEY = "admin_read_chats";
const CHAT_ALERT_DEBUG =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CHAT_ALERT_DEBUG === "true";

function logChatAlert(scope: string, payload?: unknown) {
  if (!CHAT_ALERT_DEBUG) return;
  if (typeof payload === "undefined") {
    console.log(`[ChatAlert][Navbar] ${scope}`);
    return;
  }
  console.log(`[ChatAlert][Navbar] ${scope}`, payload);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function getBooleanField(
  record: Record<string, unknown>,
  key: string,
): boolean {
  return Boolean(record[key]);
}

function loadAdminReadMarkers(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ADMIN_READ_CHATS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.entries(parsed).reduce<Record<string, number>>(
      (acc, [id, value]) => {
        const at = typeof value === "number" ? value : Number(value);
        if (id && Number.isFinite(at) && at > 0) acc[id] = at;
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
}

function hasPendingAdminChat(
  chat: {
    id: string;
    unreadCount: number;
    timestamp: string;
    lastMessage: string;
  },
  readMarkers: Record<string, number>,
): boolean {
  const hasActivity = Boolean(
    (chat.lastMessage || "").trim() || (chat.timestamp || "").trim(),
  );
  if (!hasActivity) return false;

  const readAt = readMarkers[chat.id] ?? 0;
  const chatTs = Date.parse(chat.timestamp || "");
  const hasValidTs = Number.isFinite(chatTs);

  if (!readAt) return true;

  if (chat.unreadCount > 0) {
    if (!hasValidTs) return true;
    return chatTs > readAt;
  }

  if (!hasValidTs) return false;
  return chatTs > readAt;
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

type PendingChatLike = {
  id: string;
  unreadCount: number;
  timestamp: string;
  lastMessage?: string;
};

function buildPendingSignature(chats: PendingChatLike[]): string {
  return chats
    .map((chat) => {
      const normalizedMessage = (chat.lastMessage || "").trim();
      return `${chat.id}|${chat.unreadCount}|${chat.timestamp}|${normalizedMessage}`;
    })
    .sort()
    .join("::");
}

const Navbar = (): ReactElement => {
  const { dataUser, logout } = useAuth();
  const router = useRouter();
  const session = dataUser as UserSession | null;
  const userRecord = asRecord(session?.user);
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [openNotifications, setOpenNotifications] = useState(false);

  const { cartItems } = useCart();
  const { openChat, conversations, activeConversation, isChatOpen } = useChat();
  const itemsCart = cartItems.length;
  const [isAdminSupportOpen, setIsAdminSupportOpen] = useState(false);
  const [adminSubject, setAdminSubject] = useState("");
  const [adminDetail, setAdminDetail] = useState("");
  const [isLaunchingAdminChat, setIsLaunchingAdminChat] = useState(false);
  const [adminUnreadConversations, setAdminUnreadConversations] = useState(0);
  const [userRealtimePendingCount, setUserRealtimePendingCount] = useState(0);
  const adminUnreadReadyRef = useRef(false);
  const previousAdminPendingSignatureRef = useRef("");
  const previousAdminPendingCountRef = useRef(0);
  // Rastrea unreadCount por conversación para evitar auto-alertas del admin.
  const previousAdminPendingUnreadsRef = useRef<Record<string, number>>({});
  const adminRealtimePendingIdsRef = useRef<Set<string>>(new Set());
  const userRealtimePendingIdsRef = useRef<Set<string>>(new Set());
  const socketRef = useRef<SocketLike | null>(null);
  const isChatOpenRef = useRef(isChatOpen);
  const activeConversationIdRef = useRef(activeConversation?.id);
  // Dedup: evita mostrar 2 toasts si socket y custom event disparan casi juntos.
  const lastNotifyTimestampRef = useRef(0);

  const safeName =
    getStringField(userRecord, "name") ||
    getStringField(userRecord, "fullName") ||
    getStringField(userRecord, "username") ||
    "";

  const isLogged =
    Boolean(getStringField(userRecord, "email")) ||
    Boolean(session?.email) ||
    Boolean(session?.user) ||
    Boolean(session);

  const AUTH_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

  const decodeIsAdminFromJwt = (token: string | null): boolean => {
    if (!token) return false;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "=",
      );

      const json = atob(padded);
      const payload = JSON.parse(json);
      return Boolean(payload?.isAdmin);
    } catch {
      return false;
    }
  };

  // Fallback: obtener userId directamente del JWT en localStorage.
  const getCurrentUserIdFromJwt = (): string => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      const token = parsed?.token;
      if (!token || typeof token !== "string") return "";
      const parts = token.split(".");
      if (parts.length !== 3) return "";
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "=",
      );
      const payload = JSON.parse(atob(padded));
      return String(payload?.id ?? payload?.sub ?? payload?.userId ?? "");
    } catch {
      return "";
    }
  };

  const isAdminUser = useMemo(() => {
    const userFlag =
      getBooleanField(userRecord, "isAdmin") ||
      Boolean((session as UserSession | null)?.user?.isAdmin);
    if (userFlag) return true;

    const fallbackToken = getStringField(userRecord, "token");
    const token = session?.token ?? (fallbackToken || null);
    return decodeIsAdminFromJwt(token);
  }, [session, userRecord]);

  const unreadConversationsUserFromContext = useMemo(
    () =>
      conversations.filter((conversation) => conversation.unreadCount > 0)
        .length,
    [conversations],
  );
  const firstPendingUserConversationId = useMemo(() => {
    const unreadConversations = conversations.filter(
      (conversation) => conversation.unreadCount > 0,
    );
    unreadConversations.sort(
      (a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp),
    );
    return unreadConversations[0]?.id ?? null;
  }, [conversations]);

  // Ref to detect increases in contextual unread count (socket-independent path for users).
  const previousUserUnreadCountRef = useRef(-1);

  const adminRealtimePendingCount = adminRealtimePendingIdsRef.current.size;
  const navbarUnreadChats = isAdminUser
    ? Math.max(adminUnreadConversations, adminRealtimePendingCount)
    : Math.max(unreadConversationsUserFromContext, userRealtimePendingCount);
  const hasNavbarUnread = navbarUnreadChats > 0;

  const notifyNewMessage = () => {
    const now = Date.now();
    // Dedup: si ya se mostró un toast en los últimos 800ms, no mostrar otro.
    if (now - lastNotifyTimestampRef.current < 800) {
      logChatAlert("notifyNewMessage:dedup:skipped");
      return;
    }
    lastNotifyTimestampRef.current = now;
    logChatAlert("notifyNewMessage:toast");
    showToast.info("Mensaje nuevo recibido", {
      duration: 2200,
      progress: true,
      position: "top-right",
      transition: "popUp",
      icon: "",
      sound: true,
    });
  };

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);
  useEffect(() => {
    activeConversationIdRef.current = activeConversation?.id;
  }, [activeConversation?.id]);

  useEffect(() => {
    let canceled = false;

    const loadAdminUnread = async () => {
      if (!isLogged || !isAdminUser) {
        if (!canceled) setAdminUnreadConversations(0);
        logChatAlert("adminPoll:skip", { isLogged, isAdminUser });
        return;
      }
      try {
        const chats = await adminChatService.getConversations();
        if (canceled) return;
        const readMarkers = loadAdminReadMarkers();
        const pendingChats = chats.filter((chat) =>
          hasPendingAdminChat(chat, readMarkers),
        );
        const pending = pendingChats.length;
        setAdminUnreadConversations(pending);
        logChatAlert("adminPoll:data", {
          totalChats: chats.length,
          pending,
          pendingIds: pendingChats.map((chat) => chat.id),
        });
        if (socketRef.current?.connected) {
          chats.forEach((chat) => {
            if (chat.id) socketRef.current?.emit("joinConversation", chat.id);
          });
          logChatAlert("adminPoll:rejoinRooms", {
            socketConnected: socketRef.current.connected,
            rooms: chats.map((chat) => chat.id).filter(Boolean),
          });
        }

        const currentSignature = buildPendingSignature(pendingChats);
        const currentUnreads: Record<string, number> = {};
        pendingChats.forEach((chat) => {
          currentUnreads[chat.id] = chat.unreadCount;
        });

        if (!adminUnreadReadyRef.current) {
          adminUnreadReadyRef.current = true;
          previousAdminPendingSignatureRef.current = currentSignature;
          previousAdminPendingCountRef.current = pending;
          previousAdminPendingUnreadsRef.current = currentUnreads;
        } else {
          const prevUnreads = previousAdminPendingUnreadsRef.current;
          // Solo alertar si apareció conversación nueva en pending O si unreadCount subió.
          // Evita auto-alertas cuando el admin envía su propio mensaje
          // (cambia lastMessage/timestamp pero unreadCount no sube).
          const hasNewConversation = pendingChats.some(
            (chat) => !(chat.id in prevUnreads),
          );
          const hasIncreasedUnread = pendingChats.some(
            (chat) =>
              chat.id in prevUnreads &&
              chat.unreadCount > (prevUnreads[chat.id] ?? 0),
          );
          const shouldAlert =
            pending > 0 && (hasNewConversation || hasIncreasedUnread);
          previousAdminPendingSignatureRef.current = currentSignature;
          previousAdminPendingCountRef.current = pending;
          previousAdminPendingUnreadsRef.current = currentUnreads;
          if (!shouldAlert) return;
          notifyNewMessage();
        }
      } catch (error) {
        logChatAlert("adminPoll:error", error);
      }
    };

    void loadAdminUnread();
    const intervalId = window.setInterval(() => {
      void loadAdminUnread();
    }, 2_000);

    return () => {
      canceled = true;
      window.clearInterval(intervalId);
    };
  }, [isAdminUser, isLogged]);

  // Poll directo para usuarios: espejo del admin poll.
  // Funciona sin socket y sin ChatContext, solo HTTP.
  useEffect(() => {
    if (isAdminUser || !isLogged) return;

    let canceled = false;
    let initialized = false;
    const prevUnreads: Record<string, number> = {};

    const pollUserChats = async () => {
      try {
        const chats = await chatService.getConversations();
        if (canceled) return;

        const unreadChats = chats.filter((c) => c.unreadCount > 0);

        if (!initialized) {
          initialized = true;
          unreadChats.forEach((c) => {
            prevUnreads[c.id] = c.unreadCount;
          });
          logChatAlert("userPoll:init", { unreadCount: unreadChats.length });
          return;
        }

        const hasNewConversation = unreadChats.some(
          (c) => !(c.id in prevUnreads),
        );
        const hasIncreasedUnread = unreadChats.some(
          (c) =>
            c.id in prevUnreads && c.unreadCount > (prevUnreads[c.id] ?? 0),
        );

        if (hasNewConversation || hasIncreasedUnread) {
          logChatAlert("userPoll:newMessage", {
            hasNewConversation,
            hasIncreasedUnread,
          });
          notifyNewMessage();
        }

        // Actualizar baseline: solo conversaciones con unread activo.
        Object.keys(prevUnreads).forEach((id) => {
          if (!unreadChats.some((c) => c.id === id)) delete prevUnreads[id];
        });
        unreadChats.forEach((c) => {
          prevUnreads[c.id] = c.unreadCount;
        });
      } catch (error) {
        logChatAlert("userPoll:error", error);
      }
    };

    void pollUserChats();
    const intervalId = window.setInterval(() => {
      if (!canceled) void pollUserChats();
    }, 3_000);

    return () => {
      canceled = true;
      window.clearInterval(intervalId);
    };
  }, [isAdminUser, isLogged]);

  useEffect(() => {
    let canceled = false;
    if (!isLogged) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      adminRealtimePendingIdsRef.current.clear();
      userRealtimePendingIdsRef.current.clear();
      setUserRealtimePendingCount(0);
      logChatAlert("socket:skip:notLogged");
      return;
    }
    if (process.env.NEXT_PUBLIC_ENABLE_CHAT_SOCKET === "false") {
      logChatAlert("socket:disabledByEnv");
      return;
    }

    const resolveConversationIds = async (): Promise<string[]> => {
      try {
        if (isAdminUser) {
          const chats = await adminChatService.getConversations();
          logChatAlert("resolveConversationIds:admin", {
            count: chats.length,
            ids: chats.map((chat) => chat.id),
          });
          return chats.map((chat) => chat.id).filter(Boolean);
        }
        const chats = await chatService.getConversations();
        logChatAlert("resolveConversationIds:user", {
          count: chats.length,
          ids: chats.map((chat) => chat.id),
        });
        return chats.map((chat) => chat.id).filter(Boolean);
      } catch (error) {
        if (error instanceof Error && error.message === "NO_AUTH") return [];
        logChatAlert("resolveConversationIds:error", error);
        return [];
      }
    };

    const connectSocket = async () => {
      try {
        if (socketRef.current || canceled) return;
        const token = chatService.getSocketToken();
        if (!token) {
          logChatAlert("socket:skip:noToken");
          return;
        }

        const dynamicImport = new Function(
          "specifier",
          "return import(specifier)",
        ) as (specifier: string) => Promise<unknown>;
        const socketClientModule = (await dynamicImport(
          "socket.io-client",
        )) as {
          io?: (url: string, options?: Record<string, unknown>) => SocketLike;
        };
        const ioFactory = socketClientModule?.io;
        if (!ioFactory || canceled) {
          logChatAlert("socket:skip:noFactoryOrCanceled", {
            hasFactory: Boolean(ioFactory),
            canceled,
          });
          return;
        }

        const socket = ioFactory(chatService.getSocketUrl(), {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
        });

        socket.on("connect", async () => {
          logChatAlert("socket:connect", {
            isAdminUser,
            socketConnected: socket.connected,
          });
          try {
            const ids = await resolveConversationIds();
            if (canceled) return;
            ids.forEach((id) => {
              socket.emit("joinConversation", id);
            });
            logChatAlert("socket:joinRooms", { ids });
          } catch {
            // noop
          }
        });
        socket.on("disconnect", (reason: unknown) => {
          logChatAlert("socket:disconnect", { reason });
        });
        socket.on("connect_error", (error: unknown) => {
          logChatAlert("socket:connect_error", error);
        });

        socket.on("newMessage", (...args: unknown[]) => {
          const payload = args[0];
          if (!isRecord(payload)) return;
          const conversationId = String(payload.conversationId ?? "");
          if (!conversationId) return;

          const sender = isRecord(payload.sender) ? payload.sender : null;
          const senderId = String(
            sender?.id ?? payload.senderId ?? payload.userId ?? "",
          );
          const currentUserId =
            chatService.getCurrentUserId() || getCurrentUserIdFromJwt();
          logChatAlert("socket:newMessage:raw", {
            isAdminUser,
            conversationId,
            senderId,
            currentUserId,
            activeConversationId: activeConversationIdRef.current ?? null,
            isChatOpen: isChatOpenRef.current,
            payload,
          });
          if (senderId && senderId === currentUserId) {
            logChatAlert("socket:newMessage:ignoredOwnMessage", {
              conversationId,
              senderId,
            });
            return;
          }

          if (!isAdminUser) {
            // No contar mensajes de conversaciones que el usuario borró/ocultó.
            try {
              const rawHidden = window.localStorage.getItem(
                "chat_hidden_conversations",
              );
              if (rawHidden) {
                const hidden: unknown = JSON.parse(rawHidden);
                if (
                  Array.isArray(hidden) &&
                  hidden.some((id) => String(id) === conversationId)
                ) {
                  logChatAlert("socket:newMessage:ignoredHidden", {
                    conversationId,
                  });
                  return;
                }
              }
            } catch {
              /* ignorar */
            }

            // No sumar al badge ni tostar si el usuario ya tiene esa conversación abierta.
            const isOpenConversation =
              isChatOpenRef.current &&
              activeConversationIdRef.current === conversationId;
            if (!isOpenConversation) {
              userRealtimePendingIdsRef.current.add(conversationId);
              setUserRealtimePendingCount(
                userRealtimePendingIdsRef.current.size,
              );
              logChatAlert("socket:newMessage:userPendingUpdated", {
                conversationId,
                pendingCount: userRealtimePendingIdsRef.current.size,
              });
              notifyNewMessage();
            }
            return;
          }

          adminRealtimePendingIdsRef.current.add(conversationId);
          setAdminUnreadConversations((prev) =>
            Math.max(prev, adminRealtimePendingIdsRef.current.size),
          );
          logChatAlert("socket:newMessage:adminPendingUpdated", {
            conversationId,
            pendingCount: adminRealtimePendingIdsRef.current.size,
          });
          // Toast lo maneja exclusivamente el admin poll (cada 2s) con detección
          // de unreadCount. Evita auto-alertas ya que el senderId check del socket
          // puede fallar si el backend no incluye sender info correctamente.
        });

        socketRef.current = socket;
        logChatAlert("socket:mounted");
      } catch (error) {
        logChatAlert("socket:connectError", error);
      }
    };

    void connectSocket();
    const joinIntervalId = window.setInterval(async () => {
      if (canceled || !socketRef.current?.connected) return;
      const ids = await resolveConversationIds();
      ids.forEach((id) => socketRef.current?.emit("joinConversation", id));
      logChatAlert("socket:joinRooms:interval", { ids });
    }, 2_000);

    return () => {
      canceled = true;
      window.clearInterval(joinIntervalId);
      socketRef.current?.disconnect();
      socketRef.current = null;
      logChatAlert("socket:cleanup");
    };
  }, [isAdminUser, isLogged]);

  useEffect(() => {
    if (isAdminUser) return;
    const activeId = activeConversation?.id;
    if (!activeId) return;
    // Clear pending when the conversation is open OR when the modal is closed
    // (user was reading it and then dismissed the modal).
    if (!userRealtimePendingIdsRef.current.has(activeId)) return;
    userRealtimePendingIdsRef.current.delete(activeId);
    setUserRealtimePendingCount(userRealtimePendingIdsRef.current.size);
    logChatAlert("userPending:cleared", {
      conversationId: activeId,
      isChatOpen,
      pendingCount: userRealtimePendingIdsRef.current.size,
    });
  }, [activeConversation?.id, isAdminUser, isChatOpen]);

  // Custom event de ChatContext.useChatSocket — garantiza badge + toast aunque
  // el socket del Navbar no esté conectado. El dedup en notifyNewMessage evita
  // toasts dobles si ambas rutas disparan al mismo tiempo.
  useEffect(() => {
    if (isAdminUser || !isLogged) return;

    const handleChatNewMessage = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationId?: string;
        senderId?: string;
      }>;
      const conversationId = customEvent.detail?.conversationId ?? "";
      if (!conversationId) return;

      const currentUserId =
        chatService.getCurrentUserId() || getCurrentUserIdFromJwt();
      const senderId = customEvent.detail?.senderId ?? "";
      if (senderId && senderId === currentUserId) return;

      // Ignorar conversaciones ocultas.
      try {
        const rawHidden = window.localStorage.getItem(
          "chat_hidden_conversations",
        );
        if (rawHidden) {
          const hidden: unknown = JSON.parse(rawHidden);
          if (
            Array.isArray(hidden) &&
            hidden.some((id) => String(id) === conversationId)
          )
            return;
        }
      } catch {
        /* ignorar */
      }

      logChatAlert("user:customEvent:newMessage", { conversationId, senderId });
      // No sumar al badge ni tostar si el usuario ya tiene esa conversación abierta.
      const isOpenConversation =
        isChatOpenRef.current &&
        activeConversationIdRef.current === conversationId;
      if (!isOpenConversation) {
        userRealtimePendingIdsRef.current.add(conversationId);
        setUserRealtimePendingCount(userRealtimePendingIdsRef.current.size);
        notifyNewMessage();
      }
    };

    window.addEventListener(
      "retrogarage:chat-new-message",
      handleChatNewMessage,
    );
    return () => {
      window.removeEventListener(
        "retrogarage:chat-new-message",
        handleChatNewMessage,
      );
    };
  }, [isAdminUser, isLogged]);

  // Camino seguro de notificación para usuarios: detecta incremento de no-leídos
  // via el estado del contexto (funciona aunque el socket falle).
  useEffect(() => {
    if (isAdminUser || !isLogged) {
      previousUserUnreadCountRef.current = -1;
      return;
    }
    if (previousUserUnreadCountRef.current === -1) {
      // Primera inicialización: marcar baseline sin tostar.
      previousUserUnreadCountRef.current = unreadConversationsUserFromContext;
      return;
    }
    if (
      unreadConversationsUserFromContext > previousUserUnreadCountRef.current
    ) {
      logChatAlert("user:unreadContext:increased", {
        prev: previousUserUnreadCountRef.current,
        next: unreadConversationsUserFromContext,
      });
      notifyNewMessage();
    }
    previousUserUnreadCountRef.current = unreadConversationsUserFromContext;
  }, [isAdminUser, isLogged, unreadConversationsUserFromContext]);

  useEffect(() => {
    logChatAlert("navbarUnread:state", {
      isAdminUser,
      adminUnreadConversations,
      adminRealtimePendingCount: adminRealtimePendingIdsRef.current.size,
      unreadConversationsUserFromContext,
      userRealtimePendingCount,
      navbarUnreadChats,
      hasNavbarUnread,
      firstPendingUserConversationId,
    });
  }, [
    adminUnreadConversations,
    firstPendingUserConversationId,
    hasNavbarUnread,
    isAdminUser,
    navbarUnreadChats,
    unreadConversationsUserFromContext,
    userRealtimePendingCount,
  ]);

  const launchAdminSupportChat = async () => {
    const normalizedSubject = adminSubject.trim();
    if (!normalizedSubject) {
      showToast.warning("Debes indicar el asunto para iniciar el chat admin.", {
        duration: 2200,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      return;
    }

    setIsLaunchingAdminChat(true);
    try {
      const normalizedDetail = adminDetail.trim();
      const initialMessage = [
        "Hola, este es el chat auto respuesta de administrador.",
        `Asunto: ${normalizedSubject}`,
        normalizedDetail
          ? `Detalle: ${normalizedDetail}`
          : "Detalle: Sin detalle adicional.",
      ].join("\n");

      openChat({
        asParticipant: "customer",
        isSupportRequest: true,
        supportSubject: normalizedSubject,
        supportDetail: normalizedDetail,
        sellerName: "Administrador",
        product: normalizedSubject,
        initialMessage,
      });

      setIsAdminSupportOpen(false);
      setAdminSubject("");
      setAdminDetail("");
    } finally {
      setIsLaunchingAdminChat(false);
    }
  };

  // ✅ Decide destino al MOMENTO del click (con storage + fallback al token)
  const goToProfile = () => {
    let admin = false;

    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        admin =
          Boolean(parsed?.user?.isAdmin) ||
          decodeIsAdminFromJwt(parsed?.token ?? null);
      }
    } catch {
      admin = false;
    }

    const target = admin ? "/admin/dashboard" : "/dashboard";

    // Debug rápido (puedes quitar luego)
    console.log("[Navbar] goToProfile ->", { admin, target });

    router.push(target);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("google-login");
    sessionStorage.removeItem("google-register");

    logout();
    await signOut({ redirect: false });

    showToast.warning("¡Salida Exitosa!", {
      duration: 700,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });

    router.push("/");
  };

  const handleOpenUnreadChat = () => {
    logChatAlert("handleOpenUnreadChat:click", {
      isAdminUser,
      adminUnreadConversations,
      firstPendingUserConversationId,
      unreadConversationsUserFromContext,
    });
    if (isAdminUser) {
      if (adminUnreadConversations <= 0) {
        showToast.info("No hay chats nuevos.", {
          duration: 1800,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });
        return;
      }
      adminRealtimePendingIdsRef.current.clear();
      setAdminUnreadConversations(0);
      router.push("/admin/dashboard?section=chats&openChat=1");
      return;
    }
    // Abrimos primero una conversación con no leídos para limpiar la alerta al entrar.
    const firstUnreadConversation = conversations.find(
      (conversation) => conversation.unreadCount > 0,
    );
    if (firstPendingUserConversationId) {
      if (
        userRealtimePendingIdsRef.current.has(firstPendingUserConversationId)
      ) {
        userRealtimePendingIdsRef.current.delete(
          firstPendingUserConversationId,
        );
        setUserRealtimePendingCount(userRealtimePendingIdsRef.current.size);
      }
      openChat({ conversationId: firstPendingUserConversationId });
      return;
    }
    if (firstUnreadConversation?.id) {
      if (userRealtimePendingIdsRef.current.has(firstUnreadConversation.id)) {
        userRealtimePendingIdsRef.current.delete(firstUnreadConversation.id);
        setUserRealtimePendingCount(userRealtimePendingIdsRef.current.size);
      }
      openChat({ conversationId: firstUnreadConversation.id });
      return;
    }
    openChat();
  };

  return (
    <header className="w-full bg-amber-100 text-zinc-900 border-b-2 border-amber-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-wide text-amber-900 hover:text-emerald-900 transition"
        >
          RetroGarage™
        </Link>

        <nav className="hidden md:flex justify-center min-w-0">
          <ul className="flex items-center gap-5 lg:gap-8 text-sm font-extrabold tracking-wide text-amber-900 uppercase list-none m-0 p-0 whitespace-nowrap">
            <li>
              <Link
                href="/aboutus"
                className="font-handwritten border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
              >
                Sobre Nosotros
              </Link>
            </li>

            <li>
              <Link
                href="/product"
                className="font-handwritten border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
              >
                Productos Disponibles
              </Link>
            </li>

            <li>
              <Link
                href="/categories"
                className="font-handwritten border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
              >
                Categorias
              </Link>
            </li>

            {isLogged && (
              <li>
                <button
                  type="button"
                  onClick={() => setIsAdminSupportOpen(true)}
                  className="font-handwritten border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
                >
                  AYUDA
                </button>
              </li>
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-2 lg:gap-3 justify-self-end shrink-0 relative z-20">
          {isLogged && hasNavbarUnread && (
            <button
              type="button"
              onClick={handleOpenUnreadChat}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300 bg-amber-50 transition hover:bg-amber-200"
              aria-label="Mensajes"
              title="Mensajes"
            >
              <span className="text-lg">💬</span>
              <span
                className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-600 ring-2 ring-amber-50"
                aria-label={`${navbarUnreadChats} chats con mensajes nuevos`}
              />
            </button>
          )}

          {isLogged && (
            <div className="relative">
              {/* 🔔 BOTÓN */}
              <button
                type="button"
                onClick={() => setOpenNotifications((v) => !v)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-200 transition"
                aria-label="Notificaciones"
                title="Notificaciones"
              >
                <span className="text-lg">🔔</span>

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4.5 h-4.5 px-1 rounded-full bg-red-600 text-[10px] text-white flex items-center justify-center ring-2 ring-amber-50">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* 📬 DROPDOWN */}
              {openNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border-2 border-amber-300 bg-amber-50 shadow-lg z-50">
                  <div className="px-4 py-2 border-b border-amber-200 font-bold text-amber-900">
                    Notificaciones
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-zinc-600">
                      No tenés notificaciones todavía
                    </div>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markAsRead(n.id);
                          }}
                          className={`px-4 py-3 text-sm cursor-pointer border-b border-amber-100 hover:bg-amber-100 transition ${
                            !n.read
                              ? "font-bold text-amber-900"
                              : "text-zinc-700"
                          }`}
                        >
                          <p>{n.message}</p>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          <Link
            href="/cart"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-200 transition"
            aria-label="Carrito"
            title="Carrito"
          >
            <span className="text-amber-900 font-extrabold">🛒</span>
            {itemsCart > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-800 text-amber-50 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-emerald-900/30">
                {itemsCart}
              </span>
            )}
          </Link>

          {isLogged ? (
            <div className="flex items-center gap-3">
              {/* ✅ en vez de Link fijo, decide al click */}
              <button
                type="button"
                onClick={goToProfile}
                className="hidden sm:block max-w-35 truncate text-sm font-semibold text-zinc-800 hover:text-emerald-900 transition"
              >
                {safeName || "Mi Perfil"}
              </button>

              <button
                onClick={handleLogout}
                className="
                  px-3 py-2 rounded-xl border-2 border-amber-900
                  bg-amber-50 text-amber-900 font-bold text-sm
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                  hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                  active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                  transition
                "
              >
                Salida
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="
                  font-handwritten px-4 py-2 rounded-xl
                  border-2 border-amber-900
                  bg-amber-50 text-amber-900
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                  hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                  active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                  transition
                "
              >
                Acceso
              </Link>

              <Link
                href="/register"
                className="
                  font-handwritten px-4 py-2 rounded-xl
                  border-2 border-emerald-950
                  bg-emerald-900 text-amber-50
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                  hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                  active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                  transition
                "
              >
                Registro
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden border-t border-amber-300">
        <nav className="max-w-7xl mx-auto px-6 py-3">
          <ul className="flex items-center justify-center gap-6 text-xs font-extrabold tracking-widest uppercase text-amber-900 list-none m-0 p-0">
            <li>
              <Link
                href="/aboutus"
                className="hover:text-emerald-900 transition"
              >
                Sobre Nosotros
              </Link>
            </li>

            <li>
              <Link
                href="/product"
                className="hover:text-emerald-900 transition"
              >
                Productos
              </Link>
            </li>

            <li>
              <Link
                href="/categories"
                className="hover:text-emerald-900 transition"
              >
                Categorias
              </Link>
            </li>

            {isLogged && (
              <li>
                <button
                  type="button"
                  onClick={() => setIsAdminSupportOpen(true)}
                  className="hover:text-emerald-900 transition"
                >
                  AYUDA
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {isAdminSupportOpen && (
        <div
          className="fixed inset-0 z-95 flex items-center justify-center bg-zinc-900/60 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget)
              setIsAdminSupportOpen(false);
          }}
        >
          <section className="w-full max-w-lg rounded-2xl border-2 border-amber-900 bg-amber-100 p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
            <h3 className="font-display text-xl text-amber-900">
              Chat Administrador
            </h3>
            <p className="mt-2 text-sm text-zinc-700">
              Hola, este es el chat auto respuesta de administrador. Por favor,
              indica el asunto por el cual escribes.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="admin-chat-subject"
                  className="block text-xs font-extrabold uppercase tracking-widest text-amber-900 mb-1"
                >
                  Asunto
                </label>
                <input
                  id="admin-chat-subject"
                  type="text"
                  value={adminSubject}
                  onChange={(event) => setAdminSubject(event.target.value)}
                  className="w-full rounded-lg border-2 border-amber-900 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none"
                  placeholder="Ej: Problema con una compra"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-chat-detail"
                  className="block text-xs font-extrabold uppercase tracking-widest text-amber-900 mb-1"
                >
                  Detalle (opcional)
                </label>
                <textarea
                  id="admin-chat-detail"
                  rows={4}
                  value={adminDetail}
                  onChange={(event) => setAdminDetail(event.target.value)}
                  className="w-full resize-y rounded-lg border-2 border-amber-900 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none"
                  placeholder="Describe brevemente el motivo."
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdminSupportOpen(false)}
                className="px-3 py-2 rounded-lg border-2 border-amber-900 bg-white text-amber-900 text-xs font-extrabold uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLaunchingAdminChat}
                onClick={() => void launchAdminSupportChat()}
                className="px-3 py-2 rounded-lg border-2 border-emerald-900 bg-emerald-900 text-amber-50 text-xs font-extrabold uppercase tracking-widest disabled:opacity-60"
              >
                {isLaunchingAdminChat ? "Abriendo..." : "Iniciar chat"}
              </button>
            </div>
          </section>
        </div>
      )}
    </header>
  );
};

export default Navbar;
