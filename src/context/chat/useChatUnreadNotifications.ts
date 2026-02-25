import { MutableRefObject, useEffect } from "react";
import { showToast } from "nextjs-toast-notify";
import { tryChatToast } from "@/src/context/chat/chatToastDedup";

const CHAT_ALERT_DEBUG =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CHAT_ALERT_DEBUG === "true";

function logUnreadHook(scope: string, payload?: unknown) {
  if (!CHAT_ALERT_DEBUG) return;
  if (typeof payload === "undefined") {
    console.log(`[ChatAlert][useChatUnreadNotifications] ${scope}`);
    return;
  }
  console.log(`[ChatAlert][useChatUnreadNotifications] ${scope}`, payload);
}

type Params = {
  enabled?: boolean;
  canUseChat: boolean;
  unreadTotal: number;
  unreadSignal: string;
  onOpenUnreadChat?: () => void;
  previousUnreadTotalRef: MutableRefObject<number>;
  previousUnreadSignalRef: MutableRefObject<string>;
  unreadReadyRef: MutableRefObject<boolean>;
};

export function useChatUnreadNotifications({
  enabled = true,
  canUseChat,
  unreadTotal,
  unreadSignal,
  onOpenUnreadChat,
  previousUnreadTotalRef,
  previousUnreadSignalRef,
  unreadReadyRef,
}: Params): void {
  type ToastInfoOptions = Parameters<typeof showToast.info>[1] & {
    onClick?: () => void;
  };

  useEffect(() => {
    if (!enabled) return;
    if (!unreadReadyRef.current) {
      unreadReadyRef.current = true;
      previousUnreadTotalRef.current = unreadTotal;
      previousUnreadSignalRef.current = unreadSignal;
      logUnreadHook("init", { unreadTotal, unreadSignal, canUseChat });
      return;
    }

    const totalIncreased = unreadTotal > previousUnreadTotalRef.current;

    // Only fire when the total unread count actually grew. A signal change
    // without a count increase means the user read a conversation (unreadCount
    // dropped to 0) — that must never trigger the "new message" toast.
    if (canUseChat && totalIncreased && tryChatToast()) {
      logUnreadHook("toast:trigger", {
        previousUnread: previousUnreadTotalRef.current,
        unreadTotal,
        previousSignal: previousUnreadSignalRef.current,
        unreadSignal,
      });
      const toastOptions: ToastInfoOptions = {
        duration: 2200,
        progress: true,
        position: "top-right",
        transition: "popUp",
        icon: "",
        sound: true,
        onClick: () => onOpenUnreadChat?.(),
      };
      showToast.info("Mensaje nuevo recibido", toastOptions);
    }

    logUnreadHook("tick", {
      canUseChat,
      previousUnread: previousUnreadTotalRef.current,
      unreadTotal,
      previousSignal: previousUnreadSignalRef.current,
      unreadSignal,
    });
    previousUnreadTotalRef.current = unreadTotal;
    previousUnreadSignalRef.current = unreadSignal;
  }, [
    enabled,
    canUseChat,
    unreadSignal,
    unreadTotal,
    onOpenUnreadChat,
    previousUnreadSignalRef,
    previousUnreadTotalRef,
    unreadReadyRef,
  ]);
}
