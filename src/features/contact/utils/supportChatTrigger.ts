export const SUPPORT_CHAT_TOGGLE_EVENT = 'servicelink:toggle-support-chat';

export const SUPPORT_CHAT_TRIGGER_ATTR = 'data-support-chat-trigger';

export function requestToggleSupportChat() {
  window.dispatchEvent(new Event(SUPPORT_CHAT_TOGGLE_EVENT));
}
