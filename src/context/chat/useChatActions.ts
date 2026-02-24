import { Dispatch, MutableRefObject, SetStateAction, useCallback } from "react";
import { showToast } from "nextjs-toast-notify";
import {
  ChatConversation,
  ChatMessage,
  ChatMessageMap,
  ChatParticipant,
  OpenChatPayload,
} from "@/src/types/chat.types";
import { chatService } from "@/src/services/chat.services";
import {
  appendMessageSafe,
  dedupeConversations,
  formatTime,
  mergeConversationData,
  replaceOptimisticMessage,
} from "@/src/context/chat/chatStateUtils";

type Params = {
  canUseChat: boolean;
  isAuthLoading: boolean;
  messagesByConversation: ChatMessageMap;
  conversationsRef: MutableRefObject<ChatConversation[]>;
  activeConversationRef: MutableRefObject<string>;
  setIsChatOpen: Dispatch<SetStateAction<boolean>>;
  setIsAdminDirectChat: Dispatch<SetStateAction<boolean>>;
  setAdminChatWithName: Dispatch<SetStateAction<string>>;
  setCurrentParticipant: Dispatch<SetStateAction<ChatParticipant>>;
  setConversations: Dispatch<SetStateAction<ChatConversation[]>>;
  setMessagesByConversation: Dispatch<SetStateAction<ChatMessageMap>>;
  setActiveConversationId: Dispatch<SetStateAction<string>>;
  clearUnreadLocal: (conversationId: string) => void;
  joinConversationRoom: (conversationId: string) => void;
  activeConversationId: string;
};

type UseChatActionsResult = {
  openChat: (payload?: OpenChatPayload) => void;
  closeChat: () => void;
  selectConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  sendMessage: (content: string) => Promise<void>;
};

const CHAT_HIDDEN_CONVERSATIONS_KEY = "chat_hidden_conversations";
const CHAT_ALERT_DEBUG =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CHAT_ALERT_DEBUG === "true";

function logChatActions(scope: string, payload?: unknown) {
  if (!CHAT_ALERT_DEBUG) return;
  if (typeof payload === "undefined") {
    console.log(`[ChatAlert][useChatActions] ${scope}`);
    return;
  }
  console.log(`[ChatAlert][useChatActions] ${scope}`, payload);
}

function readHiddenConversationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(CHAT_HIDDEN_CONVERSATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(String).filter(Boolean));
  } catch {
    return new Set();
  }
}

function writeHiddenConversationIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CHAT_HIDDEN_CONVERSATIONS_KEY,
      JSON.stringify(Array.from(ids)),
    );
  } catch {
    // Ignore storage quota/private mode errors.
  }
}

function removeHiddenConversationId(id: string) {
  if (!id) return;
  const hiddenConversationIds = readHiddenConversationIds();
  if (!hiddenConversationIds.has(id)) return;
  hiddenConversationIds.delete(id);
  writeHiddenConversationIds(hiddenConversationIds);
  logChatActions("hiddenConversation:removed", { id });
}

function isSupportConversation(conversation: ChatConversation): boolean {
  const sellerName = (conversation.sellerName || "").toLowerCase();
  const sellerNested = (conversation.seller?.name || "").toLowerCase();
  const product = (conversation.product || "").toLowerCase();
  return (
    sellerName.includes("admin") ||
    sellerNested.includes("admin") ||
    product.includes("soporte") ||
    product.includes("ayuda")
  );
}

