import { create } from "zustand";
import type {
  LineTemplate,
  AuditTask,
  ReviewTask,
  DashboardStats,
  ProbePoint,
  TemperatureZone,
  TransportEvent,
  TemplateVersion,
  DeployedProbe,
  TemperatureAnomaly,
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

  createTemplateVersion: (templateId: string, changeNote: string) => void;
  getTemplateVersions: (templateId: string) => TemplateVersion[];
  restoreTemplateVersion: (templateId: string, versionId: string) => void;
  compareTemplateVersions: (templateId: string, versionId1: string, versionId2: string) => {
    addedZones: TemperatureZone[];
    removedZones: TemperatureZone[];
    modifiedZones: TemperatureZone[];
    addedPoints: ProbePoint[];
    removedPoints: ProbePoint[];
  };

  resubmitAudit: (taskId: string, probes: DeployedProbe[], missingPoints: string[]) => void;
  approveResubmit: (taskId: string, remarks: string) => void;

  addTemperatureAnomaly: (reviewTaskId: string, anomaly: Omit<TemperatureAnomaly, "id">) => void;
  updateTemperatureAnomaly: (reviewTaskId: string, anomalyId: string, updates: Partial<TemperatureAnomaly>) => void;
  deleteTemperatureAnomaly: (reviewTaskId: string, anomalyId: string) => void;
  linkEventToAnomaly: (reviewTaskId: string, eventId: string, anomalyId: string) => void;
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

  /** 基于当前模板最新状态创建新版本，版本号递增，保存到 versions 数组头部 */
  createTemplateVersion: (templateId, changeNote) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;

    const currentVersion = template.currentVersion || "v1.0";
    const match = currentVersion.match(/^v(\d+)(?:\.(\d+))?$/);
    let newVersion: string;
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = match[2] ? parseInt(match[2], 10) : 0;
      if (minor === 0 && !match[2]) {
        newVersion = `v${major + 1}.0`;
      } else {
        newVersion = `v${major}.${minor + 1}`;
      }
    } else {
      newVersion = "v2.0";
    }

    const newVersionRecord: TemplateVersion = {
      id: `ver-${Date.now()}`,
      version: newVersion,
      name: template.name,
      description: template.description,
      carriage: { ...template.carriage },
      zones: template.zones.map((z) => ({ ...z })),
      points: template.points.map((p) => ({ ...p })),
      sensitivityLevel: template.sensitivityLevel,
      createdAt: new Date().toISOString(),
      createdBy: "当前用户",
      changeNote,
    };

    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              currentVersion: newVersion,
              versions: [newVersionRecord, ...t.versions],
              lastChangeNote: changeNote,
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
    get().persist();
  },

  /** 返回该模板所有版本，按创建时间倒序排列（最新在前） */
  getTemplateVersions: (templateId) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return [];
    return [...template.versions].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /** 将指定版本的配置恢复为当前模板，保持 zones 和 points 的 id 与版本中一致 */
  restoreTemplateVersion: (templateId, versionId) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;

    const version = template.versions.find((v) => v.id === versionId);
    if (!version) return;

    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              zones: version.zones.map((z) => ({ ...z })),
              points: version.points.map((p) => ({ ...p })),
              carriage: { ...version.carriage },
              sensitivityLevel: version.sensitivityLevel,
              description: version.description,
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
    get().persist();
  },

  /** 比较两个版本的差异，返回增加/删除/修改的 zone 和增加/删除的 point */
  compareTemplateVersions: (templateId, versionId1, versionId2) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) {
      return {
        addedZones: [],
        removedZones: [],
        modifiedZones: [],
        addedPoints: [],
        removedPoints: [],
      };
    }

    const v1 = template.versions.find((v) => v.id === versionId1);
    const v2 = template.versions.find((v) => v.id === versionId2);
    if (!v1 || !v2) {
      return {
        addedZones: [],
        removedZones: [],
        modifiedZones: [],
        addedPoints: [],
        removedPoints: [],
      };
    }

    const v1ZoneIds = new Set(v1.zones.map((z) => z.id));
    const v2ZoneIds = new Set(v2.zones.map((z) => z.id));
    const addedZones = v2.zones.filter((z) => !v1ZoneIds.has(z.id));
    const removedZones = v1.zones.filter((z) => !v2ZoneIds.has(z.id));
    const modifiedZones = v2.zones.filter((z) => {
      const v1Zone = v1.zones.find((old) => old.id === z.id);
      if (!v1Zone) return false;
      return JSON.stringify(v1Zone) !== JSON.stringify(z);
    });

    const v1PointIds = new Set(v1.points.map((p) => p.id));
    const v2PointIds = new Set(v2.points.map((p) => p.id));
    const addedPoints = v2.points.filter((p) => !v1PointIds.has(p.id));
    const removedPoints = v1.points.filter((p) => !v2PointIds.has(p.id));

    return {
      addedZones,
      removedZones,
      modifiedZones,
      addedPoints,
      removedPoints,
    };
  },

  /** 模拟现场重新提交，保存历史提交记录，状态改为 resubmitted */
  resubmitAudit: (taskId, probes, missingPoints) => {
    const task = get().auditTasks.find((a) => a.id === taskId);
    if (!task || !task.auditRecord) return;

    const previousSubmission = {
      submittedAt: task.submittedAt,
      submittedBy: task.submittedBy,
      deployedProbes: task.deployedProbes.map((p) => ({ ...p })),
      missingPoints: [...task.missingPoints],
      auditRecord: { ...task.auditRecord },
    };

    set((state) => ({
      auditTasks: state.auditTasks.map((a) =>
        a.id === taskId
          ? {
              ...a,
              status: "resubmitted",
              submittedAt: new Date().toISOString(),
              deployedProbes: probes.map((p) => ({ ...p })),
              missingPoints: [...missingPoints],
              previousSubmission,
              resubmitCount: a.resubmitCount + 1,
            }
          : a
      ),
    }));
    get().persist();
  },

  /** 审核重提通过，更新审核记录和状态，同步更新仪表盘统计 */
  approveResubmit: (taskId, remarks) => {
    set((state) => ({
      auditTasks: state.auditTasks.map((a) =>
        a.id === taskId
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
          a.id === taskId ? { ...a, status: "approved" as const } : a
        ),
      },
    }));
    get().persist();
  },

  /** 添加一个温度异常区间，自动生成 id */
  addTemperatureAnomaly: (reviewTaskId, anomaly) => {
    const newAnomaly: TemperatureAnomaly = {
      ...anomaly,
      id: `anom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    set((state) => ({
      reviewTasks: state.reviewTasks.map((r) =>
        r.id === reviewTaskId
          ? { ...r, anomalies: [...r.anomalies, newAnomaly] }
          : r
      ),
    }));
    get().persist();
  },

  /** 更新温度异常区间 */
  updateTemperatureAnomaly: (reviewTaskId, anomalyId, updates) => {
    set((state) => ({
      reviewTasks: state.reviewTasks.map((r) =>
        r.id === reviewTaskId
          ? {
              ...r,
              anomalies: r.anomalies.map((a) =>
                a.id === anomalyId ? { ...a, ...updates } : a
              ),
            }
          : r
      ),
    }));
    get().persist();
  },

  /** 删除温度异常区间，同时清理关联事件的 anomalyId */
  deleteTemperatureAnomaly: (reviewTaskId, anomalyId) => {
    set((state) => ({
      reviewTasks: state.reviewTasks.map((r) => {
        if (r.id !== reviewTaskId) return r;
        return {
          ...r,
          anomalies: r.anomalies.filter((a) => a.id !== anomalyId),
          events: r.events.map((e) =>
            e.anomalyId === anomalyId ? { ...e, anomalyId: undefined } : e
          ),
        };
      }),
    }));
    get().persist();
  },

  /** 将事件关联到异常，同时更新事件和异常的关联关系 */
  linkEventToAnomaly: (reviewTaskId, eventId, anomalyId) => {
    set((state) => ({
      reviewTasks: state.reviewTasks.map((r) => {
        if (r.id !== reviewTaskId) return r;
        const updatedEvents = r.events.map((e) =>
          e.id === eventId ? { ...e, anomalyId } : e
        );
        const updatedAnomalies = r.anomalies.map((a) => {
          if (a.id !== anomalyId) return a;
          if (a.relatedEventIds.includes(eventId)) return a;
          return { ...a, relatedEventIds: [...a.relatedEventIds, eventId] };
        });
        return { ...r, events: updatedEvents, anomalies: updatedAnomalies };
      }),
    }));
    get().persist();
  },
}));
