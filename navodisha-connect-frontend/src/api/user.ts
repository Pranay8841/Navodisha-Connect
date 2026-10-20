import apiClient from './client';
import {
  AlumniProfileRequest,
  JnvAdminProfileRequest,
  StudentProfileRequest,
  UserProfileResponse,
} from './types';

export const userApi = {
  /**
   * Fetch current authenticated user's profile and role details
   */
  async getMe(): Promise<UserProfileResponse> {
    const res = await apiClient.get<UserProfileResponse>('/api/v1/users/me');
    return res.data;
  },

  /**
   * Update student academic profile details (Step 2)
   */
  async updateStudentProfile(data: StudentProfileRequest): Promise<UserProfileResponse> {
    const res = await apiClient.put<UserProfileResponse>('/api/v1/users/profile/student', data);
    return res.data;
  },

  /**
   * Update alumni career & mentorship details (Step 2)
   */
  async updateAlumniProfile(data: AlumniProfileRequest): Promise<UserProfileResponse> {
    const res = await apiClient.put<UserProfileResponse>('/api/v1/users/profile/alumnus', data);
    return res.data;
  },

  /**
   * Update JNV admin staff details (Step 2)
   */
  async updateJnvAdminProfile(data: JnvAdminProfileRequest): Promise<UserProfileResponse> {
    const res = await apiClient.put<UserProfileResponse>('/api/v1/users/profile/jnv-admin', data);
    return res.data;
  },
};
