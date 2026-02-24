import { MutableRefObject, useEffect } from "react";
import { showToast } from "nextjs-toast-notify";

type Params = {
  canUseChat: boolean;
  unreadTotal: number;
  unreadSignal: number;
  previousUnreadTotalRef: MutableRefObject<number>;
  previousUnreadSignalRef: MutableRefObject<number>;
  unreadReadyRef: MutableRefObject<boolean>;
};

export function useChatUnreadNotifications({
  canUseChat,
  unreadTotal,
  unreadSignal,
  previousUnreadTotalRef,
  previousUnreadSignalRef,
  unreadReadyRef,
}: Params): void {
  useEffect(() => {
    if (!unreadReadyRef.current) {
      unreadReadyRef.current = true;
      previousUnreadTotalRef.current = unreadTotal;
      previousUnreadSignalRef.current = unreadSignal;
      console.log("[useChatUnreadNotifications] init", { unreadTotal, unreadSignal });
      return;
    }

    const totalIncreased = unreadTotal > previousUnreadTotalRef.current;
    const signalIncreased = unreadSignal > previousUnreadSignalRef.current;

    if (canUseChat && (totalIncreased || signalIncreased)) {
      console.log("[useChatUnreadNotifications] toast:trigger", {
        previousUnread: previousUnreadTotalRef.current,
        unreadTotal,
        previousSignal: previousUnreadSignalRef.current,
        unreadSignal,
      });
      showToast.info("Mensaje nuevo recibido", {
        duration: 2200,
        progress: true,
        position: "top-right",
        transition: "popUp",
        icon: "",
        sound: true,
      });
    }

    console.log("[useChatUnreadNotifications] tick", {
      canUseChat,
      previousUnread: previousUnreadTotalRef.current,
      unreadTotal,
      previousSignal: previousUnreadSignalRef.current,
      unreadSignal,
    });
    previousUnreadTotalRef.current = unreadTotal;
    previousUnreadSignalRef.current = unreadSignal;
  }, [
    canUseChat,
    unreadSignal,
    unreadTotal,
    previousUnreadSignalRef,
    previousUnreadTotalRef,
    unreadReadyRef,
  ]);
}
