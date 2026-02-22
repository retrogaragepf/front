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

export function useChatActions({
  canUseChat,
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
}: Params) {
  const ensureConversation = useCallback(
    async (payload: OpenChatPayload): Promise<string> => {
      if (!canUseChat) return "";
      if (payload.conversationId) return payload.conversationId;

      const sellerId = payload.sellerId?.trim();
      const customerId = payload.customerId?.trim() || chatService.getCurrentUserId();

      if (!sellerId || !customerId) {
        return conversationsRef.current[0]?.id ?? "";
      }

      const existing = conversationsRef.current.find((conversation) => {
        const ids = conversation.participantIds ?? [];
        return ids.includes(sellerId) && ids.includes(customerId);
      });
      if (existing) return existing.id;

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

      return hydratedConversation.id;
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
          const conversationId = await ensureConversation(payload);
          if (!conversationId) {
            showToast.warning("No se pudo abrir la conversación.", {
              duration: 2200,
              progress: true,
              position: "top-center",
              transition: "popUp",
              icon: "",
              sound: true,
            });
            return;
          }

          setActiveConversationId(conversationId);

          const initialMessage = payload.initialMessage?.trim();
          if (initialMessage) {
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
          showToast.error("No se pudo abrir el chat. Intenta de nuevo.", {
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
      canUseChat,
      ensureConversation,
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

      setConversations(nextConversations);
      setMessagesByConversation((prev) => {
        const { [conversationId]: _deleted, ...rest } = prev;
        return rest;
      });
      setActiveConversationId(nextActiveId);

      void (async () => {
        try {
          await chatService.deleteConversation(conversationId);
        } catch (error) {
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
      }
    },
    [canUseChat, activeConversationId, setConversations, setMessagesByConversation],
  );

  return { openChat, closeChat, selectConversation, deleteConversation, sendMessage };
}
