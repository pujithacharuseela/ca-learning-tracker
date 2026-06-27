import apiClient from './client';
import type {
  LearningClass,
  PlanResponse,
  ScheduleResponse,
  PlanAssignmentRequest,
  PaginatedResponse,
} from '@/types';

export async function uploadExcelPreview(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/uploads/preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function confirmExcelImport(file: File, preview: any): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/uploads/import', preview, {
    params: { file },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getUploadHistory(): Promise<any[]> {
  const response = await apiClient.get('/uploads/history');
  return response.data;
}

export async function getClasses(
  search: string,
  page: number,
  size: number
): Promise<PaginatedResponse<LearningClass>> {
  const response = await apiClient.get<PaginatedResponse<LearningClass>>('/planner/classes', {
    params: { search, page, size },
  });
  return response.data;
}

export async function createPlan(data: PlanAssignmentRequest): Promise<PlanResponse> {
  const response = await apiClient.post<PlanResponse>('/planner/plans', data);
  return response.data;
}

export async function getPlans(): Promise<PlanResponse[]> {
  const response = await apiClient.get<PlanResponse[]>('/planner/plans');
  return response.data;
}

export async function getPlanSchedules(planId: string): Promise<ScheduleResponse[]> {
  const response = await apiClient.get<ScheduleResponse[]>(`/planner/plans/${planId}/schedules`);
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
