import { z } from 'zod';

/* ============================================
   PASSWORD VALIDATION HELPERS
   ============================================ */

const passwordRequirements = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/* ============================================
   AUTH SCHEMAS
   ============================================ */

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be at most 50 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be at most 50 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: passwordRequirements,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const otpSchema = z.object({
  email: z.string().email(),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export type OtpFormValues = z.infer<typeof otpSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: passwordRequirements,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/* ============================================
   PROFILE & SETTINGS SCHEMAS
   ============================================ */

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordRequirements,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const updateSettingsSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
  reminderTime: z.string().min(1, 'Reminder time is required'),
  theme: z.enum(['light', 'dark', 'system']),
  emailNotifications: z.boolean(),
  dailyReminder: z.boolean(),
  weeklySummary: z.boolean(),
  achievementAlerts: z.boolean(),
});

export type UpdateSettingsFormValues = z.infer<typeof updateSettingsSchema>;

/* ============================================
   PASSWORD STRENGTH HELPERS
   ============================================ */

export function getPasswordStrength(password: string): {
  score: number;
  label: 'weak' | 'medium' | 'strong';
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'weak', color: 'bg-error-500' };
  if (score <= 4) return { score, label: 'medium', color: 'bg-accent-500' };
  return { score, label: 'strong', color: 'bg-success-500' };
}

export function checkPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}
