import apiClient from './client';
import { SubmitVerificationRequest, VerificationItemResponse } from './types';

export const verificationApi = {
  /**
   * Fetches latest verification status for authenticated user (Alumni, JNV Admin).
   * Returns null if no verification request has been submitted yet.
   */
  async getMyVerification(): Promise<VerificationItemResponse | null> {
    try {
      const res = await apiClient.get<VerificationItemResponse>('/api/v1/verifications/my');
      return res.data || null;
    } catch (e: any) {
      if (e.response?.status === 404) {
        return null;
      }
      throw e;
    }
  },

  /**
   * Submits a verification request with optional remarks for Platform Admin review.
   */
  async submitVerification(remarks?: string): Promise<VerificationItemResponse> {
    const payload: SubmitVerificationRequest = { remarks: remarks?.trim() || undefined };
    const res = await apiClient.post<VerificationItemResponse>('/api/v1/verifications', payload);
    return res.data;
  },
};
