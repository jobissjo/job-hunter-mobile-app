import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { tokenStorage } from './storage';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'https://job-haunt-fastapi-backend.onrender.com/api';
  }
  // const debuggerHost = Constants.expoConfig?.hostUri;
  // const localhost = debuggerHost ? debuggerHost.split(':')[0] : '192.168.1.36';
  // return `http://${localhost}:8000/api`;
  return 'https://job-haunt-fastapi-backend.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Inject Authorization Header
  const token = await tokenStorage.getToken();
  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...restOptions,
    headers: {
      ...authHeaders,
      ...headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Handle unauthorized status
    if (response.status === 401) {
      await tokenStorage.removeToken();
      // Throw special error for intercepting in Context/Screens
      throw new Error('Unauthorized');
    }

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      throw { response: { status: response.status, data } };
    }

    return data;
  } catch (error: any) {
    if (error.response) {
      throw error;
    }
    throw new Error(error.message || 'Network request failed');
  }
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) => 
    request<T>(endpoint, { method: 'GET', params }),
  post: <T>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => 
    request<T>(endpoint, { method: 'DELETE' }),
};

// Notes API
export const notesAPI = {
  getAll: (resourceId: string) => api.get<any>(`/notes`, { resource_id: resourceId }),
  create: (data: { resource_id: string; title: string; content: string; priority: string }) => 
    api.post<any>('/notes', data),
  update: (noteId: string, data: { title?: string; content?: string; priority?: string }) => 
    api.put<any>(`/notes/${noteId}`, data),
  delete: (noteId: string) => api.delete<any>(`/notes/${noteId}`),
};

// Todos API
export const todosAPI = {
  getAll: (resourceId: string) => api.get<any>(`/todos`, { resource_id: resourceId }),
  create: (data: { resource_id: string; title: string; is_completed: boolean }) => 
    api.post<any>('/todos', data),
  update: (todoId: string, data: { title?: string; is_completed?: boolean }) => 
    api.put<any>(`/todos/${todoId}`, data),
  delete: (todoId: string) => api.delete<any>(`/todos/${todoId}`),
};

// Activity Logs API
export const activityLogsAPI = {
  getAll: (limit: number = 20, offset: number = 0) => 
    api.get<any>(`/activity-logs/`, { limit, offset }),
};
