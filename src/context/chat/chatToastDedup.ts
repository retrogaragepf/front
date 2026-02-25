/**
 * Module-level dedup so that ALL toast paths (Navbar socket, Navbar custom
 * event, Navbar poll, useChatUnreadNotifications) share the same timestamp and
 * never double-fire for the same incoming message.
 *
 * A 1 500 ms window is enough to merge:
 *  – the Navbar socket toast (fires at T ≈ 0 ms)
 *  – the ChatContext socket updating state → useChatUnreadNotifications (T ≈ 50–300 ms)
 *  – the Navbar 3 s poll catching the same message (T ≈ 0–3 000 ms)
 * while still allowing a second genuine message that arrives > 1.5 s later.
 */
let lastChatToastAt = 0;
const DEDUP_MS = 1_500;

/**
 * Returns true and records the timestamp if a toast may be shown right now.
 * Returns false (and does NOT update the timestamp) if a toast was already
 * shown within the dedup window — the caller should skip the toast.
 */
export function tryChatToast(): boolean {
  const now = Date.now();
  if (now - lastChatToastAt < DEDUP_MS) return false;
  lastChatToastAt = now;
  return true;
}
