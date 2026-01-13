interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    role: string;
  };
  access_token: string;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const result = await response.json();
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        phone: result.user.phone,
        role: result.user.role || 'USER',
      },
      access_token: result.access_token,
    };
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        phone: result.user.phone,
        role: result.user.role || 'USER',
      },
      access_token: result.access_token,
    };
  },

  async logout(): Promise<void> {
    // Clear token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  },

  async getProfile(): Promise<{ user: AuthResponse['user'] }> {
    // For now, return user from localStorage
    // TODO: Create /api/auth/profile endpoint
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name || user.fullName,
            phone: user.phone,
            role: user.role || 'USER',
          },
        };
      }
    }
    throw new Error('Failed to get profile');
  },

  getGoogleAuthUrl(): string {
    // This would typically redirect to Supabase OAuth
    return '/auth/google';
  },

  getFacebookAuthUrl(): string {
    return '/auth/facebook';
  },

  getAppleAuthUrl(): string {
    return '/auth/apple';
  },
};





