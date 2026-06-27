import apiClient from './client';
import type {
  LearningClass,
  PlanResponse,
  ScheduleResponse,
  PlanAssignmentRequest,
  PaginatedResponse,
} from '@/types';

// ─── Upload ──────────────────────────────────────────────
export async function uploadExcelPreview(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/uploads/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function confirmExcelImport(file: File, subjectId: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/uploads/import?subjectId=${subjectId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getUploadHistory(): Promise<any[]> {
  const response = await apiClient.get('/uploads/history');
  return response.data;
}

export async function resetUserData(subjectId?: string): Promise<void> {
  const url = subjectId ? `/uploads/reset?subjectId=${subjectId}` : '/uploads/reset';
  await apiClient.delete(url);
}

// ─── Subjects ────────────────────────────────────────────
export interface SubjectData {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export async function getSubjects(): Promise<SubjectData[]> {
  const response = await apiClient.get<SubjectData[]>('/subjects');
  return response.data;
}

export async function createSubject(data: { name: string; color: string; description?: string }): Promise<SubjectData> {
  const response = await apiClient.post<SubjectData>('/subjects', data);
  return response.data;
}

export async function updateSubject(id: string, data: { name: string; color: string; description?: string }): Promise<SubjectData> {
  const response = await apiClient.put<SubjectData>(`/subjects/${id}`, data);
  return response.data;
}

export async function deleteSubject(id: string): Promise<void> {
  await apiClient.delete(`/subjects/${id}`);
}

// ─── Classes ─────────────────────────────────────────────
export async function getClasses(search: string, page: number, size: number, subjectId?: string): Promise<PaginatedResponse<LearningClass>> {
  const response = await apiClient.get<PaginatedResponse<LearningClass>>('/planner/classes', {
    params: { search, page, size, subjectId },
  });
  return response.data;
}

export async function getPlannedClassIds(): Promise<string[]> {
  const response = await apiClient.get<string[]>('/planner/classes/planned-ids');
  return response.data;
}

// ─── Plans ───────────────────────────────────────────────
export async function createPlan(data: PlanAssignmentRequest & { subjectId?: string }): Promise<PlanResponse> {
  const response = await apiClient.post<PlanResponse>('/planner/plans', data);
  return response.data;
}

export async function getPlans(): Promise<PlanResponse[]> {
  const response = await apiClient.get<PlanResponse[]>('/planner/plans');
  return response.data;
}

export async function updatePlan(planId: string, data: {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  subjectId?: string;
}): Promise<PlanResponse> {
  const response = await apiClient.put<PlanResponse>(`/planner/plans/${planId}`, data);
  return response.data;
}

export async function deletePlan(planId: string): Promise<void> {
  await apiClient.delete(`/planner/plans/${planId}`);
}

// ─── Schedules ───────────────────────────────────────────
export async function getPlanSchedules(planId: string): Promise<ScheduleResponse[]> {
  const response = await apiClient.get<ScheduleResponse[]>(`/planner/plans/${planId}/schedules`);
  return response.data;
}

export async function getAllSchedules(): Promise<ScheduleResponse[]> {
  const response = await apiClient.get<ScheduleResponse[]>('/planner/schedules/all');
  return response.data;
}

export async function completeSchedule(scheduleId: string): Promise<ScheduleResponse> {
  const response = await apiClient.patch<ScheduleResponse>(`/planner/schedules/${scheduleId}/complete`);
  return response.data;
}

export async function rescheduleClass(scheduleId: string, newDate: string): Promise<ScheduleResponse> {
  const response = await apiClient.put<ScheduleResponse>(
    `/planner/schedules/${scheduleId}/reschedule`,
    null,
    { params: { newDate } }
  );
  return response.data;
}
