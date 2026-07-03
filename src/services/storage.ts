import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'job_hunter_token';
const USER_KEY = 'job_hunter_user';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export const tokenStorage = {
  saveToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token', error);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token', error);
      return null;
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token', error);
    }
  },
};

export const userStorage = {
  saveUser: async (user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user', error);
    }
  },

  getUser: async (): Promise<User | null> => {
    try {
      const userStr = await AsyncStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting user', error);
      return null;
    }
  },

  removeUser: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error removing user', error);
    }
  },
};
