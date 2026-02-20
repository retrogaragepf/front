"use client";

import { useEffect, useRef } from "react";
import { ChatMessage, ChatParticipant } from "@/src/types/chat.types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentParticipant: ChatParticipant;
  currentUserId?: string | null;
}

const ChatMessages = ({
  messages,
  currentParticipant,
  currentUserId,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-amber-100/40 px-4 py-4">
      {messages.length === 0 && (
        <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900/80">
          Inicia una conversación para coordinar detalles del producto.
        </p>
      )}

      {messages.map((message) => {
        const isOwnMessage = currentUserId
          ? message.senderId === currentUserId
          : message.from === currentParticipant;
        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
          >
            <article
              className={`max-w-[82%] rounded-lg border px-4 py-3 text-[13px] shadow-sm ${
                isOwnMessage
                  ? "border-emerald-950 bg-emerald-900 text-amber-50"
                  : "border-amber-300 bg-amber-50 text-zinc-900"
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <span
                className={`mt-2 block text-[10px] uppercase tracking-widest ${
                  isOwnMessage ? "text-amber-200/75" : "text-emerald-900/70"
                }`}
              >
                {message.time}
              </span>
            </article>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
