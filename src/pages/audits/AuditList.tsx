import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Clock, CheckCircle, XCircle, RotateCcw, ChevronRight, Truck, User } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import type { AuditTask } from "@/types";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "resubmitted";

export default function AuditList() {
  const navigate = useNavigate();
  const { auditTasks } = useAppStore();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const statusTabs = [
    { key: "all", label: "全部", icon: Filter },
    { key: "pending", label: "待审核", icon: Clock },
    { key: "resubmitted", label: "重新提交", icon: RotateCcw },
    { key: "approved", label: "已通过", icon: CheckCircle },
    { key: "rejected", label: "已退回", icon: XCircle },
  ];

  const filteredTasks = auditTasks.filter((task) => {
    const matchSearch = task.taskNo.toLowerCase().includes(searchText.toLowerCase()) ||
      task.vehicleNo.toLowerCase().includes(searchText.toLowerCase()) ||
      task.driverName.includes(searchText) ||
      task.templateName.includes(searchText);
    const matchStatus = statusFilter === "all" || task.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "待审核",
      approved: "已通过",
      rejected: "已退回",
      resubmitted: "重新提交",
    };
    return labels[status] || status;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProbeStatusSummary = (task: AuditTask) => {
    const online = task.deployedProbes.filter((p) => p.deviceStatus === "online").length;
    const offline = task.deployedProbes.filter((p) => p.deviceStatus === "offline").length;
    const abnormal = task.deployedProbes.filter((p) => p.deviceStatus === "abnormal").length;
    const missing = task.missingPoints.length;
    return { online, offline, abnormal, missing, total: task.deployedProbes.length + missing };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">布控审核</h1>
        <p className="text-sm text-gray-400 mt-1">审核现场提交的探头布控方案，确认无误后放行</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-cold-800/50 rounded-xl p-1.5 border border-ice-500/10">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const count = tab.key === "all"
              ? auditTasks.length
              : auditTasks.filter((t) => t.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as StatusFilter)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  statusFilter === tab.key
                    ? "bg-ice-500/15 text-ice-400 border border-ice-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className="text-xs opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="搜索任务号、车牌号、司机..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input-field pl-10 w-72"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const probeStatus = getProbeStatusSummary(task);
          return (
            <div
              key={task.id}
              onClick={() => navigate(`/audits/${task.id}`)}
              className="glass-card p-5 cursor-pointer hover:shadow-xl hover:shadow-ice-500/5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-ice-500/20 to-purple-500/20 border border-ice-500/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-8 h-8 text-ice-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-ice-300 transition-colors">
                        {task.taskNo}
                      </h3>
                      <span className={`tag tag-${task.status}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4" />
                        {task.vehicleNo}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {task.driverName}
                      </span>
                      <span>·</span>
                      <span>{task.templateName}</span>
                    </div>
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="status-dot online"></span>
                        <span className="text-sm text-gray-400">
                          在线 <span className="text-success-400 font-num">{probeStatus.online}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="status-dot offline"></span>
                        <span className="text-sm text-gray-400">
                          离线 <span className="text-gray-400 font-num">{probeStatus.offline}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="status-dot abnormal"></span>
                        <span className="text-sm text-gray-400">
                          异常 <span className="text-danger-400 font-num">{probeStatus.abnormal}</span>
                        </span>
                      </div>
                      {probeStatus.missing > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-warning-500"></span>
                          <span className="text-sm text-gray-400">
                            缺失 <span className="text-warning-400 font-num">{probeStatus.missing}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">提交时间</p>
                    <p className="text-sm text-gray-300 font-num">{formatTime(task.submittedAt)}</p>
                  </div>
                  {task.auditRecord && (
                    <div>
                      <p className="text-xs text-gray-500">审核人</p>
                      <p className="text-sm text-gray-300">{task.auditRecord.auditor}</p>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-500 ml-auto group-hover:text-ice-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">暂无审核任务</p>
          </div>
        )}
      </div>
    </div>
  );
}
