const API_URL = ''; // Uses Vite proxy config (relative requests)

const getHeaders = (endpoint = '') => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && !endpoint.startsWith('/auth/')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch (e) {
      errorMessage = `${errorMessage} (HTTP ${response.status})`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_URL}/api${endpoint}`, {
      method: 'GET',
      headers: getHeaders(endpoint),
    });
    return handleResponse(res);
  },

  post: async (endpoint, data) => {
    const res = await fetch(`${API_URL}/api${endpoint}`, {
      method: 'POST',
      headers: getHeaders(endpoint),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  put: async (endpoint, data) => {
    const res = await fetch(`${API_URL}/api${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(endpoint),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (endpoint) => {
    const res = await fetch(`${API_URL}/api${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(endpoint),
    });
    return handleResponse(res);
  },
};
