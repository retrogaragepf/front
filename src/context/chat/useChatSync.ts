import { Dispatch, SetStateAction, MutableRefObject, useCallback, useEffect } from "react";
import { ChatConversation, ChatMessageMap } from "@/src/types/chat.types";
import { chatService } from "@/src/services/chat.services";
import { dedupeConversations, mergeConversationData } from "@/src/context/chat/chatStateUtils";
import { SocketLike } from "@/src/context/chat/useChatSocket";

type Params = {
  canUseChat: boolean;
  isChatOpen: boolean;
  currentUserId: string | null;
  activeConversationId: string;
  socketRef: MutableRefObject<SocketLike | null>;
  setConversations: Dispatch<SetStateAction<ChatConversation[]>>;
  setMessagesByConversation: Dispatch<SetStateAction<ChatMessageMap>>;
  setActiveConversationId: Dispatch<SetStateAction<string>>;
};

export function useChatSync({
  canUseChat,
  isChatOpen,
  currentUserId,
  activeConversationId,
  socketRef,
  setConversations,
  setMessagesByConversation,
  setActiveConversationId,
}: Params) {
  const syncConversations = useCallback(async () => {
    if (!canUseChat) return;
    try {
      const remoteConversations = await chatService.getConversations();
      const normalizedConversations = dedupeConversations(remoteConversations);

      setConversations((prev) => {
        const prevById = new Map(prev.map((conversation) => [conversation.id, conversation]));
        return normalizedConversations.map((conversation) =>
          mergeConversationData(conversation, prevById.get(conversation.id)),
        );
      });

      setActiveConversationId((prev) => {
        if (prev && normalizedConversations.some((conversation) => conversation.id === prev)) {
          return prev;
        }
        return normalizedConversations[0]?.id ?? "";
      });
    } catch (error) {
      if ((error as Error).message === "NO_AUTH") return;
      console.error("No se pudieron sincronizar conversaciones:", error);
    }
  }, [canUseChat, setActiveConversationId, setConversations]);

  const syncMessages = useCallback(
    async (conversationId: string) => {
      if (!canUseChat || !conversationId) return;
      try {
        const remoteMessages = await chatService.getMessages(conversationId);
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: remoteMessages,
        }));

        const latestMessage =
          remoteMessages.length > 0 ? remoteMessages[remoteMessages.length - 1] : null;
        const otherMessage =
          remoteMessages.find(
            (message) => message.senderId && message.senderId !== currentUserId,
          ) ?? latestMessage;

        if (latestMessage || otherMessage?.senderName) {
          setConversations((prev) =>
            prev.map((conversation) => {
              if (conversation.id !== conversationId) return conversation;
              return {
                ...conversation,
                sellerName:
                  conversation.sellerName && conversation.sellerName !== "Usuario"
                    ? conversation.sellerName
                    : otherMessage?.senderName || conversation.sellerName || "Usuario",
                seller: {
                  name:
                    conversation.seller?.name && conversation.seller.name !== "Usuario"
                      ? conversation.seller.name
                      : otherMessage?.senderName || conversation.seller?.name || "Usuario",
                },
                timestamp: latestMessage
                  ? new Date(latestMessage.createdAt).toISOString()
                  : conversation.timestamp,
              };
            }),
          );
        }
      } catch (error) {
        if ((error as Error).message === "NO_AUTH") return;
        console.error("No se pudieron sincronizar mensajes:", error);
      }
    },
    [canUseChat, currentUserId, setConversations, setMessagesByConversation],
  );

  const clearUnreadLocal = useCallback(
    (conversationId: string) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    },
    [setConversations],
  );

  const joinConversationRoom = useCallback(
    (conversationId: string) => {
      if (!conversationId || !socketRef.current?.connected) return;
      socketRef.current.emit("joinConversation", conversationId);
    },
    [socketRef],
  );

  useEffect(() => {
    if (!canUseChat) return;
    void syncConversations();
  }, [canUseChat, syncConversations]);

  useEffect(() => {
    if (!canUseChat) return;
    const intervalId = window.setInterval(() => {
      void syncConversations();
    }, 12000);
    return () => window.clearInterval(intervalId);
  }, [canUseChat, syncConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    void syncMessages(activeConversationId);
    joinConversationRoom(activeConversationId);
  }, [activeConversationId, joinConversationRoom, syncMessages]);

  useEffect(() => {
    if (!isChatOpen || !activeConversationId) return;
    const intervalId = window.setInterval(() => {
      void syncMessages(activeConversationId);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [activeConversationId, isChatOpen, syncMessages]);

  return { clearUnreadLocal, joinConversationRoom };
}
