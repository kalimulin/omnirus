/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYNORA_BASE_URL?: string;
  readonly VITE_SYNORA_EVENT_TOPIC?: string;
  readonly VITE_SYNORA_MAIL_TEMPLATE?: string;
  readonly VITE_SYNORA_PROJECT_ID?: string;
  readonly VITE_USERCENTER_BASE_URL?: string;
  readonly VITE_USERCENTER_PROJECT_ID?: string;
  readonly VITE_BASIS_CFG_BASE_URL?: string;
  readonly VITE_SHORTENER_API_URL?: string;
  readonly VITE_SHORTENER_CORE_API_URL?: string;
  readonly VITE_SHORTENER_DEMO_TOKEN?: string;
  readonly VITE_SHORTENER_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
