/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_TURNSTILE_SITE_KEY?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  const __VERSION__: string
  const __BUILD_DATE__: string
  const __BUILDER__: string
  const __BUILD_ENV__: string
  const __BUILD_TIME__: string
  const __COMMIT_COUNT__: string
  const __VERSION_SOURCE__: string
  const __USER_DEBUG__: boolean
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'cap-widget': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        token?: string
        'data-cap-api-endpoint'?: string
        'data-cap-i18n-initial-state'?: string
        'data-cap-i18n-verifying-label'?: string
        'data-cap-i18n-solved-label'?: string
        'data-cap-i18n-error-label'?: string
      }
    }
  }
}

export {}
