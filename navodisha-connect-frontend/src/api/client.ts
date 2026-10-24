import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:8081';
  }

  // Automatically extract host machine IP from Expo Go connection
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp) {
      return `http://${hostIp}:8081`;
    }
  }

  return 'http://192.168.1.10:8081';
}

export const API_BASE_URL = getApiBaseUrl();

export const ACCESS_TOKEN_KEY = 'nc_access_token';
export const REFRESH_TOKEN_KEY = 'nc_refresh_token';
export const SIGNUP_TOKEN_KEY = 'nc_signup_token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT Access Token
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await storage.getItem(ACCESS_TOKEN_KEY);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Could not read access token from storage:', error);
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const refreshRes = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });
          const newAccessToken = refreshRes.data.accessToken;
          const newRefreshToken = refreshRes.data.refreshToken;

          await storage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
          await storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        await storage.deleteItem(ACCESS_TOKEN_KEY);
        await storage.deleteItem(REFRESH_TOKEN_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
