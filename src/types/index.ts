export interface LineTemplate {
  id: string;
  name: string;
  category: "trunk" | "city" | "pharmacy" | "custom";
  categoryName: string;
  status: "active" | "inactive";
  description: string;
  carriage: {
    length: number;
    width: number;
    height: number;
    volume: number;
  };
  zones: TemperatureZone[];
  points: ProbePoint[];
  sensitivityLevel: "normal" | "sensitive" | "highly-sensitive";
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface TemperatureZone {
  id: string;
  name: string;
  color: string;
  targetTemp: number;
  tempRange: { min: number; max: number };
  bounds: { x: number; y: number; width: number; height: number };
}

export interface ProbePoint {
  id: string;
  name: string;
  type: "mandatory" | "optional";
  x: number;
  y: number;
  zoneId?: string;
  description: string;
}

export interface AuditTask {
  id: string;
  taskNo: string;
  templateId: string;
  templateName: string;
  status: "pending" | "approved" | "rejected" | "resubmitted";
  submittedAt: string;
  submittedBy: string;
  vehicleNo: string;
  driverName: string;
  deployedProbes: DeployedProbe[];
  missingPoints: string[];
  auditRecord?: AuditRecord;
}

export interface DeployedProbe {
  id: string;
  pointId: string;
  probeNo: string;
  photoUrl: string;
  deviceStatus: "online" | "offline" | "abnormal";
  batteryLevel: number;
  currentTemp: number;
}

export interface AuditRecord {
  auditor: string;
  auditedAt: string;
  result: "approved" | "rejected";
  remarks: string;
  adjustmentMarks?: AdjustmentMark[];
}

export interface AdjustmentMark {
  id: string;
  pointId: string;
  x: number;
  y: number;
  description: string;
}

export interface ReviewTask {
  id: string;
  taskNo: string;
  templateId: string;
  templateName: string;
  vehicleNo: string;
  startTime: string;
  endTime: string;
  reviewStatus: "pending" | "reviewed";
  probeData: ProbeTemperatureData[];
  events: TransportEvent[];
  reviewConclusion?: ReviewConclusion;
}

export interface ProbeTemperatureData {
  probeId: string;
  probeNo: string;
  pointName: string;
  timestamps: string[];
  temperatures: number[];
}

export interface TransportEvent {
  id: string;
  type: "door-open" | "transfer" | "unload" | "other";
  typeName: string;
  timestamp: string;
  description: string;
}

export interface ReviewConclusion {
  reviewedBy: string;
  reviewedAt: string;
  layoutRating: "good" | "fair" | "poor";
  optimizationSuggestions: string;
  effectivePoints: string[];
  blindSpots: string[];
}

export interface DashboardStats {
  totalTasks: number;
  pendingAudits: number;
  abnormalCount: number;
  templateCount: number;
  taskTrend: { date: string; count: number }[];
  recentAudits: AuditTask[];
}
