const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function apiRequest(path, options = {}, userId = null) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': String(userId) } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    throw new Error(`${path}: API недоступне (${error.message})`);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || response.statusText || 'API request failed';
    const error = new Error(`${path}: ${message} (${response.status})`);
    error.status = response.status;
    error.path = path;
    error.details = data;
    throw error;
  }

  return data;
}
