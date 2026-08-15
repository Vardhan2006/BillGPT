import type {
  SavedComparison,
  SavedComparisonCreate,
  SearchComparisonResult,
  Token,
  User,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const TOKEN_KEY = 'billgpt_token';
export const USER_KEY = 'billgpt_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        }
      }
    } catch {
      // Use fallback status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  auth: {
    register: (email: string, password: string): Promise<Token> =>
      request<Token>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    login: (email: string, password: string): Promise<Token> =>
      request<Token>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    getMe: (): Promise<User> => request<User>('/api/auth/me'),
  },

  deals: {
    search: (query?: string): Promise<SearchComparisonResult[]> => {
      const params = query ? `?q=${encodeURIComponent(query.trim())}` : '';
      return request<SearchComparisonResult[]>(`/api/deals/search${params}`);
    },
  },

  comparisons: {
    list: (): Promise<SavedComparison[]> =>
      request<SavedComparison[]>('/api/saved-comparisons'),

    create: (data: SavedComparisonCreate): Promise<SavedComparison> =>
      request<SavedComparison>('/api/saved-comparisons', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    delete: (id: number): Promise<{ detail: string; id: number }> =>
      request<{ detail: string; id: number }>(`/api/saved-comparisons/${id}`, {
        method: 'DELETE',
      }),
  },
};