export function useChatActions({
  canUseChat,
  isAuthLoading,
  messagesByConversation,
  conversationsRef,
  activeConversationRef,
  setIsChatOpen,
  setIsAdminDirectChat,
  setAdminChatWithName,
  setCurrentParticipant,
  setConversations,
  setMessagesByConversation,
  setActiveConversationId,
  clearUnreadLocal,
  joinConversationRoom,
  activeConversationId,
}: Params): UseChatActionsResult {
  const ensureConversation = useCallback(
    async (
      payload: OpenChatPayload,
    ): Promise<{ conversationId: string; shouldSendInitialMessage: boolean }> => {
      if (!canUseChat) {
        return { conversationId: "", shouldSendInitialMessage: false };
      }
      if (payload.conversationId) {
        return {
          conversationId: payload.conversationId,
          shouldSendInitialMessage: Boolean(payload.initialMessage?.trim()),
        };
      }

      if (payload.isSupportRequest) {
        const existingSupport = conversationsRef.current.find((conversation) =>
          isSupportConversation(conversation),
        );
        if (existingSupport?.id) {
          // Si ya existe chat soporte para el usuario, reutilizamos la misma conversación.
          return {
            conversationId: existingSupport.id,
            shouldSendInitialMessage: Boolean(payload.initialMessage?.trim()),
          };
        }

        const supportSubject =
          payload.supportSubject?.trim() || payload.product?.trim() || "Soporte";
        const supportDetail = payload.supportDetail?.trim() || "";
        const supportContent =
          payload.initialMessage?.trim() ||
          (supportDetail ? `Asunto: ${supportSubject}\nDetalle: ${supportDetail}` : "");

        // El chat de ayuda debe crearse con /chat/support según Swagger.
        const supportConversation = await chatService.createSupportConversation({
          subject: supportSubject,
          detail: supportDetail,
          content: supportContent,
        });

        setConversations((prev) => {
          const merged = dedupeConversations([supportConversation, ...prev]);
          return merged.map((conversation) =>
            conversation.id === supportConversation.id
              ? mergeConversationData(supportConversation, conversation)
              : conversation,
          );
        });

        setMessagesByConversation((prev) => ({
          ...prev,
          [supportConversation.id]: prev[supportConversation.id] ?? [],
        }));

        return {
          conversationId: supportConversation.id,
          shouldSendInitialMessage: false,
        };
      }

      const sellerId = payload.sellerId?.trim();
      const customerId = payload.customerId?.trim() || chatService.getCurrentUserId();

      if (!sellerId || !customerId) {
        return {
          conversationId: conversationsRef.current[0]?.id ?? "",
          shouldSendInitialMessage: Boolean(payload.initialMessage?.trim()),
        };
      }

      const existing = conversationsRef.current.find((conversation) => {
        const ids = conversation.participantIds ?? [];
        return ids.includes(sellerId) && ids.includes(customerId);
      });
      if (existing) {
        return {
          conversationId: existing.id,
          shouldSendInitialMessage: Boolean(payload.initialMessage?.trim()),
        };
      }

      const createdConversation = await chatService.createConversation({
        type: "PRIVATE",
        participantIds: [customerId, sellerId],
      });

      const hydratedConversation: ChatConversation = {
        ...createdConversation,
        sellerName: payload.sellerName || createdConversation.sellerName,
        seller: { name: payload.sellerName || createdConversation.seller.name },
        product: payload.product || createdConversation.product,
        customer: payload.customerName || createdConversation.customer,
        customerId,
        sellerId,
        participantIds: [customerId, sellerId],
      };

      setConversations((prev) => {
        const merged = dedupeConversations([hydratedConversation, ...prev]);
        return merged.map((conversation) =>
          conversation.id === hydratedConversation.id
            ? mergeConversationData(hydratedConversation, conversation)
            : conversation,
        );
      });

      setMessagesByConversation((prev) => ({
        ...prev,
        [hydratedConversation.id]: prev[hydratedConversation.id] ?? [],
      }));

      return {
        conversationId: hydratedConversation.id,
        shouldSendInitialMessage: Boolean(payload.initialMessage?.trim()),
      };
    },
    [canUseChat, conversationsRef, setConversations, setMessagesByConversation],
  );

  const openChat = useCallback(
    (payload?: OpenChatPayload) => {
      setIsChatOpen(true);
      setIsAdminDirectChat(Boolean(payload?.adminDirect));
      setAdminChatWithName(payload?.chatWithName?.trim() || "");
      const nextParticipant = payload?.asParticipant;
      if (nextParticipant) setCurrentParticipant(nextParticipant);

      if (!canUseChat) {
        if (isAuthLoading) return;
        showToast.warning("Debes iniciar sesión para usar el chat.", {
          duration: 2200,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });
        return;
      }

      if (!payload) return;

      void (async () => {
        try {
          const ensured = await ensureConversation(payload);
          const conversationId = ensured.conversationId;
          if (!conversationId) {
            showToast.warning("No hay chats nuevos.", {
              duration: 2200,
              progress: true,
              position: "top-center",
              transition: "popUp",
              icon: "",
              sound: true,
            });
            return;
          }

          // Si la conversación estaba oculta por un borrado local previo,
          // la restauramos para permitir reabrir chat con el mismo usuario.
          removeHiddenConversationId(conversationId);
          logChatActions("openChat:conversationEnsured", {
            conversationId,
            isSupport: Boolean(payload.isSupportRequest),
          });
          setActiveConversationId(conversationId);

          const initialMessage = payload.initialMessage?.trim();
          if (initialMessage && ensured.shouldSendInitialMessage) {
            const persistedMessage = await chatService.sendMessage({
              conversationId,
              content: initialMessage,
            });

            setMessagesByConversation((prev) => ({
              ...prev,
              [conversationId]: appendMessageSafe(
                prev[conversationId] ?? [],
                persistedMessage,
              ),
            }));

            setConversations((prev) =>
              prev.map((conversation) =>
                conversation.id === conversationId
                  ? {
                      ...conversation,
                      lastMessage: persistedMessage.content,
                      timestamp: new Date(persistedMessage.createdAt).toISOString(),
                    }
                  : conversation,
              ),
            );
          }
        } catch (error) {
          console.error("No se pudo abrir conversación:", error);
          const rawMessage = error instanceof Error ? error.message : "";
          const isBlocked = rawMessage.toLowerCase().includes("bloque");
          showToast.error(
            isBlocked
              ? "No puedes chatear: cuenta bloqueada por reglas de comunicación."
              : "No se pudo abrir el chat. Intenta de nuevo.",
            {
            duration: 2200,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
            },
          );
        }
      })();
    },
    [
      canUseChat,
      ensureConversation,
      isAuthLoading,
      setActiveConversationId,
      setAdminChatWithName,
      setConversations,
      setCurrentParticipant,
      setIsAdminDirectChat,
      setIsChatOpen,
      setMessagesByConversation,
    ],
  );

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    setIsAdminDirectChat(false);
    setAdminChatWithName("");
  }, [setAdminChatWithName, setIsAdminDirectChat, setIsChatOpen]);

  const selectConversation = useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      clearUnreadLocal(conversationId);
      joinConversationRoom(conversationId);
    },
    [clearUnreadLocal, joinConversationRoom, setActiveConversationId],
  );

  const deleteConversation = useCallback(
    (conversationId: string) => {
      if (!conversationId) return;

      const previousConversations = conversationsRef.current;
      const previousMessages = messagesByConversation;
      const previousActiveId = activeConversationRef.current;

      const nextConversations = previousConversations.filter(
        (conversation) => conversation.id !== conversationId,
      );
      const nextActiveId =
        previousActiveId === conversationId
          ? (nextConversations[0]?.id ?? "")
          : previousActiveId;
      logChatActions("deleteConversation:localRemove", {
        conversationId,
        previousCount: previousConversations.length,
        nextCount: nextConversations.length,
        previousActiveId,
        nextActiveId,
      });

      setConversations(nextConversations);
      setMessagesByConversation((prev) => {
        const { [conversationId]: _deleted, ...rest } = prev;
        return rest;
      });
      setActiveConversationId(nextActiveId);

      void (async () => {
        try {
          // En backend actual, DELETE de conversación está restringido a admin.
          // Para usuario normal mantenemos borrado local (no persistente).
          if (!chatService.isAdminUser()) {
            showToast.success("Conversación eliminada de tu vista.", {
              duration: 2200,
              progress: true,
              position: "top-center",
              transition: "popUp",
              icon: "",
              sound: true,
            });
            return;
          }

          await chatService.deleteConversation(conversationId);
        } catch (error) {
          const status = Number((error as { status?: number })?.status ?? 0);
          if ([401, 403, 404, 405].includes(status)) {
            // Si el backend no permite borrar o no encuentra, dejamos oculto local.
            showToast.info("Conversación ocultada localmente.", {
              duration: 2200,
              progress: true,
              position: "top-center",
              transition: "popUp",
              icon: "",
              sound: true,
            });
            return;
          }

          console.error("No se pudo borrar conversación:", error);
          setConversations(previousConversations);
          setMessagesByConversation(previousMessages);
          setActiveConversationId(previousActiveId);
          showToast.error("No se pudo borrar la conversación.", {
            duration: 2200,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
          });
        }
      })();
    },
    [
      activeConversationRef,
      conversationsRef,
      messagesByConversation,
      setActiveConversationId,
      setConversations,
      setMessagesByConversation,
    ],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const normalizedContent = content.trim();
      if (!normalizedContent) return;

      if (!canUseChat) {
        showToast.warning("Debes iniciar sesión para enviar mensajes.", {
          duration: 2200,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });
        return;
      }

      if (!activeConversationId) {
        showToast.info("Selecciona o crea una conversación antes de enviar.", {
          duration: 2200,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });
        return;
      }

      const currentUserId = chatService.getCurrentUserId();
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversationId,
        senderId: currentUserId ?? undefined,
        from: "customer",
        content: normalizedContent,
        time: formatTime(),
        createdAt: Date.now(),
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [activeConversationId]: appendMessageSafe(
          prev[activeConversationId] ?? [],
          optimisticMessage,
        ),
      }));

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                lastMessage: normalizedContent,
                timestamp: `Hoy, ${optimisticMessage.time}`,
              }
            : conversation,
        ),
      );

      try {
        const persistedMessage = await chatService.sendMessage({
          conversationId: activeConversationId,
          content: normalizedContent,
        });

        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversationId]: replaceOptimisticMessage(
            prev[activeConversationId] ?? [],
            optimisticMessage.id,
            persistedMessage,
          ),
        }));
      } catch (error) {
        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversationId]: (prev[activeConversationId] ?? []).filter(
            (message) => message.id !== optimisticMessage.id,
          ),
        }));
        console.error("No se pudo enviar mensaje al backend:", error);
        const rawMessage = error instanceof Error ? error.message : "";
        const isBlocked = rawMessage.toLowerCase().includes("bloque");
        showToast.error(
          isBlocked
            ? "No puedes chatear: cuenta bloqueada por reglas de comunicación."
            : "No se pudo enviar el mensaje.",
          {
            duration: 2200,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
          },
        );
      }
    },
    [canUseChat, activeConversationId, setConversations, setMessagesByConversation],
  );

  return { openChat, closeChat, selectConversation, deleteConversation, sendMessage };
}
