import apiClient from './client';

export async function getDashboard(): Promise<any> {
  const response = await apiClient.get('/dashboard');
  return response.data;
}

export async function startSession(scheduleId: string): Promise<any> {
  const response = await apiClient.post('/sessions/start', { scheduleId });
  return response.data;
}

export async function completeSession(sessionId: string, data: {
  difficultyRating: number;
  overallRating: number;
  notes: string;
  status: string;
}): Promise<any> {
  const response = await apiClient.put(`/sessions/${sessionId}/complete`, data);
  return response.data;
}
