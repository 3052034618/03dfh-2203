import { create } from "zustand";
import type {
  LineTemplate,
  AuditTask,
  ReviewTask,
  DashboardStats,
  ProbePoint,
  TemperatureZone,
} from "@/types";
import {
  mockTemplates,
  mockAuditTasks,
  mockReviewTasks,
  mockDashboardStats,
} from "@/mock";

interface AppState {
  templates: LineTemplate[];
  auditTasks: AuditTask[];
  reviewTasks: ReviewTask[];
  dashboardStats: DashboardStats;
  selectedTemplateId: string | null;
  selectedAuditId: string | null;
  selectedReviewId: string | null;

  setSelectedTemplate: (id: string | null) => void;
  setSelectedAudit: (id: string | null) => void;
  setSelectedReview: (id: string | null) => void;

  getTemplateById: (id: string) => LineTemplate | undefined;
  getAuditById: (id: string) => AuditTask | undefined;
  getReviewById: (id: string) => ReviewTask | undefined;

  addTemplate: (template: Omit<LineTemplate, "id" | "createdAt" | "updatedAt" | "usageCount">) => void;
  updateTemplate: (id: string, updates: Partial<LineTemplate>) => void;
  deleteTemplate: (id: string) => void;
  toggleTemplateStatus: (id: string) => void;
  duplicateTemplate: (id: string) => void;

  approveAudit: (id: string, remarks: string) => void;
  rejectAudit: (id: string, remarks: string, adjustments?: { pointId: string; x: number; y: number; description: string }[]) => void;

  saveReviewConclusion: (
    id: string,
    conclusion: {
      layoutRating: "good" | "fair" | "poor";
      optimizationSuggestions: string;
      effectivePoints: string[];
      blindSpots: string[];
    }
  ) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  templates: mockTemplates,
  auditTasks: mockAuditTasks,
  reviewTasks: mockReviewTasks,
  dashboardStats: mockDashboardStats,
  selectedTemplateId: null,
  selectedAuditId: null,
  selectedReviewId: null,

  setSelectedTemplate: (id) => set({ selectedTemplateId: id }),
  setSelectedAudit: (id) => set({ selectedAuditId: id }),
  setSelectedReview: (id) => set({ selectedReviewId: id }),

  getTemplateById: (id) => get().templates.find((t) => t.id === id),
  getAuditById: (id) => get().auditTasks.find((a) => a.id === id),
  getReviewById: (id) => get().reviewTasks.find((r) => r.id === id),

  addTemplate: (template) => {
    const newTemplate: LineTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };
    set((state) => ({
      templates: [newTemplate, ...state.templates],
      dashboardStats: {
        ...state.dashboardStats,
        templateCount: state.dashboardStats.templateCount + 1,
      },
    }));
  },

  updateTemplate: (id, updates) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
  },

  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      dashboardStats: {
        ...state.dashboardStats,
        templateCount: state.dashboardStats.templateCount - 1,
      },
    }));
  },

  toggleTemplateStatus: (id) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "active" ? "inactive" : "active", updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  },

  duplicateTemplate: (id) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return;

    const newTemplate: LineTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (副本)`,
      status: "inactive",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      zones: template.zones.map((z) => ({ ...z, id: `zone-${Date.now()}-${Math.random()}` })) as TemperatureZone[],
      points: template.points.map((p) => ({ ...p, id: `p-${Date.now()}-${Math.random()}` })) as ProbePoint[],
    };

    set((state) => ({
      templates: [newTemplate, ...state.templates],
      dashboardStats: {
        ...state.dashboardStats,
        templateCount: state.dashboardStats.templateCount + 1,
      },
    }));
  },

  approveAudit: (id, remarks) => {
    set((state) => ({
      auditTasks: state.auditTasks.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "approved",
              auditRecord: {
                auditor: "质控专员-当前用户",
                auditedAt: new Date().toISOString(),
                result: "approved",
                remarks,
              },
            }
          : a
      ),
      dashboardStats: {
        ...state.dashboardStats,
        pendingAudits: Math.max(0, state.dashboardStats.pendingAudits - 1),
      },
    }));
  },

  rejectAudit: (id, remarks, adjustments) => {
    set((state) => ({
      auditTasks: state.auditTasks.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "rejected",
              auditRecord: {
                auditor: "质控专员-当前用户",
                auditedAt: new Date().toISOString(),
                result: "rejected",
                remarks,
                adjustmentMarks: adjustments?.map((adj, idx) => ({
                  id: `adj-${Date.now()}-${idx}`,
                  ...adj,
                })),
              },
            }
          : a
      ),
    }));
  },

  saveReviewConclusion: (id, conclusion) => {
    set((state) => ({
      reviewTasks: state.reviewTasks.map((r) =>
        r.id === id
          ? {
              ...r,
              reviewStatus: "reviewed",
              reviewConclusion: {
                reviewedBy: "质控专员-当前用户",
                reviewedAt: new Date().toISOString(),
                ...conclusion,
              },
            }
          : r
      ),
    }));
  },
}));
