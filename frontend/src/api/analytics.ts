import apiClient from './client';

export async function getAnalytics(startDate: string, endDate: string): Promise<any> {
  const response = await apiClient.get('/analytics', {
    params: { startDate, endDate },
  });
  return response.data;
}

export async function downloadExcelReport(): Promise<Blob> {
  const response = await apiClient.get('/analytics/export', {
    responseType: 'blob',
  });
  return response.data;
}
