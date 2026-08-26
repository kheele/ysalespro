import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function authFetch(endpoint: string, idToken?: string): Promise<Response> {
  if (!endpoint || endpoint === 'undefined') throw new Error('authFetch: invalid endpoint');
  return fetch(endpoint, {
    headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
  });
}

export function toTitleCase(str?: string | null): string {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}
