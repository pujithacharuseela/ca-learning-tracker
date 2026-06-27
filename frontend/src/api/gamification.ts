import apiClient from './client';
import type { Badge, UserAchievement } from '@/types';

export async function getBadges(): Promise<Badge[]> {
  const response = await apiClient.get<Badge[]>('/gamification/badges');
  return response.data;
}

export async function getAchievements(): Promise<UserAchievement[]> {
  const response = await apiClient.get<UserAchievement[]>('/gamification/achievements');
  return response.data;
}

export async function getStreak(): Promise<{ currentStreak: number }> {
  const response = await apiClient.get<{ currentStreak: number }>('/gamification/streak');
  return response.data;
}

export async function evaluateAchievements(): Promise<UserAchievement[]> {
  const response = await apiClient.post<UserAchievement[]>('/gamification/evaluate');
  return response.data;
}
