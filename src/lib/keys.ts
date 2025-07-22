'use client';

const API_KEY_STORAGE_ITEM = 'google-ai-api-key';

export function setApiKey(apiKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEY_STORAGE_ITEM, apiKey);
  }
}

export function getApiKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(API_KEY_STORAGE_ITEM);
  }
  return null;
}
