import axios from 'axios';
import { 
  Project, Milestone, ProgressUpdate, FinancialTransaction, 
  IssueRisk, Inspection, DocumentRecord, RiskAlert, 
  DashboardSummary, ChatResponse, User 
} from '../types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token if stored
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('up_dss_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('up_dss_token', res.data.access_token);
      localStorage.setItem('up_dss_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('up_dss_token');
    localStorage.removeItem('up_dss_user');
  },
  getCurrentUser: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  getDemoUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/auth/demo-users');
    return res.data;
  },

  // Dashboard
  getDashboardSummary: async (params?: Record<string, any>): Promise<DashboardSummary> => {
    const res = await apiClient.get('/dashboard/summary', { params });
    return res.data;
  },
  getDashboardCharts: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/dashboard/charts', { params });
    return res.data;
  },

  // Projects
  getProjects: async (params?: Record<string, any>): Promise<Project[]> => {
    const res = await apiClient.get('/projects', { params });
    return res.data;
  },
  getProjectDetails: async (projectId: string) => {
    const res = await apiClient.get(`/projects/${projectId}`);
    return res.data;
  },
  createProject: async (data: Partial<Project>): Promise<Project> => {
    const res = await apiClient.post('/projects', data);
    return res.data;
  },
  updateProject: async (projectId: string, data: Partial<Project>): Promise<Project> => {
    const res = await apiClient.put(`/projects/${projectId}`, data);
    return res.data;
  },

  // Milestones
  getMilestones: async (): Promise<Milestone[]> => {
    const res = await apiClient.get('/milestones');
    return res.data;
  },
  createMilestone: async (data: Partial<Milestone>): Promise<Milestone> => {
    const res = await apiClient.post('/milestones', data);
    return res.data;
  },
  updateMilestone: async (milestoneId: string, data: Partial<Milestone>): Promise<Milestone> => {
    const res = await apiClient.put(`/milestones/${milestoneId}`, data);
    return res.data;
  },

  // Financials
  getFinancialTransactions: async (projectId?: string): Promise<FinancialTransaction[]> => {
    const res = await apiClient.get('/financials/transactions', { params: { project_id: projectId } });
    return res.data;
  },
  getFinancialSummary: async () => {
    const res = await apiClient.get('/financials/summary');
    return res.data;
  },
  recordTransaction: async (data: Partial<FinancialTransaction>): Promise<FinancialTransaction> => {
    const res = await apiClient.post('/financials/transactions', data);
    return res.data;
  },

  // Risks & Issues
  getRiskAlerts: async (params?: Record<string, any>): Promise<RiskAlert[]> => {
    const res = await apiClient.get('/risks/alerts', { params });
    return res.data;
  },
  getIssues: async (projectId?: string): Promise<IssueRisk[]> => {
    const res = await apiClient.get('/risks/issues', { params: { project_id: projectId } });
    return res.data;
  },
  createIssue: async (data: Partial<IssueRisk>): Promise<IssueRisk> => {
    const res = await apiClient.post('/risks/issues', data);
    return res.data;
  },
  updateIssue: async (issueId: string, data: Partial<IssueRisk>): Promise<IssueRisk> => {
    const res = await apiClient.put(`/risks/issues/${issueId}`, data);
    return res.data;
  },

  // Progress
  getProgressUpdates: async (projectId?: string): Promise<ProgressUpdate[]> => {
    const res = await apiClient.get('/progress', { params: { project_id: projectId } });
    return res.data;
  },
  submitProgress: async (data: Partial<ProgressUpdate>): Promise<ProgressUpdate> => {
    const res = await apiClient.post('/progress', data);
    return res.data;
  },
  verifyProgress: async (updateId: string): Promise<ProgressUpdate> => {
    const res = await apiClient.put(`/progress/${updateId}/verify`);
    return res.data;
  },

  // Inspections
  getInspections: async (projectId?: string): Promise<Inspection[]> => {
    const res = await apiClient.get('/inspections', { params: { project_id: projectId } });
    return res.data;
  },
  recordInspection: async (data: Partial<Inspection>): Promise<Inspection> => {
    const res = await apiClient.post('/inspections', data);
    return res.data;
  },

  // Documents
  getDocuments: async (params?: Record<string, any>): Promise<DocumentRecord[]> => {
    const res = await apiClient.get('/documents', { params });
    return res.data;
  },
  getDocumentDetails: async (docId: string) => {
    const res = await apiClient.get(`/documents/${docId}`);
    return res.data;
  },

  // Uploads & Ingestion
  uploadFile: async (formData: FormData) => {
    const res = await apiClient.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getUploadStatus: async (jobId: string) => {
    const res = await apiClient.get(`/uploads/${jobId}/status`);
    return res.data;
  },
  commitUpload: async (jobId: string) => {
    const res = await apiClient.post(`/uploads/${jobId}/commit`);
    return res.data;
  },

  // AI Assistant Chat
  askAssistant: async (question: string, projectId?: string): Promise<ChatResponse> => {
    const res = await apiClient.post('/chat', { question, project_id: projectId });
    return res.data;
  },

  // Reports
  getExportUrl: (reportType: string, format: 'csv' | 'pdf') => {
    return `/api/reports/export?report_type=${reportType}&format=${format}`;
  },

  // Audit Logs & Users
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/users');
    return res.data;
  },
  createUser: async (data: any): Promise<User> => {
    const res = await apiClient.post('/users', data);
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await apiClient.get('/audit-logs');
    return res.data;
  }
};
