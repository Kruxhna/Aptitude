import axios from 'axios';
import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator
const API_URL = __DEV__ 
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api')
  : 'https://production-api.example.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const api = {
  getSprint: async (type: string) => {
    const response = await apiClient.get(`/sprint`, { params: { type } });
    return response.data;
  },
  submitSprint: async (payload: { sprintId: string; answers: any[] }) => {
    const response = await apiClient.post(`/sprint/submit`, payload);
    return response.data;
  },
  getProgress: async () => {
    const response = await apiClient.get(`/analytics/progress`);
    return response.data;
  },
  getHistory: async () => {
    const response = await apiClient.get(`/analytics/history`);
    return response.data;
  },
  getLeaderboard: async () => {
    const response = await apiClient.get(`/leaderboard`);
    return response.data;
  }
};
