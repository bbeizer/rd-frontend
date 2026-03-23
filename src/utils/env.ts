export function getEnv(key: string, fallback?: string): string | undefined {
  return (import.meta.env[key] as string | undefined) ?? fallback;
}
