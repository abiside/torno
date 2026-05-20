/**
 * No-code product mode: preview-first UX, minimal code/terminal surface,
 * and system prompt overlay (see PromptLibrary `nocode`).
 *
 * Enable with `VITE_NOCODE_MODE=true` at build time.
 */
export function isNoCodeMode(): boolean {
  return import.meta.env.VITE_NOCODE_MODE === 'true';
}
