import { create } from "zustand";
import type {
  LineTemplate,
  AuditTask,
  ReviewTask,
  DashboardStats,
  ProbePoint,
  TemperatureZone,
  TransportEvent,
} from "@/types";
import {
  mockTemplates,
  mockAuditTasks,
  mockReviewTasks,
  mockDashboardStats,
} from "@/mock";

const STORAGE_KEY = "cold-chain-monitor-store-v1";

interface PersistedState {
  templates: LineTemplate[];
  auditTasks: AuditTask[];
  reviewTasks: ReviewTask[];
  dashboardStats: DashboardStats;
}

const loadPersistedState = (): Partial<PersistedState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        templates: parsed.templates,
        auditTasks: parsed.auditTasks,
        reviewTasks: parsed.reviewTasks,
        dashboardStats: parsed.dashboardStats,
      };
    }
  } catch (e) {
    console.warn("Failed to load persisted state:", e);
  }
  return {};
};

const persisted = loadPersistedState();

interface AppState {
  templates: LineTemplate[];
  auditTasks: AuditTask[];
  reviewTasks: ReviewTask[];
  dashboardStats: DashboardStats;
  selectedTemplateId: string | null;
  selectedAuditId: string | null;
  selectedReviewId: string | null;

  persist: () => void;
  resetToDefault: () => void;

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

  addTransportEvent: (reviewTaskId: string, event: Omit<TransportEvent, "id">) => void;
  updateTransportEvent: (reviewTaskId: string, eventId: string, updates: Partial<TransportEvent>) => void;
  deleteTransportEvent: (reviewTaskId: string, eventId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  templates: persisted.templates ?? mockTemplates,
  auditTasks: persisted.auditTasks ?? mockAuditTasks,
  reviewTasks: persisted.reviewTasks ?? mockReviewTasks,
  dashboardStats: persisted.dashboardStats ?? mockDashboardStats,
  selectedTemplateId: null,
  selectedAuditId: null,
  selectedReviewId: null,

  persist: () => {
    const state = get();
    const toSave: PersistedState = {
      templates: state.templates,
      auditTasks: state.auditTasks,
      reviewTasks: state.reviewTasks,
      dashboardStats: state.dashboardStats,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn("Failed to persist state:", e);
    }
  },

  resetToDefault: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      templates: mockTemplates,
      auditTasks: mockAuditTasks,
      reviewTasks: mockReviewTasks,
      dashboardStats: mockDashboardStats,
    });
  },

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
    get().persist();
  },

  updateTemplate: (id, updates) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
    get().persist();
  },

  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      dashboardStats: {
        ...state.dashboardStats,
        templateCount: state.dashboardStats.templateCount - 1,
      },
    }));
    get().persist();
  },

  toggleTemplateStatus: (id) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "active" ? "inactive" : "active", updatedAt: new Date().toISOString() }
          : t
      ),
    }));
    get().persist();
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
      zones: template.zones.map((z) => ({ ...z, id: `zone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` })),
      points: template.points.map((p) => ({ ...p, id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` })),
    };

    set((state) => ({
      templates: [newTemplate, ...state.templates],
      dashboardStats: {
        ...state.dashboardStats,
        templateCount: state.dashboardStats.templateCount + 1,
      },
    }));
    get().persist();
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
        recentAudits: state.dashboardStats.recentAudits.map((a) =>
          a.id === id ? { ...a, status: "approved" as const } : a
        ),
      },
    }));
    get().persist();
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
    get().persist();
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
    get().persist();
  },

  addTransportEvent: (reviewTaskId, event) => {
    const newEvent: TransportEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    set((state) => ({
      reviewTasks: state.reviewTasks.map((r) =>
        r.id === reviewTaskId
          ? { ...r, events: [...r.events, newEvent].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) }
          : r
      ),
    }));
    get().persist();
  },

  updateTransportEvent: (reviewTaskId, eventId, updates) => {
    set((state) => ({
      reviewTasks: state.reviewTasks.map((r) =>
        r.id === reviewTaskId
          ? {
              ...r,
              events: r.events
                .map((e) => (e.id === eventId ? { ...e, ...updates } : e))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
            }
          : r
      ),
    }));
    get().persist();
  },

  deleteTransportEvent: (reviewTaskId, eventId) => {
    set((state) => ({
      reviewTasks: state.reviewTasks.map((r) =>
        r.id === reviewTaskId
          ? { ...r, events: r.events.filter((e) => e.id !== eventId) }
          : r
      ),
    }));
    get().persist();
  },
}));
