import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';
import { tokenStorage, userStorage, User } from '@/services/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    username: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await tokenStorage.getToken();
        const storedUser = await userStorage.getUser();
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<any>('/users/login/', {
        username: email,
        password,
      });

      const responseData = response.data;
      if (!responseData || !responseData.access_token) {
        throw new Error('Invalid server response');
      }

      const { access_token: access, user: userData } = responseData;

      await tokenStorage.saveToken(access);
      await userStorage.saveUser(userData);
      
      setToken(access);
      setUser(userData);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    username: string;
    password: string;
  }) => {
    try {
      await api.post<any>('/users/', {
        ...userData,
        role: 'user',
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await tokenStorage.removeToken();
      await userStorage.removeUser();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
