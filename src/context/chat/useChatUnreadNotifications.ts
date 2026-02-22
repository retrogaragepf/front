import { MutableRefObject, useEffect } from "react";
import { showToast } from "nextjs-toast-notify";

type Params = {
  canUseChat: boolean;
  unreadTotal: number;
  previousUnreadRef: MutableRefObject<number>;
  unreadReadyRef: MutableRefObject<boolean>;
};

export function useChatUnreadNotifications({
  canUseChat,
  unreadTotal,
  previousUnreadRef,
  unreadReadyRef,
}: Params) {
  useEffect(() => {
    if (!unreadReadyRef.current) {
      unreadReadyRef.current = true;
      previousUnreadRef.current = unreadTotal;
      return;
    }

    if (canUseChat && unreadTotal > previousUnreadRef.current) {
      showToast.info("Mensaje nuevo recibido", {
        duration: 2200,
        progress: true,
        position: "top-right",
        transition: "popUp",
        icon: "",
        sound: true,
      });
    }

    previousUnreadRef.current = unreadTotal;
  }, [canUseChat, unreadTotal, previousUnreadRef, unreadReadyRef]);
}
