import type { UserPreferences, UpdatePreferencesRequest } from '@proofed/shared';
import { API_BASE } from './config';

// Auth token getter - will be set by AuthContext
let getAuthToken: (() => Promise<string | null>) | null = null;

export function setPreferencesAuthTokenGetter(getter: () => Promise<string | null>) {
  getAuthToken = getter;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (getAuthToken) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const preferencesApi = {
  get: () => request<UserPreferences>('/preferences'),
  update: (data: UpdatePreferencesRequest) =>
    request<UserPreferences>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
