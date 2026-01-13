// API Client for making authenticated requests
class ApiClient {
  private token: string | null = null;
  private baseUrl: string = '';

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined' && !token) {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  async request(url: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `/api${url.startsWith('/') ? url : '/' + url}`;
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();




