/**
 * Copy `text` to the system clipboard.
 *
 * Mobile Safari (WebKit) requires `execCommand('copy')` to run in the same
 * synchronous turn as the user tap. Do not `await` before calling
 * {@link copyTextToClipboardSync} from a click handler.
 *
 * `readonly` and extra focus/selection tricks break copy on some iOS versions;
 * this matches the minimal pattern used in `LinkSharingCard`.
 */
function copyViaHiddenTextarea(text: string): boolean {
  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return ok;
}

/** Use directly inside `onClick` / tap handlers (same synchronous tick as the gesture). */
export function copyTextToClipboardSync(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return copyViaHiddenTextarea(trimmed);
}

/** Async Clipboard API fallback (e.g. programmatic copy); may fail without a user gesture. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (copyTextToClipboardSync(trimmed)) {
    return true;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
