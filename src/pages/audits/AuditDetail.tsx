import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  Truck,
  User,
  Battery,
  Thermometer,
  Camera,
  AlertTriangle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  XCircle,
  Trash2,
  AlertOctagon,
  LogOut,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import CarriageDiagram from "@/components/CarriageDiagram";
import ProbePhoto from "@/components/ProbePhoto";
import type { DeployedProbe, ProbePoint } from "@/types";
import { cn } from "@/lib/utils";

interface AdjustmentMarkDraft {
  pointId: string;
  x: number;
  y: number;
  description: string;
}

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAuditById, getTemplateById, approveAudit, rejectAudit } = useAppStore();

  const auditTask = getAuditById(id || "");
  const template = auditTask ? getTemplateById(auditTask.templateId) : undefined;

  const [selectedProbeId, setSelectedProbeId] = useState<string | null>(
    auditTask?.deployedProbes[0]?.id || null
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectMarkMode, setRejectMarkMode] = useState(false);
  const [adjustmentMarksDraft, setAdjustmentMarksDraft] = useState<AdjustmentMarkDraft[]>([]);
  const [markPointInput, setMarkPointInput] = useState<{ pointId: string; description: string } | null>(null);

  if (!auditTask || !template) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">任务不存在</p>
      </div>
    );
  }

  const selectedProbe = auditTask.deployedProbes.find((p) => p.id === selectedProbeId);
  const selectedPoint = template.points.find((p) => p.id === selectedProbe?.pointId);

  const effectiveAdjustmentMarks =
    auditTask.status === "rejected" && auditTask.auditRecord?.adjustmentMarks
      ? auditTask.auditRecord.adjustmentMarks.map((m) => ({
          pointId: m.pointId,
          x: m.x,
          y: m.y,
          description: m.description,
          id: m.id,
        }))
      : adjustmentMarksDraft.map((m, idx) => ({
          ...m,
          id: `draft-${idx}`,
        }));

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      online: "在线",
      offline: "离线",
      abnormal: "异常",
    };
    return labels[status] || status;
  };

  const getBatteryColor = (level: number) => {
    if (level >= 60) return "text-success-400";
    if (level >= 30) return "text-warning-400";
    return "text-danger-400";
  };

  const handleApprove = () => {
    if (confirm("确认审核通过？")) {
      approveAudit(auditTask.id, "布控规范，设备状态良好，准予放行");
      navigate("/audits");
    }
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      rejectAudit(auditTask.id, rejectReason, adjustmentMarksDraft);
      setShowRejectModal(false);
      setRejectMarkMode(false);
      setAdjustmentMarksDraft([]);
      navigate("/audits");
    }
  };

  const handleRejectButtonClick = () => {
    setRejectMarkMode(true);
  };

  const handleExitRejectMarkMode = () => {
    setRejectMarkMode(false);
    setAdjustmentMarksDraft([]);
    setMarkPointInput(null);
  };

  const handleMarkPoint = (point: ProbePoint) => {
    const existingIdx = adjustmentMarksDraft.findIndex((m) => m.pointId === point.id);
    if (existingIdx !== -1) {
      setMarkPointInput({
        pointId: point.id,
        description: adjustmentMarksDraft[existingIdx].description,
      });
    } else {
      setMarkPointInput({ pointId: point.id, description: "" });
    }
  };

  const handleConfirmMarkPoint = () => {
    if (!markPointInput || !markPointInput.description.trim()) return;

    const point = template.points.find((p) => p.id === markPointInput.pointId);
    if (!point) return;

    const existingIdx = adjustmentMarksDraft.findIndex((m) => m.pointId === markPointInput.pointId);
    const newMark: AdjustmentMarkDraft = {
      pointId: markPointInput.pointId,
      x: point.x,
      y: point.y,
      description: markPointInput.description.trim(),
    };

    if (existingIdx !== -1) {
      const updated = [...adjustmentMarksDraft];
      updated[existingIdx] = newMark;
      setAdjustmentMarksDraft(updated);
    } else {
      setAdjustmentMarksDraft([...adjustmentMarksDraft, newMark]);
    }

    setMarkPointInput(null);
  };

  const handleRemoveAdjustmentMark = (pointId: string) => {
    setAdjustmentMarksDraft((prev) => prev.filter((m) => m.pointId !== pointId));
  };

  const getPointName = (pointId: string) => {
    return template.points.find((p) => p.id === pointId)?.name || pointId;
  };

  const handleConfirmRejectWithMarks = () => {
    setRejectMarkMode(false);
    setShowRejectModal(true);
  };

  const isAudited = auditTask.status === "approved" || auditTask.status === "rejected";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/audits")}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{auditTask.taskNo}</h1>
              <span className={`tag tag-${auditTask.status}`}>
                {auditTask.status === "pending" ? "待审核" :
                 auditTask.status === "approved" ? "已通过" :
                 auditTask.status === "rejected" ? "已退回" : "重新提交"}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{template.name}</p>
          </div>
        </div>

        {!isAudited && !rejectMarkMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRejectButtonClick}
              className="px-5 py-2.5 rounded-lg border border-danger-500/30 text-danger-400 hover:bg-danger-500/10 transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              退回
            </button>
            <button
              onClick={handleApprove}
              className="btn-glow px-5 py-2.5 flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              审核通过
            </button>
          </div>
        )}

        {!isAudited && rejectMarkMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitRejectMarkMode}
              className="px-5 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirmRejectWithMarks}
              className="px-5 py-2.5 rounded-lg bg-danger-500 text-white hover:bg-danger-400 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              确认退回
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-ice-400" />
              运输信息
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">车牌号</span>
                <span className="text-white font-medium">{auditTask.vehicleNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">司机</span>
                <span className="text-white">{auditTask.driverName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">提交人</span>
                <span className="text-white">{auditTask.submittedBy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">提交时间</span>
                <span className="text-white font-num text-xs">
                  {new Date(auditTask.submittedAt).toLocaleString("zh-CN")}
                </span>
              </div>
              <div className="divider my-3"></div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">应布探头</span>
                <span className="text-white font-num">
                  {template.points.filter((p) => p.type === "mandatory").length} 个必放
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">已布探头</span>
                <span className="text-success-400 font-num">{auditTask.deployedProbes.length} 个</span>
              </div>
              {auditTask.missingPoints.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">缺失点位</span>
                  <span className="text-warning-400 font-num">
                    {auditTask.missingPoints.length} 个
                  </span>
                </div>
              )}
            </div>
          </div>

          {auditTask.auditRecord && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                审核记录
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">审核人</span>
                  <span className="text-white">{auditTask.auditRecord.auditor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">审核结果</span>
                  <span className={auditTask.auditRecord.result === "approved" ? "text-success-400" : "text-danger-400"}>
                    {auditTask.auditRecord.result === "approved" ? "通过" : "退回"}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-1.5">审核备注</p>
                  <p className="text-sm text-gray-300 bg-cold-800/50 rounded-lg p-3">
                    {auditTask.auditRecord.remarks}
                  </p>
                </div>
                {auditTask.auditRecord.adjustmentMarks && auditTask.auditRecord.adjustmentMarks.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                      <AlertOctagon className="w-3 h-3 text-danger-400" />
                      调整要求列表
                    </p>
                    <div className="space-y-2">
                      {auditTask.auditRecord.adjustmentMarks.map((mark) => (
                        <div
                          key={mark.id}
                          className="p-2.5 rounded-lg bg-danger-500/10 border border-danger-500/20"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3 h-3 text-danger-400" />
                            <span className="text-xs font-medium text-danger-300">
                              {getPointName(mark.pointId)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {mark.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {auditTask.missingPoints.length > 0 && (
            <div className="glass-card p-5 border-warning-500/30">
              <h3 className="text-sm font-semibold text-warning-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                缺失点位
              </h3>
              <div className="space-y-2">
                {auditTask.missingPoints.map((pointId) => {
                  const point = template.points.find((p) => p.id === pointId);
                  return (
                    <div key={pointId} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-warning-500/10">
                      <MapPin className="w-4 h-4 text-warning-400" />
                      <span className="text-gray-300">{point?.name || pointId}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-5 space-y-6">
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-ice-400" />
              车厢布控平面图
            </h3>
            {rejectMarkMode && (
              <div className="mb-4 p-3 rounded-lg bg-danger-500/10 border border-danger-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-danger-300">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>退回标记模式：点击问题点位并填写调整要求，完成后确认退回</span>
                </div>
                <button
                  onClick={handleExitRejectMarkMode}
                  className="p-1.5 rounded-lg text-danger-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="退出标记模式"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="bg-cold-900/50 rounded-xl p-6">
              <CarriageDiagram
                zones={template.zones}
                points={template.points}
                deployedProbes={auditTask.deployedProbes}
                missingPoints={auditTask.missingPoints}
                showLabels={true}
                interactive={true}
                onPointClick={(point: ProbePoint) => {
                  const probe = auditTask.deployedProbes.find((p) => p.pointId === point.id);
                  if (probe) setSelectedProbeId(probe.id);
                }}
                selectedPointId={selectedProbe?.pointId}
                width={500}
                height={240}
                markMode={rejectMarkMode}
                markedPointIds={adjustmentMarksDraft.map((m) => m.pointId)}
                adjustmentMarks={auditTask.auditRecord?.adjustmentMarks || effectiveAdjustmentMarks}
                onMarkPoint={handleMarkPoint}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg bg-cold-800/30">
                <p className="text-lg font-bold font-num text-success-400">
                  {auditTask.deployedProbes.filter((p) => p.deviceStatus === "online").length}
                </p>
                <p className="text-xs text-gray-500">在线</p>
              </div>
              <div className="p-2 rounded-lg bg-cold-800/30">
                <p className="text-lg font-bold font-num text-gray-400">
                  {auditTask.deployedProbes.filter((p) => p.deviceStatus === "offline").length}
                </p>
                <p className="text-xs text-gray-500">离线</p>
              </div>
              <div className="p-2 rounded-lg bg-cold-800/30">
                <p className="text-lg font-bold font-num text-danger-400">
                  {auditTask.deployedProbes.filter((p) => p.deviceStatus === "abnormal").length}
                </p>
                <p className="text-xs text-gray-500">异常</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              点位照片
            </h3>
            {selectedProbe ? (
              <div className="space-y-4">
                <ProbePhoto
                  probeNo={selectedProbe.probeNo}
                  pointName={selectedPoint?.name || ""}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{selectedPoint?.name}</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        const idx = auditTask.deployedProbes.findIndex((p) => p.id === selectedProbeId);
                        if (idx > 0) setSelectedProbeId(auditTask.deployedProbes[idx - 1].id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                      disabled={auditTask.deployedProbes.findIndex((p) => p.id === selectedProbeId) === 0}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-gray-500 font-num">
                      {auditTask.deployedProbes.findIndex((p) => p.id === selectedProbeId) + 1} / {auditTask.deployedProbes.length}
                    </span>
                    <button
                      onClick={() => {
                        const idx = auditTask.deployedProbes.findIndex((p) => p.id === selectedProbeId);
                        if (idx < auditTask.deployedProbes.length - 1) {
                          setSelectedProbeId(auditTask.deployedProbes[idx + 1].id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                      disabled={auditTask.deployedProbes.findIndex((p) => p.id === selectedProbeId) === auditTask.deployedProbes.length - 1}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">选择点位查看照片</p>
            )}
          </div>
        </div>

        <div className="col-span-4 space-y-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-warning-400" />
              设备状态列表
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {auditTask.deployedProbes.map((probe: DeployedProbe) => {
                const point = template.points.find((p) => p.id === probe.pointId);
                return (
                  <div
                    key={probe.id}
                    onClick={() => setSelectedProbeId(probe.id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all",
                      selectedProbeId === probe.id
                        ? "bg-ice-500/10 border border-ice-500/30"
                        : "bg-cold-800/30 border border-transparent hover:border-ice-500/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`status-dot ${probe.deviceStatus}`}></span>
                        <span className="text-sm font-medium text-white">{point?.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-num">{probe.probeNo}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span className={cn(
                          "font-num",
                          probe.deviceStatus === "abnormal" ? "text-danger-400" : "text-ice-300"
                        )}>
                          {probe.currentTemp}°C
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Battery className={cn("w-3.5 h-3.5", getBatteryColor(probe.batteryLevel))} />
                        <span className={`font-num ${getBatteryColor(probe.batteryLevel)}`}>
                          {probe.batteryLevel}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedProbe && selectedPoint && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">点位详情</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">点位名称</span>
                  <span className="text-white">{selectedPoint.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">类型</span>
                  <span className={selectedPoint.type === "mandatory" ? "text-ice-400" : "text-gray-400"}>
                    {selectedPoint.type === "mandatory" ? "必放点位" : "可选点位"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">设备状态</span>
                  <span className={cn(
                    selectedProbe.deviceStatus === "online" && "text-success-400",
                    selectedProbe.deviceStatus === "offline" && "text-gray-400",
                    selectedProbe.deviceStatus === "abnormal" && "text-danger-400"
                  )}>
                    {getStatusLabel(selectedProbe.deviceStatus)}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-gray-500 text-xs mb-1.5">点位说明</p>
                  <p className="text-gray-300 text-sm bg-cold-800/50 rounded-lg p-2.5">
                    {selectedPoint.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-[480px] max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-danger-400" />
              退回审核
            </h3>
            <p className="text-sm text-gray-400 mb-4">请填写退回原因，现场将根据反馈调整布控。</p>

            {adjustmentMarksDraft.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <AlertOctagon className="w-3 h-3 text-danger-400" />
                    调整标记（{adjustmentMarksDraft.length}）
                  </p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {adjustmentMarksDraft.map((mark, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3 h-3 text-danger-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-danger-300">
                            {getPointName(mark.pointId)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed break-words">
                          {mark.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveAdjustmentMark(mark.pointId)}
                        className="p-1.5 rounded text-gray-500 hover:text-danger-400 hover:bg-danger-500/10 transition-colors flex-shrink-0"
                        title="删除标记"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-field w-full h-32 resize-none mb-4"
              placeholder="请输入退回原因及调整要求..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-lg bg-danger-500 text-white hover:bg-danger-400 transition-colors"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}

      {markPointInput && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card p-5 w-96">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-danger-400" />
              调整说明 - {getPointName(markPointInput.pointId)}
            </h3>
            <p className="text-xs text-gray-400 mb-3">请填写该点位的调整要求，现场将按此整改。</p>
            <textarea
              value={markPointInput.description}
              onChange={(e) =>
                setMarkPointInput({ ...markPointInput, description: e.target.value })
              }
              className="input-field w-full h-28 resize-none mb-4"
              placeholder="如：探头位置需向中间移动 30cm，需固定更牢固..."
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMarkPointInput(null)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handleConfirmMarkPoint}
                disabled={!markPointInput.description.trim()}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors text-sm",
                  markPointInput.description.trim()
                    ? "bg-danger-500 text-white hover:bg-danger-400"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                )}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
