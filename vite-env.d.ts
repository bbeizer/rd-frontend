/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_REACT_APP_AI_SERVICE_URL: string;
    readonly VITE_BACKEND_BASE_URL: string;
    
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  