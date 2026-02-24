"use client";

import { ChatConversation } from "@/src/types/chat.types";

interface ChatHistoryListProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

const formatShortDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const isSupportConversation = (conversation: ChatConversation): boolean => {
  const sellerName = (conversation.sellerName || "").toLowerCase();
  const sellerNested = (conversation.seller?.name || "").toLowerCase();
  const product = (conversation.product || "").toLowerCase();
  return (
    sellerName.includes("admin") ||
    sellerNested.includes("admin") ||
    product.includes("soporte") ||
    product.includes("ayuda")
  );
};

const ChatHistoryList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}: ChatHistoryListProps) => {
  return (
    <aside className="h-full overflow-hidden rounded-xl border border-amber-300 bg-amber-50/90 shadow-sm">
      <div className="border-b border-amber-300 px-4 py-3">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-emerald-900/80">
          Historial de chats
        </p>
      </div>

      <ul className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          const isSupport = isSupportConversation(conversation);
          return (
            <li key={conversation.id}>
              <div
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-emerald-900/60 bg-amber-200/90"
                    : "border-amber-300 bg-amber-100/80 hover:border-emerald-900/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-display text-xs uppercase tracking-[0.15em] text-emerald-900">
                        {conversation.sellerName || "Usuario"}
                      </p>
                      <span className="text-[10px] text-amber-900/70">
                        {formatShortDateTime(conversation.timestamp)}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteConversation(conversation.id)}
                    className="shrink-0 rounded-md border border-amber-900 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 hover:bg-amber-200"
                    aria-label={`Borrar chat con ${conversation.sellerName || "usuario"}`}
                    title="Borrar chat"
                  >
                    X
                  </button>
                </div>
                {!isSupport && (
                  <p className="mt-1 truncate text-xs text-amber-900/80 italic">
                    Producto: {conversation.product || ""}
                  </p>
                )}
                <p className="mt-2 text-[10px] text-zinc-600">
                  Último mensaje: {formatShortDateTime(conversation.timestamp)}
                </p>

                {conversation.unreadCount > 0 && (
                  <span className="mt-3 inline-flex rounded-full bg-emerald-900 px-2 py-1 text-[10px] font-display uppercase tracking-widest text-amber-50">
                    {conversation.unreadCount} nuevos
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default ChatHistoryList;
