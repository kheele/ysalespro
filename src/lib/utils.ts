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
