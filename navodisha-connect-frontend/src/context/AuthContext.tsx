import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../api/storage';
import { ACCESS_TOKEN_KEY, SIGNUP_TOKEN_KEY } from '../api/client';
import { authApi } from '../api/auth';
import { userApi } from '../api/user';
import { Role, UserResponse, UserProfileResponse } from '../api/types';

interface AuthContextType {
  user: UserResponse | null;
  fullProfile: UserProfileResponse | null;
  pendingPhone: string;
  signupToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setPendingPhone: (phone: string) => void;
  sendOtp: (phone: string) => Promise<{ cooldownSeconds: number; message: string }>;
  verifyOtp: (otp: string) => Promise<{ userExists: boolean; message: string }>;
  registerUser: (fullName: string, role: Role, jnvName: string) => Promise<UserResponse>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [fullProfile, setFullProfile] = useState<UserProfileResponse | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on app launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedAccessToken = await storage.getItem(ACCESS_TOKEN_KEY);
        const storedSignupToken = await storage.getItem(SIGNUP_TOKEN_KEY);

        if (storedSignupToken) {
          setSignupToken(storedSignupToken);
        }

        if (storedAccessToken) {
          try {
            const profile = await userApi.getMe();
            const userObj: UserResponse = {
              id: profile.id,
              phoneNumber: profile.phoneNumber,
              fullName: profile.fullName,
              email: profile.email,
              role: profile.role,
              status: profile.status,
              jnvName: profile.jnvName,
              isVerified: profile.status === 'ACTIVE',
            };
            setUser(userObj);
            setFullProfile(profile);
          } catch (err) {
            console.warn('Session expired or backend offline:', err);
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const sendOtp = async (phone: string) => {
    setPendingPhone(phone);
    const res = await authApi.sendOtp(phone);
    return { cooldownSeconds: res.cooldownSeconds, message: res.message };
  };

  const verifyOtp = async (otp: string) => {
    const res = await authApi.verifyOtp(pendingPhone, otp);
    if (res.signupToken) {
      setSignupToken(res.signupToken);
    }
    if (res.auth) {
      setUser(res.auth.user);
      await refreshProfile();
    }
    return { userExists: res.userExists, message: res.message };
  };

  const registerUser = async (fullName: string, role: Role, jnvName: string) => {
    if (!signupToken) {
      throw new Error('No signup verification token available. Please verify OTP first.');
    }
    const authRes = await authApi.register({
      signupToken,
      fullName,
      role,
      jnvName,
    });
    setUser(authRes.user);
    setSignupToken(null);
    return authRes.user;
  };

  const refreshProfile = async () => {
    try {
      const profile = await userApi.getMe();
      const userObj: UserResponse = {
        id: profile.id,
        phoneNumber: profile.phoneNumber,
        fullName: profile.fullName,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        jnvName: profile.jnvName,
        isVerified: profile.status === 'ACTIVE',
      };
      setUser(userObj);
      setFullProfile(profile);
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setFullProfile(null);
    setSignupToken(null);
    setPendingPhone('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        fullProfile,
        pendingPhone,
        signupToken,
        isLoading,
        isAuthenticated: !!user,
        setPendingPhone,
        sendOtp,
        verifyOtp,
        registerUser,
        refreshProfile,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
