import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Fallback to local network IP for mobile device access; localhost for web
const defaultBaseUrl = Platform.OS === 'web' 
  ? 'http://localhost:8081' 
  : 'http://192.168.1.11:8081';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || defaultBaseUrl;

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
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // If running in environment where SecureStore is unavailable
    console.warn('Could not read access token from SecureStore:', error);
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
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const refreshRes = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });
          const newAccessToken = refreshRes.data.accessToken;
          const newRefreshToken = refreshRes.data.refreshToken;

          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken);
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh token failed, clear tokens
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
