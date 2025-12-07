const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001';

export const endpoints = {
  auth: {
    login: `${API_BASE}/auth/login`,
    register: `${API_BASE}/auth/register`,
    me: `${API_BASE}/auth/me`,
  },
  courses: {
    list: `${API_BASE}/courses`,
    detail: (id: string) => `${API_BASE}/courses/${id}`,
    create: `${API_BASE}/courses`,
    update: (id: string) => `${API_BASE}/courses/${id}`,
    delete: (id: string) => `${API_BASE}/courses/${id}`,
    lessons: (id: string) => `${API_BASE}/courses/${id}/lessons`,
  },
  lessons: {
    detail: (id: string) => `${API_BASE}/lessons/${id}`,
    create: (courseId: string) => `${API_BASE}/courses/${courseId}/lessons`,
    update: (id: string) => `${API_BASE}/lessons/${id}`,
    delete: (id: string) => `${API_BASE}/lessons/${id}`,
    generatePlan: (id: string) => `${API_BASE}/lessons/${id}/generate-plan`,
    generateMaterials: (id: string) => `${API_BASE}/lessons/${id}/generate-materials`,
    generateTests: (id: string) => `${API_BASE}/lessons/${id}/generate-tests`,
  },
  feedback: {
    generate: `${API_BASE}/feedback/generate`,
  },
};

