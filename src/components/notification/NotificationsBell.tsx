"use client";

import { useState } from "react";
import { useNotifications } from "@/src/context/NotificationContext";

const NotificationsBell = () => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          markAllAsRead();
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-200 transition"
        aria-label="Notificaciones"
      >
        <span className="text-lg">🔔</span>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 📦 Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-xl border-2 border-amber-900 bg-amber-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] z-50">
          <div className="p-3 border-b border-amber-300 font-extrabold text-amber-900">
            Notificaciones
          </div>

          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-zinc-600">
              No tenés notificaciones todavía
            </p>
          ) : (
            <ul className="divide-y divide-amber-300">
              {notifications.map((n) => (
                <li key={n.id} className="p-3 text-sm">
                  {n.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
