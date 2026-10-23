// Same origin on the web. The desktop and mobile shells (Tauri / Capacitor)
// load bundled files, so they set NEXT_PUBLIC_API_BASE to the deployed URL.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
