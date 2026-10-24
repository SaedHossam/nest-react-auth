/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL. Defaults to same-origin `/api` (proxied by Vite in development). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
