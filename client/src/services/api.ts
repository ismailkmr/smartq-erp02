/**
 * API utility functions for communicating with the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiResponse<T> {
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any;
}

/**
 * Generic API request function
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('authToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'API Error';
    throw new Error(errorMessage);
  }
}

/**
 * Login with Firebase ID token
 */
export async function loginUser(idToken: string) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

/**
 * Get current user information
 */
export async function getCurrentUser() {
  return request('/current-user', {
    method: 'GET',
  });
}

/**
 * Logout user
 */
export async function logoutUser() {
  return request('/logout', {
    method: 'POST',
  });
}

/**
 * Add a new user to Firestore (alternative method)
 */
export async function addUser(name: string, email: string) {
  return request('/add-user', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}

/**
 * Get all users
 */
export async function getUsers() {
  return request('/users', {
    method: 'GET',
  });
}
