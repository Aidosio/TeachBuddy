const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7001";

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
    generateMaterials: (id: string) =>
      `${API_BASE}/lessons/${id}/generate-materials`,
    generateTests: (id: string) => `${API_BASE}/lessons/${id}/generate-tests`,
    generatePresentation: (id: string) =>
      `${API_BASE}/lessons/${id}/generate-presentation`,
    questionTypes: (id: string) => `${API_BASE}/lessons/${id}/question-types`,
    versions: (lessonId: string, type: string) =>
      `${API_BASE}/lessons/${lessonId}/versions?type=${type}`,
    version: (lessonId: string, versionId: string) =>
      `${API_BASE}/lessons/${lessonId}/versions/${versionId}`,
    approvePlan: (id: string) => `${API_BASE}/lessons/${id}/approve-plan`,
    approveMaterials: (id: string) =>
      `${API_BASE}/lessons/${id}/approve-materials`,
    approveTests: (id: string) => `${API_BASE}/lessons/${id}/approve-tests`,
    approvePresentation: (id: string) =>
      `${API_BASE}/lessons/${id}/approve-presentation`,
    exportPdf: (id: string) => `${API_BASE}/lessons/${id}/export-pdf`,
    exportPptx: (id: string) => `${API_BASE}/lessons/${id}/export-pptx`,
  },
  feedback: {
    generate: `${API_BASE}/feedback/generate`,
  },
  presets: {
    list: `${API_BASE}/ai/presets`,
    detail: (id: string) => `${API_BASE}/ai/presets/${id}`,
    create: `${API_BASE}/ai/presets`,
    update: (id: string) => `${API_BASE}/ai/presets/${id}`,
    delete: (id: string) => `${API_BASE}/ai/presets/${id}`,
  },
};
