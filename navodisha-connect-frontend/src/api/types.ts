export type Role = 'STUDENT' | 'ALUMNUS' | 'JNV_ADMIN' | 'PLATFORM_ADMIN';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export type HouseType = 'ARAVALI' | 'NILGIRI' | 'SHIVALIK' | 'UDAYGIRI';
export type ClassLevelType = 'Class 10' | 'Class 11' | 'Class 12';
export type StreamType = 'Science (PCM)' | 'Science (PCB)' | 'Science (PCMB)' | 'Commerce' | 'Arts';

export interface UserResponse {
  id: string;
  phoneNumber: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  jnvName: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInMs: number;
  user: UserResponse;
}

export interface SendOtpResponse {
  message: string;
  cooldownSeconds: number;
}

export interface VerifyOtpResponse {
  verified: boolean;
  userExists: boolean;
  message: string;
  signupToken?: string | null;
  auth?: AuthResponse | null;
}

export interface RegisterRequest {
  signupToken: string;
  fullName: string;
  role: Role;
  jnvName: string;
}

export interface StudentProfileRequest {
  joinBatchYear: number;
  classLevel: ClassLevelType;
  stream?: StreamType;
  house?: HouseType;
  preparingFor?: string[];
}

export interface AlumniProfileRequest {
  joinBatchYear: number;
  currentOrg?: string;
  designation?: string;
  currentCity?: string;
  bio?: string;
  provideMentorshipsOn?: string[];
  willingModes?: string[];
  openToHelp?: boolean;
}

export interface JnvAdminProfileRequest {
  designation: string;
  isAlumniCoordinator?: boolean;
}

export interface UserProfileResponse {
  id: string;
  phoneNumber: string;
  fullName: string;
  email?: string;
  role: Role;
  status: UserStatus;
  jnvName: string;
  studentDetails?: any;
  alumniDetails?: any;
  jnvAdminDetails?: any;
  createdAt?: string;
}

export interface VerificationItemResponse {
  id: string;
  userId: string;
  applicantName?: string;
  applicantPhone?: string;
  applicantRole?: Role;
  applicantJnvName?: string;
  // Fallbacks for compatibility
  userFullName?: string;
  userPhone?: string;
  userRole?: Role;
  jnvName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}
