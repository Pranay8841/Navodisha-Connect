import apiClient from './client';
import {
  ReviewVerificationRequest,
  UpdateUserStatusRequest,
  UserResponse,
  VerificationItemResponse,
} from './types';

export const adminApi = {
  /**
   * Lists all pending verification requests awaiting review (Restricted to PLATFORM_ADMIN)
   */
  async getPendingVerifications(): Promise<VerificationItemResponse[]> {
    const res = await apiClient.get<VerificationItemResponse[]>('/api/v1/admin/verifications');
    return res.data || [];
  },

  /**
   * Reviews and approves or rejects a verification request
   */
  async reviewVerification(
    requestId: string,
    data: ReviewVerificationRequest
  ): Promise<VerificationItemResponse> {
    const res = await apiClient.patch<VerificationItemResponse>(
      `/api/v1/admin/verifications/${requestId}/review`,
      data
    );
    return res.data;
  },

  /**
   * Lists all users pending verification (Alumni, JNV Admins)
   */
  async getPendingUsers(): Promise<UserResponse[]> {
    const res = await apiClient.get<UserResponse[]>('/api/v1/admin/users/pending');
    return res.data || [];
  },

  /**
   * Updates an account's verification or standing status (ACTIVE, PENDING_VERIFICATION, SUSPENDED)
   */
  async updateUserStatus(userId: string, data: UpdateUserStatusRequest): Promise<UserResponse> {
    const res = await apiClient.patch<UserResponse>(`/api/v1/admin/users/${userId}/status`, data);
    return res.data;
  },
};
