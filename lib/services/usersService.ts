import { apiClient } from '@/lib/api';

interface UpdateProfileData {
  fullName?: string;
  phone?: string;
}

export const usersService = {
  async updateProfile(data: UpdateProfileData) {
    const token = apiClient.getToken();
    if (!token) throw new Error('Not authenticated');

    try {
      // Try API call if endpoint exists, otherwise use localStorage
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = {
          ...user,
          fullName: data.fullName || user.fullName,
          phone: data.phone || user.phone,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async uploadAvatar(avatarUrl: string) {
    const token = apiClient.getToken();
    if (!token) throw new Error('Not authenticated');

    try {
      // Update avatar in localStorage
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = {
          ...user,
          avatarUrl: avatarUrl,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },
};




