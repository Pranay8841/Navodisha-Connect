import apiClient, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SIGNUP_TOKEN_KEY } from './client';
import { storage } from './storage';
import {
  AuthResponse,
  RegisterRequest,
  SendOtpResponse,
  VerifyOtpResponse,
} from './types';

export const authApi = {
  /**
   * Send 6-digit OTP code to phone number (E.164 format: +919876543210)
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    const res = await apiClient.post<SendOtpResponse>('/api/v1/auth/otp/send', {
      phoneNumber,
    });
    return res.data;
  },

  /**
   * Verify the 6-digit OTP code
   */
  async verifyOtp(phoneNumber: string, otp: string): Promise<VerifyOtpResponse> {
    const res = await apiClient.post<VerifyOtpResponse>('/api/v1/auth/otp/verify', {
      phoneNumber,
      otp,
    });

    if (res.data.signupToken) {
      await storage.setItem(SIGNUP_TOKEN_KEY, res.data.signupToken);
    }

    if (res.data.auth) {
      await storage.setItem(ACCESS_TOKEN_KEY, res.data.auth.accessToken);
      await storage.setItem(REFRESH_TOKEN_KEY, res.data.auth.refreshToken);
    }

    return res.data;
  },

  /**
   * Register new user (Step 1) using signup token
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/register', data);
    if (res.data) {
      await storage.setItem(ACCESS_TOKEN_KEY, res.data.accessToken);
      await storage.setItem(REFRESH_TOKEN_KEY, res.data.refreshToken);
      await storage.deleteItem(SIGNUP_TOKEN_KEY);
    }
    return res.data;
  },

  /**
   * Clear all tokens upon sign out
   */
  async logout(): Promise<void> {
    await storage.deleteItem(ACCESS_TOKEN_KEY);
    await storage.deleteItem(REFRESH_TOKEN_KEY);
    await storage.deleteItem(SIGNUP_TOKEN_KEY);
  },
};
