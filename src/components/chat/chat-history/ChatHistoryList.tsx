"use client";

import { ChatConversation } from "@/src/types/chat.types";

interface ChatHistoryListProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
}

export default function ChatHistoryList({
  conversations,
  activeConversationId,
  onSelectConversation,
}: ChatHistoryListProps) {
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
          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-emerald-900/60 bg-amber-200/90"
                    : "border-amber-300 bg-amber-100/80 hover:border-emerald-900/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-display text-xs uppercase tracking-[0.15em] text-emerald-900">
                    {conversation.customer}
                  </p>
                  <span className="text-[10px] text-amber-900/70">
                    {conversation.timestamp}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-amber-900/80 italic">
                  {conversation.product}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-800">
                  {conversation.lastMessage}
                </p>

                {conversation.unreadCount > 0 && (
                  <span className="mt-3 inline-flex rounded-full bg-emerald-900 px-2 py-1 text-[10px] font-display uppercase tracking-widest text-amber-50">
                    {conversation.unreadCount} nuevos
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
