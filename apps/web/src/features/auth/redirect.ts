/** Router state set by RequireAuth so sign-in can return to the requested page. */
export interface RedirectState {
  from?: string;
}

/** Only same-app paths are followed, never an absolute URL (open redirect). */
export function safeRedirectTarget(state: unknown): string {
  const from = (state as RedirectState | null)?.from;
  return from?.startsWith('/') && !from.startsWith('//') ? from : '/';
}
