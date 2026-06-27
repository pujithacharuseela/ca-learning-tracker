/* ============================================
   ENUMS
   ============================================ */

export enum StudyStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/* ============================================
   USER & AUTH TYPES
   ============================================ */

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface UserSettings {
  id: number;
  timezone: string;
  reminderTime: string;
  theme: Theme;
  emailNotifications: boolean;
  dailyReminder: boolean;
  weeklySummary: boolean;
  achievementAlerts: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateSettingsRequest {
  timezone?: string;
  reminderTime?: string;
  theme?: Theme;
  emailNotifications?: boolean;
  dailyReminder?: boolean;
  weeklySummary?: boolean;
  achievementAlerts?: boolean;
}

/* ============================================
   API RESPONSE TYPES
   ============================================ */

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  message: string;
  errors?: Record<string, string>;
  path: string;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

/* ============================================
   LEARNING TYPES (Phase 2+)
   ============================================ */

export interface LearningClass {
  id: string;
  classNo: number;
  topic: string;
  durationMinutes: number;
  durationDisplay: string;
  isActive: boolean;
  createdAt: string;
  subject?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface LearningPlan {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export interface PlanResponse {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
}

export interface ScheduleResponse {
  id: string;
  planId: string;
  planName?: string;
  planColor?: string;
  classId: string;
  classNo: number;
  topic: string;
  durationMinutes: number;
  durationDisplay: string;
  scheduledDate: string;
  status: string;
}

export interface PlanAssignmentRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  classIds: string[];
}

export interface Schedule {
  id: string;
  scheduledDate: string;
  status: string;
}

export interface StudySession {
  id: string;
  scheduleId: string;
  status: string;
  actualDurationMinutes: number;
  difficultyRating: number;
  overallRating: number;
  startedAt?: string;
  completedAt?: string;
}

export interface Note {
  id: string;
  sessionId: string;
  content: string;
}

export interface Badge {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  criteriaType: string;
  criteriaValue: number;
}

export interface UserAchievement {
  id: string;
  badge: Badge;
  earnedAt: string;
}

/* ============================================
   NAVIGATION TYPES
   ============================================ */

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  disabled?: boolean;
}
