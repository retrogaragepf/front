"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactElement } from "react";
import {
  ChatConversation,
  ChatMessage,
  ChatMessageMap,
  ChatParticipant,
  OpenChatPayload,
} from "@/src/types/chat.types";
import { chatService } from "@/src/services/chat.services";
import { useAuth } from "@/src/context/AuthContext";
import { SocketLike, useChatSocket } from "@/src/context/chat/useChatSocket";
import { useChatSync } from "@/src/context/chat/useChatSync";
import { useChatActions } from "@/src/context/chat/useChatActions";
import { useChatUnreadNotifications } from "@/src/context/chat/useChatUnreadNotifications";

interface ChatContextValue {
  isChatOpen: boolean;
  isAdminDirectChat: boolean;
  adminChatWithName: string;
  currentParticipant: ChatParticipant;
  currentUserId: string | null;
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  activeMessages: ChatMessage[];
  unreadTotal: number;
  hasUnreadMessages: boolean;
  openChat: (payload?: OpenChatPayload) => void;
  closeChat: () => void;
  selectConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  sendMessage: (content: string) => void;
}

const ChatContext = createContext<ChatContextValue>({
  isChatOpen: false,
  isAdminDirectChat: false,
  adminChatWithName: "",
  currentParticipant: "customer",
  currentUserId: null,
  conversations: [],
  activeConversation: null,
  activeMessages: [],
  unreadTotal: 0,
  hasUnreadMessages: false,
  openChat: () => {},
  closeChat: () => {},
  selectConversation: () => {},
  deleteConversation: () => {},
  sendMessage: () => {},
});

export const ChatProvider = ({
  children,
}: {
  children: React.ReactNode;
}): ReactElement => {
  const { isAuth, isLoadingUser } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminDirectChat, setIsAdminDirectChat] = useState(false);
  const [adminChatWithName, setAdminChatWithName] = useState("");
  const [currentParticipant, setCurrentParticipant] =
    useState<ChatParticipant>("customer");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] =
    useState<ChatMessageMap>({});
  const [activeConversationId, setActiveConversationId] = useState<string>("");

  const hasPersistedToken = chatService.isAuthenticated();
  const isAdminUser = hasPersistedToken && chatService.isAdminUser();
  const canUseChat =
    hasPersistedToken && !isAdminUser && (isAuth || isLoadingUser);
  const currentUserId = chatService.getCurrentUserId();

  const conversationsRef = useRef<ChatConversation[]>([]);
  const activeConversationRef = useRef<string>("");
  const socketRef = useRef<SocketLike | null>(null);
  const previousUnreadTotalRef = useRef(0);
  const previousUnreadSignalRef = useRef(0);
  const unreadReadyRef = useRef(false);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  const { clearUnreadLocal, joinConversationRoom } = useChatSync({
    canUseChat,
    isChatOpen,
    currentUserId,
    activeConversationId,
    socketRef,
    setConversations,
    setMessagesByConversation,
    setActiveConversationId,
  });

  useChatSocket({
    canUseChat,
    isChatOpen,
    socketRef,
    activeConversationRef,
    setMessagesByConversation,
    setConversations,
  });

  const { openChat, closeChat, selectConversation, deleteConversation, sendMessage } =
    useChatActions({
      canUseChat,
      isAuthLoading: isLoadingUser,
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
    });

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ??
      null,
    [activeConversationId, conversations],
  );

  const activeMessages = useMemo(
    () =>
      activeConversation ? messagesByConversation[activeConversation.id] ?? [] : [],
    [activeConversation, messagesByConversation],
  );

  const unreadTotal = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0,
      ),
    [conversations],
  );

  const unreadSignal = useMemo(() => {
    return conversations.reduce((maxTs, conversation) => {
      if (conversation.unreadCount <= 0) return maxTs;
      const ts = Date.parse(conversation.timestamp || "");
      if (Number.isNaN(ts)) return maxTs;
      return ts > maxTs ? ts : maxTs;
    }, 0);
  }, [conversations]);

  const resetChatState = useCallback(() => {
    setConversations([]);
    setMessagesByConversation({});
    setActiveConversationId("");
    setIsChatOpen(false);
  }, []);

  useEffect(() => {
    if (!isChatOpen || !activeConversationId) return;
    clearUnreadLocal(activeConversationId);
  }, [activeConversationId, clearUnreadLocal, isChatOpen]);

  useEffect(() => {
    if (isLoadingUser || canUseChat) return;
    // Si el usuario es admin o no está autenticado, evitamos estado residual del chat cliente.
    setTimeout(() => {
      resetChatState();
    }, 0);
  }, [canUseChat, isLoadingUser, resetChatState]);

  useChatUnreadNotifications({
    canUseChat,
    unreadTotal,
    unreadSignal,
    previousUnreadTotalRef,
    previousUnreadSignalRef,
    unreadReadyRef,
  });

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        isAdminDirectChat,
        adminChatWithName,
        currentParticipant,
        currentUserId,
        conversations,
        activeConversation,
        activeMessages,
        unreadTotal,
        hasUnreadMessages: unreadTotal > 0,
        openChat,
        closeChat,
        selectConversation,
        deleteConversation,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextValue => useContext(ChatContext);
