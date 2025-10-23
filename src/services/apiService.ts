const API_BASE_URL = 'http://localhost:3001/api';

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

// Generic API fetch function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// API Service functions
export const apiService = {
  // Health check
  health: () => apiRequest('/health'),

  // Deliveries API
  deliveries: {
    getAll: () => apiRequest<any[]>('/deliveries'),
    getByCustomer: (email: string) => apiRequest<any[]>(`/deliveries/customer/${email}`),
    getByDriver: (driverId: string) => apiRequest<any[]>(`/deliveries/driver/${driverId}`),
    updateStatus: (id: string, status: string, driverId?: string, location?: any) =>
      apiRequest(`/deliveries/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, driverId, location }),
      }),
  },

  // Drivers API
  drivers: {
    getAll: () => apiRequest<any[]>('/drivers'),
    update: (id: string, data: any) =>
      apiRequest(`/drivers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Profile API
  profile: {
    get: (email: string) => apiRequest<any>(`/profile/${email}`),
    update: (email: string, data: any) =>
      apiRequest(`/profile/${email}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};

export default apiService;
