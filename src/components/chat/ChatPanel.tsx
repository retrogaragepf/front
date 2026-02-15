"use client";

import { ChatPanelProps } from "@/src/types/chat.types";

const ChatPanel = ({ conversations, activeConversation, messages }: ChatPanelProps) => {
  return (
    <section className="flex-1 w-full bg-amber-200 text-zinc-900">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <header className="flex items-center gap-3 mb-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900 text-amber-200">
            <svg
              aria-hidden
              focusable="false"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
              <path d="M7 9h10" />
              <path d="M7 13h6" />
            </svg>
          </span>
          <div>
            <h1 className="font-handwritten text-3xl sm:text-4xl  text-amber-900">Conversaciones</h1>
            <p className="font-sans text-sm sm:text-base text-emerald-900">
              Gestiona los chats con tus compradores.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4 bg-amber-100/80 border border-amber-300 rounded-lg shadow-lg">
            <div className="px-5 py-4 border-b border-amber-300/80">
              <p className="font-display text-xs uppercase tracking-[0.2em] text-emerald-900/80">
                Bandeja de entrada
              </p>
            </div>
            <ul className="space-y-2 px-3 pb-4">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversation.id;
                return (
                  <li
                    key={conversation.id}
                    className={`rounded-md px-4 py-3 shadow-sm transition-colors border ${
                      isActive
                        ? "bg-amber-200/90 border-emerald-900/50"
                        : "bg-amber-50/80 border-amber-300/70 hover:border-emerald-900/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-sm uppercase tracking-tight text-emerald-900">
                          {conversation.customer}
                        </p>
                        <p className="text-xs text-amber-900/80 italic">
                          {conversation.product}
                        </p>
                      </div>
                      <span className="text-[11px] text-amber-900/70">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-800 line-clamp-2">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-900 text-amber-100 text-[11px] px-2 py-1 font-display uppercase tracking-widest">
                        {conversation.unreadCount} nuevos
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="bg-amber-100/90 border border-amber-300 rounded-lg shadow-[8px_8px_0px_0px_rgba(34,70,63,0.15)] flex flex-col min-h-105">
            <div className="border-b border-amber-300/80 px-6 py-4 bg-amber-50/80 flex items-center justify-between">
              <div>
                <p className="font-display uppercase tracking-[0.2em] text-xs text-emerald-900/80">
                  {activeConversation.customer}
                </p>
                <p className="text-sm text-amber-900/80 italic">
                  {activeConversation.product}
                </p>
              </div>
              <span className="text-xs text-amber-900/70">Responde en menos de 2h</span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {messages.map((message) => {
                const isSeller = message.from === "seller";
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSeller ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-md border px-4 py-3 text-sm leading-relaxed shadow-sm transition-colors ${
                        isSeller
                          ? "bg-emerald-900 text-amber-100 border-emerald-950"
                          : "bg-amber-50 text-zinc-900 border-amber-300"
                      }`}
                    >
                      <p>{message.content}</p>
                      <span
                        className={`mt-2 block text-[11px] uppercase tracking-widest font-display ${
                          isSeller ? "text-amber-200/70" : "text-emerald-900/70"
                        }`}
                      >
                        {message.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-amber-300/80 px-6 py-5 bg-amber-50/90">
              <div className="rounded-md border border-amber-300 bg-white/80 shadow-inner">
                <textarea
                  className="w-full resize-none bg-transparent px-4 py-3 text-sm text-zinc-900 focus:outline-none"
                  rows={3}
                  placeholder="Escribe tu respuesta vintage..."
                  disabled
                />
                <div className="flex items-center justify-between border-t border-amber-300/80 px-4 py-3">
                  <p className="text-xs text-amber-900/70 italic">
                    Próximamente: envía mensajes, adjunta fotos y plantillas.
                  </p>
                  <button
                    type="button"
                    className="font-display uppercase tracking-[0.3em] text-xs border-2 border-emerald-900 text-emerald-900 px-4 py-2 hover:bg-emerald-900 hover:text-amber-50 transition-colors"
                    disabled
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChatPanel;
