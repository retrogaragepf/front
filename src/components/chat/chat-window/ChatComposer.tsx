"use client";

import { FormEvent, useState } from "react";

interface ChatComposerProps {
  onSendMessage: (content: string) => void;
}

export default function ChatComposer({ onSendMessage }: ChatComposerProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = message.trim();
    if (!normalized) return;
    onSendMessage(normalized);
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-amber-300 bg-amber-50/90 p-4"
    >
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Escribe tu mensaje..."
          className="max-h-32 min-h-12 w-full resize-y rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-900/60 focus:outline-none"
        />
        <button
          type="submit"
          className="h-11 rounded-lg border-2 border-emerald-900 bg-emerald-900 px-4 text-xs font-display uppercase tracking-[0.2em] text-amber-50 transition hover:bg-amber-50 hover:text-emerald-900"
        >
          Enviar
        </button>
      </div>
    </form>
  );
}
