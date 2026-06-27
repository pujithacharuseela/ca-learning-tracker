import apiClient from './client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  MessageResponse,
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserSettings,
  UpdateSettingsRequest,
} from '@/types';

/* ============================================
   AUTH API
   ============================================ */

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data;
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/auth/forgot-password', data);
  return response.data;
}

export async function verifyOtp(data: VerifyOtpRequest): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/auth/verify-otp', data);
  return response.data;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/auth/reset-password', data);
  return response.data;
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/refresh', {
    refreshToken: token,
  });
  return response.data;
}

/* ============================================
   PROFILE API
   ============================================ */

export async function getProfile(): Promise<User> {
  const response = await apiClient.get<User>('/profile');
  return response.data;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const response = await apiClient.put<User>('/profile', data);
  return response.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
  const response = await apiClient.put<MessageResponse>('/profile/change-password', data);
  return response.data;
}

/* ============================================
   SETTINGS API
   ============================================ */

export async function getSettings(): Promise<UserSettings> {
  const response = await apiClient.get<UserSettings>('/settings');
  return response.data;
}

export async function updateSettings(data: UpdateSettingsRequest): Promise<UserSettings> {
  const response = await apiClient.put<UserSettings>('/settings', data);
  return response.data;
}
