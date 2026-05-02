const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function apiRequest(path, options = {}, userId = null) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': String(userId) } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}
