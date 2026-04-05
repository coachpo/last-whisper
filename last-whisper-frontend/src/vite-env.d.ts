/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBUG_LOGGING: string
  readonly VITE_EXPECTED_METADATA_SCHEMA_VERSION: string
  readonly VITE_ENABLE_RQ_DEVTOOLS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
