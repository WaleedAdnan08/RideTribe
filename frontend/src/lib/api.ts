export const API_BASE_URL = 'http://localhost:8000/api/v1';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiRequestOptions extends RequestInit {
  data?: any;
}

async function request<T>(endpoint: string, method: RequestMethod, options: ApiRequestOptions = {}): Promise<T> {
  const { data, headers, ...customConfig } = options;

  const token = localStorage.getItem('authToken');

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...customConfig,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making request to: ${url}`, config);
  let response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    console.error(`Network error fetching ${url}:`, error);
    throw error;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || response.statusText || 'API request failed');
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) => request<T>(endpoint, 'GET', options),
  post: <T>(endpoint: string, data: any, options?: ApiRequestOptions) => request<T>(endpoint, 'POST', { ...options, data }),
  put: <T>(endpoint: string, data: any, options?: ApiRequestOptions) => request<T>(endpoint, 'PUT', { ...options, data }),
  patch: <T>(endpoint: string, data: any, options?: ApiRequestOptions) => request<T>(endpoint, 'PATCH', { ...options, data }),
  delete: <T>(endpoint: string, options?: ApiRequestOptions) => request<T>(endpoint, 'DELETE', options),
};

export const tribeApi = {
  list: () => api.get<any[]>('/tribes'),
  create: (name: string) => api.post<any>('/tribes', { name }),
  getMembers: (tribeId: string) => api.get<any[]>(`/tribes/${tribeId}/members`),
  invite: (tribeId: string, phoneNumber: string, trustLevel: string) =>
    api.post<any>(`/tribes/${tribeId}/invite`, { phone_number: phoneNumber, trust_level: trustLevel }),
};
export const destinationsApi = {
  list: () => api.get<any[]>('/destinations'),
  create: (data: any) => api.post<any>('/destinations', data),
};

export const schedulesApi = {
  list: () => api.get<any[]>('/schedules'),
  create: (data: any) => api.post<any>('/schedules', data),
  delete: (id: string) => api.delete<void>(`/schedules/${id}`),
};

export const matchesApi = {
  list: () => api.get<any[]>('/matches'),
  updateStatus: (id: string, status: string) => api.patch<any>(`/matches/${id}`, { status }),
};

export default api;