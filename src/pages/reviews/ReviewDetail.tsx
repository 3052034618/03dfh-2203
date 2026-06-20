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
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  CartesianGrid,
} from "recharts";
import { useAppStore } from "@/store/appStore";
import CarriageDiagram from "@/components/CarriageDiagram";
import { cn } from "@/lib/utils";
import type { ProbeTemperatureData, TransportEvent } from "@/types";

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getReviewById, getTemplateById, saveReviewConclusion } = useAppStore();

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
              <div className="text-sm text-gray-400">
                点击下方探头切换显示
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
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
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "10px" }}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
                  />
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
                      x={new Date(event.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
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
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning-400" />
              运输事件时间轴
            </h3>
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
    </div>
  );
}
