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

const ADMIN_READ_CHATS_STORAGE_KEY = "admin_read_chats";
const USER_READ_CHATS_STORAGE_KEY = "chat_read_markers";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function getStringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function getBooleanField(record: Record<string, unknown>, key: string): boolean {
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

function loadUserReadMarkers(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(USER_READ_CHATS_STORAGE_KEY);
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

function hasPendingUserChat(
  conversation: { id: string; unreadCount: number; timestamp: string },
  readMarkers: Record<string, number>,
): boolean {
  if (conversation.unreadCount > 0) return true;
  const readAt = readMarkers[conversation.id] ?? 0;
  if (!readAt) return false;
  const chatTs = Date.parse(conversation.timestamp || "");
  if (!Number.isFinite(chatTs)) return false;
  return chatTs > readAt;
}

function hasPendingAdminChat(
  chat: { id: string; unreadCount: number; timestamp: string; lastMessage: string },
  readMarkers: Record<string, number>,
): boolean {
  const hasActivity = Boolean((chat.lastMessage || "").trim() || (chat.timestamp || "").trim());
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

  const { cartItems } = useCart();
  const { openChat, conversations, isChatOpen } = useChat();
  const itemsCart = cartItems.length;
  const [isAdminSupportOpen, setIsAdminSupportOpen] = useState(false);
  const [adminSubject, setAdminSubject] = useState("");
  const [adminDetail, setAdminDetail] = useState("");
  const [isLaunchingAdminChat, setIsLaunchingAdminChat] = useState(false);
  const [adminUnreadConversations, setAdminUnreadConversations] = useState(0);
  const [userUnreadConversations, setUserUnreadConversations] = useState(0);
  const [firstPendingUserConversationId, setFirstPendingUserConversationId] = useState<string | null>(null);
  const adminUnreadReadyRef = useRef(false);
  const previousAdminPendingSignatureRef = useRef("");
  const previousAdminPendingCountRef = useRef(0);
  const userUnreadReadyRef = useRef(false);
  const previousUserPendingSignatureRef = useRef("");
  const previousUserPendingCountRef = useRef(0);

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
    () => {
      const readMarkers = loadUserReadMarkers();
      return conversations.filter((conversation) =>
        hasPendingUserChat(conversation, readMarkers),
      ).length;
    },
    [conversations],
  );

  const navbarUnreadChats = isAdminUser
    ? adminUnreadConversations
    : Math.max(userUnreadConversations, unreadConversationsUserFromContext);
  const hasNavbarUnread = navbarUnreadChats > 0;

  useEffect(() => {
    let canceled = false;

    const loadAdminUnread = async () => {
      if (!isLogged || !isAdminUser) {
        if (!canceled) setAdminUnreadConversations(0);
        return;
      }
      try {
        const chats = await adminChatService.getConversations();
        if (canceled) return;
        const readMarkers = loadAdminReadMarkers();
        const pendingChats = chats.filter((chat) => hasPendingAdminChat(chat, readMarkers));
        const pending = pendingChats.length;
        setAdminUnreadConversations(pending);

        const currentSignature = buildPendingSignature(pendingChats);

        if (!adminUnreadReadyRef.current) {
          adminUnreadReadyRef.current = true;
          previousAdminPendingSignatureRef.current = currentSignature;
          previousAdminPendingCountRef.current = pending;
        } else {
          const hasNewOrChangedPending =
            pending > 0 &&
            (currentSignature !== previousAdminPendingSignatureRef.current ||
              pending > previousAdminPendingCountRef.current);
          previousAdminPendingSignatureRef.current = currentSignature;
          previousAdminPendingCountRef.current = pending;
          if (!hasNewOrChangedPending) return;

          showToast.info("Mensaje nuevo recibido", {
            duration: 2200,
            progress: true,
            position: "top-right",
            transition: "popUp",
            icon: "",
            sound: true,
          });
        }
      } catch (error) {
        console.log("[Navbar] admin unread poll error", error);
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

  useEffect(() => {
    let canceled = false;

    const loadUserUnread = async () => {
      if (!isLogged || isAdminUser) {
        if (!canceled) {
          setUserUnreadConversations(0);
          setFirstPendingUserConversationId(null);
        }
        return;
      }

      try {
        const chats = await chatService.getConversations();
        if (canceled) return;

        const readMarkers = loadUserReadMarkers();
        const apiPendingChats = chats.filter((chat) => hasPendingUserChat(chat, readMarkers));
        const contextPendingChats = conversations.filter((chat) =>
          hasPendingUserChat(chat, readMarkers),
        );

        const mergedPendingById = new Map<string, PendingChatLike>();
        apiPendingChats.forEach((chat) => {
          mergedPendingById.set(chat.id, chat);
        });
        contextPendingChats.forEach((chat) => {
          const existing = mergedPendingById.get(chat.id);
          if (!existing) {
            mergedPendingById.set(chat.id, chat);
            return;
          }
          const nextTs = toTimestamp(chat.timestamp);
          const prevTs = toTimestamp(existing.timestamp);
          if (nextTs > prevTs || chat.unreadCount > existing.unreadCount) {
            mergedPendingById.set(chat.id, chat);
          }
        });

        const pendingChats = Array.from(mergedPendingById.values()).sort(
          (a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp),
        );
        const pendingCount = pendingChats.length;
        setUserUnreadConversations(pendingCount);
        setFirstPendingUserConversationId(pendingChats[0]?.id ?? null);

        const currentSignature = buildPendingSignature(pendingChats);

        if (!userUnreadReadyRef.current) {
          userUnreadReadyRef.current = true;
          previousUserPendingSignatureRef.current = currentSignature;
          previousUserPendingCountRef.current = pendingCount;
        } else {
          const hasNewOrChangedPending =
            pendingCount > 0 &&
            (currentSignature !== previousUserPendingSignatureRef.current ||
              pendingCount > previousUserPendingCountRef.current);
          previousUserPendingSignatureRef.current = currentSignature;
          previousUserPendingCountRef.current = pendingCount;
          if (!hasNewOrChangedPending || isChatOpen) return;

          showToast.info("Mensaje nuevo recibido", {
            duration: 2200,
            progress: true,
            position: "top-right",
            transition: "popUp",
            icon: "",
            sound: true,
          });
        }
      } catch (error) {
        console.log("[Navbar] user unread poll error", error);
      }
    };

    void loadUserUnread();
    const intervalId = window.setInterval(() => {
      void loadUserUnread();
    }, 2_000);

    return () => {
      canceled = true;
      window.clearInterval(intervalId);
    };
  }, [conversations, isAdminUser, isChatOpen, isLogged]);

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
      router.push("/admin/dashboard?section=chats&openChat=1");
      return;
    }
    // Abrimos primero una conversación con no leídos para limpiar la alerta al entrar.
    const firstUnreadConversation = conversations.find(
      (conversation) => conversation.unreadCount > 0,
    );
    if (firstPendingUserConversationId) {
      openChat({ conversationId: firstPendingUserConversationId });
      return;
    }
    if (firstUnreadConversation?.id) {
      openChat({ conversationId: firstUnreadConversation.id });
      return;
    }
    showToast.info("No hay chats nuevos.", {
      duration: 1800,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });
  };

  return (
    <header className="w-full bg-amber-100 text-zinc-900 border-b-2 border-amber-300 sticky top-0 z-50">
      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-wide text-amber-900 hover:text-emerald-900 transition"
        >
          RetroGarage™
        </Link>

        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
          <ul className="flex items-center gap-8 text-sm font-extrabold tracking-wide text-amber-900 uppercase list-none m-0 p-0 ">
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

        <div className="flex items-center gap-3">
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

            {isLogged && (
              <li>
                {/* ✅ decide al click */}
                <button
                  type="button"
                  onClick={goToProfile}
                  className="font-handwritten border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
                >
                  Mi Perfil
                </button>
              </li>
            )}

            {isLogged && hasNavbarUnread && (
              <li>
                <button
                  type="button"
                  onClick={handleOpenUnreadChat}
                  className="relative hover:text-emerald-900 transition"
                >
                  Chat
                  <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-red-600" />
                </button>
              </li>
            )}

            <li>
              <Link href="/cart" className="hover:text-emerald-900 transition">
                Carrito
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
          className="fixed inset-0 z-[95] flex items-center justify-center bg-zinc-900/60 p-4"
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
