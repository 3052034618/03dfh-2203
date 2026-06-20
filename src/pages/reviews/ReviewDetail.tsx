import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Truck,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Save,
  MessageSquare,
  Zap,
  Package,
  DoorOpen,
  RefreshCw,
  Star,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flag,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend,
  CartesianGrid,
} from "recharts";
import { useAppStore } from "@/store/appStore";
import CarriageDiagram from "@/components/CarriageDiagram";
import { cn } from "@/lib/utils";
import type { ProbeTemperatureData, TransportEvent, TemperatureAnomaly } from "@/types";

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getReviewById, getTemplateById, saveReviewConclusion, addTransportEvent, updateTransportEvent, deleteTransportEvent, addTemperatureAnomaly, updateTemperatureAnomaly, deleteTemperatureAnomaly, linkEventToAnomaly } = useAppStore();

  const reviewTask = getReviewById(id || "");
  const template = reviewTask ? getTemplateById(reviewTask.templateId) : undefined;

  const [selectedProbes, setSelectedProbes] = useState<string[]>(
    reviewTask?.probeData.slice(0, 3).map((p) => p.probeId) || []
  );
  const [isEditing, setIsEditing] = useState(false);
  const [layoutRating, setLayoutRating] = useState<"good" | "fair" | "poor">(
    reviewTask?.reviewConclusion?.layoutRating || "fair"
  );
  const [suggestions, setSuggestions] = useState(
    reviewTask?.reviewConclusion?.optimizationSuggestions || ""
  );

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<{
    type: "door-open" | "transfer" | "unload" | "other";
    typeName: string;
    timestamp: string;
    description: string;
  }>({
    type: "door-open",
    typeName: "开门",
    timestamp: "",
    description: "",
  });

  const [isMarkingAnomaly, setIsMarkingAnomaly] = useState(false);
  const [anomalyStartIdx, setAnomalyStartIdx] = useState<number | null>(null);
  const [anomalyEndIdx, setAnomalyEndIdx] = useState<number | null>(null);
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [editingAnomalyId, setEditingAnomalyId] = useState<string | null>(null);
  const [expandedAnomalyIds, setExpandedAnomalyIds] = useState<string[]>([]);
  const [anomalyForm, setAnomalyForm] = useState<{
    probeId: string;
    startTime: string;
    endTime: string;
    severity: "mild" | "moderate" | "severe";
    description: string;
    relatedEventIds: string[];
  }>({
    probeId: "",
    startTime: "",
    endTime: "",
    severity: "mild",
    description: "",
    relatedEventIds: [],
  });
  const [anomalyProbeSelect, setAnomalyProbeSelect] = useState("");

  if (!reviewTask || !template) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">任务不存在</p>
      </div>
    );
  }

  const chartData = useMemo(() => {
    if (selectedProbes.length === 0) return [];

    const firstProbe = reviewTask.probeData.find((p) => p.probeId === selectedProbes[0]);
    if (!firstProbe) return [];

    return firstProbe.timestamps.map((time, idx) => {
      const point: Record<string, string | number> = {
        time: new Date(time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        timestamp: time,
        ts: new Date(time).getTime(),
      };
      selectedProbes.forEach((probeId) => {
        const probe = reviewTask.probeData.find((p) => p.probeId === probeId);
        if (probe) {
          point[probe.pointName] = probe.temperatures[idx];
        }
      });
      return point;
    });
  }, [selectedProbes, reviewTask.probeData]);

  const formatTsToTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const toggleProbe = (probeId: string) => {
    setSelectedProbes((prev) =>
      prev.includes(probeId)
        ? prev.filter((id) => id !== probeId)
        : [...prev, probeId]
    );
  };

  const formatDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${mins}分钟`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "door-open":
        return DoorOpen;
      case "transfer":
        return RefreshCw;
      case "unload":
        return Package;
      default:
        return Zap;
    }
  };

  const probeColors = [
    "#00D4FF",
    "#FF8A3D",
    "#2DD4A0",
    "#A78BFA",
    "#FF5757",
    "#FBBF24",
  ];

  const handleSaveConclusion = () => {
    const effectivePoints = reviewTask.probeData
      .filter((_, i) => i % 2 === 0)
      .map((p) => p.pointName);
    const blindSpots = reviewTask.probeData
      .filter((_, i) => i === 2)
      .map((p) => p.pointName);

    saveReviewConclusion(reviewTask.id, {
      layoutRating,
      optimizationSuggestions: suggestions,
      effectivePoints,
      blindSpots,
    });
    setIsEditing(false);
  };

  const eventTypeOptions: { type: "door-open" | "transfer" | "unload" | "other"; typeName: string; Icon: typeof DoorOpen }[] = [
    { type: "door-open", typeName: "开门", Icon: DoorOpen },
    { type: "transfer", typeName: "换车", Icon: RefreshCw },
    { type: "unload", typeName: "卸货", Icon: Package },
    { type: "other", typeName: "其他", Icon: Zap },
  ];

  const toLocalInputValue = (iso: string): string => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenAddModal = () => {
    setEditingEventId(null);
    setEventForm({
      type: "door-open",
      typeName: "开门",
      timestamp: toLocalInputValue(reviewTask.startTime),
      description: "",
    });
    setShowAddEventModal(true);
  };

  const handleOpenEditModal = (event: TransportEvent) => {
    setEditingEventId(event.id);
    setEventForm({
      type: event.type,
      typeName: event.typeName,
      timestamp: toLocalInputValue(event.timestamp),
      description: event.description,
    });
    setShowAddEventModal(true);
  };

  const handleSaveEvent = () => {
    const isoTimestamp = new Date(eventForm.timestamp).toISOString();
    if (editingEventId) {
      updateTransportEvent(reviewTask.id, editingEventId, {
        type: eventForm.type,
        typeName: eventForm.typeName,
        timestamp: isoTimestamp,
        description: eventForm.description,
      });
    } else {
      addTransportEvent(reviewTask.id, {
        type: eventForm.type,
        typeName: eventForm.typeName,
        timestamp: isoTimestamp,
        description: eventForm.description,
      });
    }
    setShowAddEventModal(false);
    setEditingEventId(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm("确认删除该运输事件？")) {
      deleteTransportEvent(reviewTask.id, eventId);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild":
        return { bg: "bg-warning-500/20", text: "text-warning-400", border: "border-warning-500/30", fill: "#FBBF24" };
      case "moderate":
        return { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", fill: "#FF8A3D" };
      case "severe":
        return { bg: "bg-danger-500/20", text: "text-danger-400", border: "border-danger-500/30", fill: "#EF4444" };
      default:
        return { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30", fill: "#6B7280" };
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "mild":
        return "轻微";
      case "moderate":
        return "中度";
      case "severe":
        return "严重";
      default:
        return severity;
    }
  };

  const calculateAnomalyStats = (probeId: string, startTime: string, endTime: string) => {
    const probe = reviewTask.probeData.find((p) => p.probeId === probeId);
    if (!probe) return { maxTemp: 0, minTemp: 0, avgTemp: 0 };

    const startIdx = probe.timestamps.findIndex((t) => t >= startTime);
    let endIdx = -1;
    for (let i = probe.timestamps.length - 1; i >= 0; i--) {
      if (probe.timestamps[i] <= endTime) {
        endIdx = i;
        break;
      }
    }
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
      return { maxTemp: 0, minTemp: 0, avgTemp: 0 };
    }

    const temps = probe.temperatures.slice(startIdx, endIdx + 1);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

    return { maxTemp, minTemp, avgTemp };
  };

  const handleStartMarkAnomaly = () => {
    setIsMarkingAnomaly(true);
    setAnomalyStartIdx(null);
    setAnomalyEndIdx(null);
    if (selectedProbes.length > 0) {
      setAnomalyProbeSelect(selectedProbes[0]);
    } else if (reviewTask.probeData.length > 0) {
      setAnomalyProbeSelect(reviewTask.probeData[0].probeId);
    }
  };

  const handleCancelMarkAnomaly = () => {
    setIsMarkingAnomaly(false);
    setAnomalyStartIdx(null);
    setAnomalyEndIdx(null);
  };

  const handleChartClick = (data: any) => {
    if (!isMarkingAnomaly) return;
    if (!data || !data.activePayload || data.activePayload.length === 0) return;

    const idx = chartData.findIndex((d) => d.timestamp === data.activePayload[0].payload.timestamp);
    if (idx === -1) return;

    if (anomalyStartIdx === null) {
      setAnomalyStartIdx(idx);
    } else if (anomalyEndIdx === null) {
      if (idx < anomalyStartIdx) {
        setAnomalyEndIdx(anomalyStartIdx);
        setAnomalyStartIdx(idx);
      } else {
        setAnomalyEndIdx(idx);
      }
    }
  };

  const handleConfirmSelection = () => {
    if (anomalyStartIdx === null || anomalyEndIdx === null) return;

    const probe = reviewTask.probeData.find((p) => p.probeId === anomalyProbeSelect);
    if (!probe) return;

    const startTime = probe.timestamps[anomalyStartIdx];
    const endTime = probe.timestamps[anomalyEndIdx];
    const stats = calculateAnomalyStats(anomalyProbeSelect, startTime, endTime);

    setAnomalyForm({
      probeId: anomalyProbeSelect,
      startTime,
      endTime,
      severity: "mild",
      description: "",
      relatedEventIds: [],
    });
    setEditingAnomalyId(null);
    setShowAnomalyModal(true);
    setIsMarkingAnomaly(false);
    setAnomalyStartIdx(null);
    setAnomalyEndIdx(null);
  };

  const handleOpenEditAnomalyModal = (anomaly: TemperatureAnomaly) => {
    setEditingAnomalyId(anomaly.id);
    setAnomalyForm({
      probeId: anomaly.probeId,
      startTime: anomaly.startTime,
      endTime: anomaly.endTime,
      severity: anomaly.severity,
      description: anomaly.description,
      relatedEventIds: [...anomaly.relatedEventIds],
    });
    setShowAnomalyModal(true);
  };

  const handleSaveAnomaly = () => {
    const probe = reviewTask.probeData.find((p) => p.probeId === anomalyForm.probeId);
    if (!probe) return;

    const stats = calculateAnomalyStats(anomalyForm.probeId, anomalyForm.startTime, anomalyForm.endTime);

    if (editingAnomalyId) {
      updateTemperatureAnomaly(reviewTask.id, editingAnomalyId, {
        severity: anomalyForm.severity,
        description: anomalyForm.description,
        relatedEventIds: anomalyForm.relatedEventIds,
      });
    } else {
      addTemperatureAnomaly(reviewTask.id, {
        probeId: anomalyForm.probeId,
        probeName: probe.pointName,
        startTime: anomalyForm.startTime,
        endTime: anomalyForm.endTime,
        maxTemp: stats.maxTemp,
        minTemp: stats.minTemp,
        avgTemp: stats.avgTemp,
        severity: anomalyForm.severity,
        relatedEventIds: anomalyForm.relatedEventIds,
        description: anomalyForm.description,
      });
    }

    setShowAnomalyModal(false);
    setEditingAnomalyId(null);
  };

  const handleDeleteAnomaly = (anomalyId: string) => {
    if (confirm("确认删除该异常区间？")) {
      deleteTemperatureAnomaly(reviewTask.id, anomalyId);
    }
  };

  const toggleAnomalyExpand = (anomalyId: string) => {
    setExpandedAnomalyIds((prev) =>
      prev.includes(anomalyId)
        ? prev.filter((id) => id !== anomalyId)
        : [...prev, anomalyId]
    );
  };

  const toggleEventLink = (eventId: string) => {
    setAnomalyForm((prev) => ({
      ...prev,
      relatedEventIds: prev.relatedEventIds.includes(eventId)
        ? prev.relatedEventIds.filter((id) => id !== eventId)
        : [...prev.relatedEventIds, eventId],
    }));
  };

  const hasConclusion = !!reviewTask.reviewConclusion;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/reviews")}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{reviewTask.taskNo}</h1>
              <span className={cn(
                "tag",
                reviewTask.reviewStatus === "reviewed"
                  ? "bg-success-500/10 text-success-400 border border-success-500/30"
                  : "bg-warning-500/10 text-warning-400 border border-warning-500/30"
              )}>
                {reviewTask.reviewStatus === "reviewed" ? "已复盘" : "待复盘"}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {reviewTask.templateName} · {reviewTask.vehicleNo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasConclusion && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-lg border border-ice-500/30 text-ice-400 hover:bg-ice-500/10 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              编辑结论
            </button>
          )}
          {(!hasConclusion || isEditing) && (
            <button
              onClick={handleSaveConclusion}
              className="btn-glow px-5 py-2 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              保存复盘结论
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Truck className="w-4 h-4" />
            运输车辆
          </div>
          <p className="text-lg font-semibold text-white">{reviewTask.vehicleNo}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Calendar className="w-4 h-4" />
            发车时间
          </div>
          <p className="text-sm font-medium text-white font-num">
            {new Date(reviewTask.startTime).toLocaleString("zh-CN")}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Clock className="w-4 h-4" />
            运输时长
          </div>
          <p className="text-lg font-semibold text-white font-num">
            {formatDuration(reviewTask.startTime, reviewTask.endTime)}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <MapPin className="w-4 h-4" />
            监测探头
          </div>
          <p className="text-lg font-semibold text-ice-400 font-num">
            {reviewTask.probeData.length} 个
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9 space-y-6">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-ice-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                温度曲线
              </h3>
              <div className="flex items-center gap-3">
                {isMarkingAnomaly ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={anomalyProbeSelect}
                      onChange={(e) => setAnomalyProbeSelect(e.target.value)}
                      className="input-field text-sm py-1.5 px-2 w-32"
                    >
                      {reviewTask.probeData.map((probe) => (
                        <option key={probe.probeId} value={probe.probeId}>
                          {probe.pointName}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleCancelMarkAnomaly}
                      className="px-3 py-1.5 rounded-lg border border-gray-500/30 text-gray-400 hover:bg-white/5 transition-colors text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmSelection}
                      disabled={anomalyStartIdx === null || anomalyEndIdx === null}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5",
                        anomalyStartIdx !== null && anomalyEndIdx !== null
                          ? "btn-glow"
                          : "bg-gray-500/20 text-gray-500 cursor-not-allowed"
                      )}
                    >
                      <Flag className="w-4 h-4" />
                      确认选择
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleStartMarkAnomaly}
                      className="px-3 py-1.5 rounded-lg border border-warning-500/30 text-warning-400 hover:bg-warning-500/10 transition-colors flex items-center gap-1.5 text-sm"
                    >
                      <Flag className="w-4 h-4" />
                      标记异常
                    </button>
                    <div className="text-sm text-gray-400">
                      点击下方探头切换显示
                    </div>
                  </>
                )}
              </div>
            </div>
            {isMarkingAnomaly && (
              <div className="mb-3 p-3 rounded-lg bg-warning-500/10 border border-warning-500/20">
                <p className="text-sm text-warning-300">
                  {anomalyStartIdx === null
                    ? "请在曲线上点击选择异常区间的起始点"
                    : anomalyEndIdx === null
                    ? "请在曲线上点击选择异常区间的结束点"
                    : "已选择区间，点击确认选择按钮继续"}
                </p>
              </div>
            )}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  onClick={handleChartClick}
                >
                  <defs>
                    {reviewTask.anomalies.map((anomaly) => {
                    const colors = getSeverityColor(anomaly.severity);
                    return (
                      <linearGradient
                        key={`grad-${anomaly.id}`}
                        id={`anomaly-gradient-${anomaly.id}`}
                        x1="0" y1="0" x2="0" y2="1"
                      >
                        <stop offset="0%" stopColor={colors.fill} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={colors.fill} stopOpacity={0.05} />
                      </linearGradient>
                    );
                  })}
                    {isMarkingAnomaly && anomalyStartIdx !== null && anomalyEndIdx !== null && (
                    <linearGradient id="selection-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.05} />
                    </linearGradient>
                  )}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={formatTsToTime}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    unit="°C"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(17, 34, 64, 0.95)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#94a3b8", marginBottom: "8px" }}
                    labelFormatter={(label) => formatTsToTime(label as number)}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "10px" }}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
                  />
                  {reviewTask.anomalies.map((anomaly) => {
                    const startTs = new Date(anomaly.startTime).getTime();
                    const endTs = new Date(anomaly.endTime).getTime();
                    return (
                      <ReferenceArea
                        key={anomaly.id}
                        x1={startTs}
                        x2={endTs}
                        fill={`url(#anomaly-gradient-${anomaly.id})`}
                        stroke={getSeverityColor(anomaly.severity).fill}
                        strokeOpacity={0.4}
                        strokeWidth={1}
                      />
                    );
                  })}
                  {isMarkingAnomaly && anomalyStartIdx !== null && anomalyEndIdx !== null && (
                    <ReferenceArea
                      x1={chartData[anomalyStartIdx].ts as number}
                      x2={chartData[anomalyEndIdx].ts as number}
                      fill="url(#selection-gradient)"
                      stroke="#00D4FF"
                      strokeOpacity={0.5}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  )}
                  {isMarkingAnomaly && anomalyStartIdx !== null && (
                    <ReferenceLine
                      x={chartData[anomalyStartIdx].ts as number}
                      stroke="#00D4FF"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  )}
                  {isMarkingAnomaly && anomalyEndIdx !== null && (
                    <ReferenceLine
                      x={chartData[anomalyEndIdx].ts as number}
                      stroke="#00D4FF"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  )}
                  {selectedProbes.map((probeId, idx) => {
                    const probe = reviewTask.probeData.find((p) => p.probeId === probeId);
                    if (!probe) return null;
                    return (
                      <Line
                        key={probeId}
                        type="monotone"
                        dataKey={probe.pointName}
                        stroke={probeColors[idx % probeColors.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2 }}
                      />
                    );
                  })}
                  {reviewTask.events.map((event: TransportEvent, idx) => (
                    <ReferenceLine
                      key={event.id}
                      x={new Date(event.timestamp).getTime()}
                      stroke="#FF8A3D"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      label={{
                        value: event.typeName,
                        fill: "#FF8A3D",
                        fontSize: 10,
                        position: "top",
                      }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {reviewTask.probeData.map((probe, idx) => (
                <button
                  key={probe.probeId}
                  onClick={() => toggleProbe(probe.probeId)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all",
                    selectedProbes.includes(probe.probeId)
                      ? "bg-ice-500/15 text-white border border-ice-500/30"
                      : "bg-cold-800/50 text-gray-400 border border-transparent hover:border-ice-500/20"
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: probeColors[idx % probeColors.length] }}
                  ></span>
                  {probe.pointName}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning-400" />
                异常区间
                <span className="text-sm font-normal text-gray-400">
                  ({reviewTask.anomalies.length} 个)
                </span>
              </h3>
            </div>
            {reviewTask.anomalies.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无异常区间</p>
                <p className="text-xs text-gray-600 mt-1">点击上方"标记异常"按钮添加</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewTask.anomalies.map((anomaly) => {
                  const severityColors = getSeverityColor(anomaly.severity);
                  const isExpanded = expandedAnomalyIds.includes(anomaly.id);
                  const relatedEvents = reviewTask.events.filter((e) =>
                    anomaly.relatedEventIds.includes(e.id)
                  );
                  return (
                    <div
                      key={anomaly.id}
                      className={cn(
                        "rounded-xl border transition-all",
                        severityColors.bg,
                        severityColors.border
                      )}
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleAnomalyExpand(anomaly.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                severityColors.bg,
                                severityColors.text
                              )}>
                                {getSeverityLabel(anomaly.severity)}
                              </span>
                              <span className="text-sm font-medium text-white">
                                {anomaly.probeName}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                              <span>
                                {new Date(anomaly.startTime).toLocaleTimeString("zh-CN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" ~ "}
                                {new Date(anomaly.endTime).toLocaleTimeString("zh-CN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="text-danger-400">
                                最高 {anomaly.maxTemp.toFixed(1)}°C
                              </span>
                              <span className="text-success-400">
                                最低 {anomaly.minTemp.toFixed(1)}°C
                              </span>
                              <span className="text-purple-400">
                                {relatedEvents.length} 个关联事件
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditAnomalyModal(anomaly);
                              }}
                              className="p-1.5 rounded-md text-gray-400 hover:text-ice-400 hover:bg-white/5 transition-colors"
                              title="编辑"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAnomaly(anomaly.id);
                              }}
                              className="p-1.5 rounded-md text-gray-400 hover:text-danger-400 hover:bg-white/5 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-white/5">
                          <div className="pt-3 space-y-3">
                            {anomaly.description && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">异常描述</p>
                                <p className="text-sm text-gray-300">{anomaly.description}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 mb-2">关联事件</p>
                              {relatedEvents.length === 0 ? (
                                <p className="text-xs text-gray-600">暂无关联事件</p>
                              ) : (
                                <div className="space-y-2">
                                  {relatedEvents.map((event) => {
                                    const EventIcon = getEventIcon(event.type);
                                    return (
                                      <div
                                        key={event.id}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-cold-800/50"
                                      >
                                        <EventIcon className="w-4 h-4 text-warning-400" />
                                        <span className="text-sm text-white">{event.typeName}</span>
                                        <span className="text-xs text-gray-500 font-num">
                                          {new Date(event.timestamp).toLocaleString("zh-CN", {
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-cold-800/30">
                                <p className="text-xs text-gray-500">平均温度</p>
                                <p className="text-sm text-ice-300 font-num">
                                  {anomaly.avgTemp.toFixed(1)}°C
                                </p>
                              </div>
                              <div className="p-2 rounded-lg bg-cold-800/30">
                                <p className="text-xs text-gray-500">持续时长</p>
                                <p className="text-sm text-warning-400 font-num">
                                  {formatDuration(anomaly.startTime, anomaly.endTime)}
                                </p>
                              </div>
                              <div className="p-2 rounded-lg bg-cold-800/30">
                                <p className="text-xs text-gray-500">严重程度</p>
                                <p className={cn("text-sm font-medium", severityColors.text)}>
                                  {getSeverityLabel(anomaly.severity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning-400" />
                运输事件时间轴
              </h3>
              <button
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 rounded-lg border border-ice-500/30 text-ice-400 hover:bg-ice-500/10 transition-colors flex items-center gap-1.5 text-sm"
              >
                <Plus className="w-4 h-4" />
                添加事件
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-ice-500/30 via-purple-500/30 to-success-500/30"></div>
              <div className="space-y-4">
                {reviewTask.events.map((event: TransportEvent, idx) => {
                  const Icon = getEventIcon(event.type);
                  return (
                    <div key={event.id} className="relative flex gap-4">
                      <div className="w-11 h-11 rounded-xl bg-cold-700 border border-ice-500/20 flex items-center justify-center z-10 flex-shrink-0">
                        <Icon className="w-5 h-5 text-warning-400" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-sm font-medium text-white">{event.typeName}</h4>
                              <span className="text-xs text-gray-500 font-num">
                                {new Date(event.timestamp).toLocaleString("zh-CN", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{event.description}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleOpenEditModal(event)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-ice-400 hover:bg-white/5 transition-colors"
                              title="编辑"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-danger-400 hover:bg-white/5 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-ice-400" />
              布点示意图
            </h3>
            <div className="bg-cold-900/50 rounded-xl p-3">
              <CarriageDiagram
                zones={template.zones}
                points={template.points}
                showLabels={false}
                width={300}
                height={140}
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">{template.points.length} 个监测点</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-warning-400" />
              布点评估
            </h3>

            {isEditing || !hasConclusion ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">整体评级:</span>
                  <div className="flex gap-2">
                    {[
                      { value: "good", label: "良好" },
                      { value: "fair", label: "一般" },
                      { value: "poor", label: "较差" },
                    ].map((rating) => (
                      <button
                        key={rating.value}
                        onClick={() => setLayoutRating(rating.value as "good" | "fair" | "poor")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm transition-all",
                          layoutRating === rating.value
                            ? rating.value === "good"
                              ? "bg-success-500/20 text-success-400 border border-success-500/30"
                              : rating.value === "fair"
                              ? "bg-warning-500/20 text-warning-400 border border-warning-500/30"
                              : "bg-danger-500/20 text-danger-400 border border-danger-500/30"
                            : "bg-cold-800/50 text-gray-400 border border-transparent hover:border-gray-600"
                        )}
                      >
                        {rating.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">优化建议</label>
                  <textarea
                    value={suggestions}
                    onChange={(e) => setSuggestions(e.target.value)}
                    className="input-field w-full h-24 resize-none text-sm"
                    placeholder="输入布点优化建议..."
                  />
                </div>
              </div>
            ) : (
              reviewTask.reviewConclusion && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">整体评级</span>
                    <span className={cn(
                      "text-sm font-medium",
                      reviewTask.reviewConclusion.layoutRating === "good" && "text-success-400",
                      reviewTask.reviewConclusion.layoutRating === "fair" && "text-warning-400",
                      reviewTask.reviewConclusion.layoutRating === "poor" && "text-danger-400"
                    )}>
                      {reviewTask.reviewConclusion.layoutRating === "good" && "良好"}
                      {reviewTask.reviewConclusion.layoutRating === "fair" && "一般"}
                      {reviewTask.reviewConclusion.layoutRating === "poor" && "较差"}
                    </span>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success-400" />
                      有效点位 ({reviewTask.reviewConclusion.effectivePoints.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {reviewTask.reviewConclusion.effectivePoints.map((point, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs rounded-md bg-success-500/10 text-success-400 border border-success-500/20">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>

                  {reviewTask.reviewConclusion.blindSpots.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning-400" />
                        温度盲区 ({reviewTask.reviewConclusion.blindSpots.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {reviewTask.reviewConclusion.blindSpots.map((point, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs rounded-md bg-warning-500/10 text-warning-400 border border-warning-500/20">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {reviewTask.anomalies.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-danger-400" />
                        异常汇总 ({reviewTask.anomalies.length} 个异常)
                      </p>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 text-xs rounded-md bg-danger-500/10 text-danger-400 border border-danger-500/20">
                            严重: {reviewTask.anomalies.filter((a) => a.severity === "severe").length}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            中度: {reviewTask.anomalies.filter((a) => a.severity === "moderate").length}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-md bg-warning-500/10 text-warning-400 border border-warning-500/20">
                            轻微: {reviewTask.anomalies.filter((a) => a.severity === "mild").length}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {reviewTask.anomalies.map((anomaly) => {
                            const sc = getSeverityColor(anomaly.severity);
                            return (
                              <div
                                key={anomaly.id}
                                className="p-2 rounded-lg bg-cold-800/30 border border-white/5"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-white font-medium">
                                    {anomaly.probeName}
                                  </span>
                                  <span className={cn("text-xs", sc.text)}>
                                    {getSeverityLabel(anomaly.severity)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(anomaly.startTime).toLocaleTimeString("zh-CN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {" ~ "}
                                  {new Date(anomaly.endTime).toLocaleTimeString("zh-CN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {" · "}
                                  最高 {anomaly.maxTemp.toFixed(1)}°C
                                </div>
                                {anomaly.relatedEventIds.length > 0 && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    关联事件: {anomaly.relatedEventIds.length} 个
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-sm text-gray-400 mb-2">优化建议</p>
                    <p className="text-sm text-gray-300 bg-cold-800/50 rounded-lg p-3 leading-relaxed">
                      {reviewTask.reviewConclusion.optimizationSuggestions}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-ice-500/10">
                    <p className="text-xs text-gray-500">
                      复盘人: {reviewTask.reviewConclusion.reviewedBy}
                    </p>
                    <p className="text-xs text-gray-500 font-num">
                      {new Date(reviewTask.reviewConclusion.reviewedAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              探头数据
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {reviewTask.probeData.map((probe: ProbeTemperatureData, idx) => {
                const avgTemp = probe.temperatures.reduce((a, b) => a + b, 0) / probe.temperatures.length;
                const maxTemp = Math.max(...probe.temperatures);
                const minTemp = Math.min(...probe.temperatures);
                return (
                  <div key={probe.probeId} className="p-3 rounded-lg bg-cold-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: probeColors[idx % probeColors.length] }}
                        ></span>
                        <span className="text-sm text-white font-medium">{probe.pointName}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-num">{probe.probeNo}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-gray-500">平均</p>
                        <p className="text-ice-300 font-num">{avgTemp.toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-gray-500">最高</p>
                        <p className="text-danger-400 font-num">{maxTemp.toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-gray-500">最低</p>
                        <p className="text-success-400 font-num">{minTemp.toFixed(1)}°C</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-[480px]">
            <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning-400" />
              {editingEventId ? "编辑运输事件" : "新增运输事件"}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2.5">事件类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {eventTypeOptions.map((opt) => {
                    const isSelected = eventForm.type === opt.type;
                    return (
                      <button
                        key={opt.type}
                        onClick={() =>
                          setEventForm((prev) => ({ ...prev, type: opt.type, typeName: opt.typeName }))
                        }
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                          isSelected
                            ? "bg-ice-500/15 border-ice-500/40 text-white"
                            : "bg-cold-800/50 border-transparent text-gray-400 hover:border-ice-500/20"
                        )}
                      >
                        <opt.Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{opt.typeName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">时间</label>
                <input
                  type="datetime-local"
                  value={eventForm.timestamp}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, timestamp: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">事件描述</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="input-field w-full h-24 resize-none"
                  placeholder="请输入事件描述..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddEventModal(false)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEvent}
                className="btn-glow px-5 py-2 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnomalyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-[520px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-400" />
              {editingAnomalyId ? "编辑异常区间" : "标记异常区间"}
            </h3>
            <div className="space-y-5">
              {!editingAnomalyId && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">监测探头</label>
                  <select
                    value={anomalyForm.probeId}
                    onChange={(e) =>
                      setAnomalyForm((prev) => ({ ...prev, probeId: e.target.value }))
                    }
                    className="input-field w-full"
                  >
                    {reviewTask.probeData.map((probe) => (
                      <option key={probe.probeId} value={probe.probeId}>
                        {probe.pointName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">开始时间</label>
                  <input
                    type="datetime-local"
                    value={toLocalInputValue(anomalyForm.startTime)}
                    onChange={(e) =>
                      setAnomalyForm((prev) => ({
                        ...prev,
                        startTime: new Date(e.target.value).toISOString(),
                      }))
                    }
                    className="input-field w-full"
                    disabled={!!editingAnomalyId}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">结束时间</label>
                  <input
                    type="datetime-local"
                    value={toLocalInputValue(anomalyForm.endTime)}
                    onChange={(e) =>
                      setAnomalyForm((prev) => ({
                        ...prev,
                        endTime: new Date(e.target.value).toISOString(),
                      }))
                    }
                    className="input-field w-full"
                    disabled={!!editingAnomalyId}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2.5">严重程度</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "mild", label: "轻微", color: "warning" },
                    { value: "moderate", label: "中度", color: "orange" },
                    { value: "severe", label: "严重", color: "danger" },
                  ].map((level) => {
                    const isSelected = anomalyForm.severity === level.value;
                    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                      warning: { bg: "bg-warning-500/20", text: "text-warning-400", border: "border-warning-500/40" },
                      orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40" },
                      danger: { bg: "bg-danger-500/20", text: "text-danger-400", border: "border-danger-500/40" },
                    };
                    const colors = colorMap[level.color];
                    return (
                      <button
                        key={level.value}
                        onClick={() =>
                          setAnomalyForm((prev) => ({
                            ...prev,
                            severity: level.value as "mild" | "moderate" | "severe",
                          }))
                        }
                        className={cn(
                          "py-2.5 rounded-xl border text-sm font-medium transition-all",
                          isSelected
                            ? `${colors.bg} ${colors.text} ${colors.border}`
                            : "bg-cold-800/50 border-transparent text-gray-400 hover:border-gray-600"
                        )}
                      >
                        {level.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">异常描述</label>
                <textarea
                  value={anomalyForm.description}
                  onChange={(e) =>
                    setAnomalyForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="input-field w-full h-24 resize-none"
                  placeholder="请输入异常描述..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  关联事件
                  <span className="text-gray-600 ml-1">({anomalyForm.relatedEventIds.length} 个已选)</span>
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 rounded-lg bg-cold-800/30 border border-white/5">
                  {reviewTask.events.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-3">暂无事件</p>
                  ) : (
                    reviewTask.events.map((event) => {
                      const isSelected = anomalyForm.relatedEventIds.includes(event.id);
                      const EventIcon = getEventIcon(event.type);
                      return (
                        <button
                          key={event.id}
                          onClick={() => toggleEventLink(event.id)}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all",
                            isSelected
                              ? "bg-ice-500/15 border border-ice-500/30"
                              : "hover:bg-white/5 border border-transparent"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEventLink(event.id)}
                            className="rounded border-gray-600 bg-cold-800 text-ice-500 focus:ring-ice-500"
                          />
                          <EventIcon className="w-4 h-4 text-warning-400" />
                          <span className="text-sm text-white flex-1">{event.typeName}</span>
                          <span className="text-xs text-gray-500 font-num">
                            {new Date(event.timestamp).toLocaleString("zh-CN", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              {anomalyForm.probeId && anomalyForm.startTime && anomalyForm.endTime && (
                <div className="p-3 rounded-lg bg-cold-800/50 border border-ice-500/10">
                  <p className="text-xs text-gray-500 mb-2">温度统计预览</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">最高</p>
                      <p className="text-sm text-danger-400 font-num">
                        {calculateAnomalyStats(
                          anomalyForm.probeId,
                          anomalyForm.startTime,
                          anomalyForm.endTime
                        ).maxTemp.toFixed(1)}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">最低</p>
                      <p className="text-sm text-success-400 font-num">
                        {calculateAnomalyStats(
                          anomalyForm.probeId,
                          anomalyForm.startTime,
                          anomalyForm.endTime
                        ).minTemp.toFixed(1)}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">平均</p>
                      <p className="text-sm text-ice-300 font-num">
                        {calculateAnomalyStats(
                          anomalyForm.probeId,
                          anomalyForm.startTime,
                          anomalyForm.endTime
                        ).avgTemp.toFixed(1)}°C
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAnomalyModal(false);
                  setEditingAnomalyId(null);
                }}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveAnomaly}
                className="btn-glow px-5 py-2 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
