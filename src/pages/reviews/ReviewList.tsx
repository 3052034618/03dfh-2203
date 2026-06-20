import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Clock, CheckCircle, BarChart3, Truck, Calendar, ChevronRight, Star } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "reviewed";

export default function ReviewList() {
  const navigate = useNavigate();
  const { reviewTasks } = useAppStore();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const statusTabs = [
    { key: "all", label: "全部任务", icon: Filter },
    { key: "pending", label: "待复盘", icon: Clock },
    { key: "reviewed", label: "已复盘", icon: CheckCircle },
  ];

  const filteredTasks = reviewTasks.filter((task) => {
    const matchSearch = task.taskNo.toLowerCase().includes(searchText.toLowerCase()) ||
      task.vehicleNo.toLowerCase().includes(searchText.toLowerCase()) ||
      task.templateName.includes(searchText);
    const matchStatus = statusFilter === "all" || task.reviewStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRatingLabel = (rating: string) => {
    const labels: Record<string, string> = {
      good: "良好",
      fair: "一般",
      poor: "较差",
    };
    return labels[rating] || rating;
  };

  const getRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      good: "text-success-400",
      fair: "text-warning-400",
      poor: "text-danger-400",
    };
    return colors[rating] || "text-gray-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">异常复盘</h1>
        <p className="text-sm text-gray-400 mt-1">分析运输过程温度数据，评估布点合理性，持续优化模板</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">已完成任务</p>
              <p className="text-2xl font-bold font-num text-white mt-1">{reviewTasks.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-ice-500/15 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-ice-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">待复盘</p>
              <p className="text-2xl font-bold font-num text-warning-400 mt-1">
                {reviewTasks.filter((t) => t.reviewStatus === "pending").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-warning-500/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">已复盘</p>
              <p className="text-2xl font-bold font-num text-success-400 mt-1">
                {reviewTasks.filter((t) => t.reviewStatus === "reviewed").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success-500/15 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-400" />
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">平均评分</p>
              <p className="text-2xl font-bold font-num text-purple-400 mt-1">
                {(
                  reviewTasks.filter((t) => t.reviewConclusion).reduce((sum, t) => {
                    const score = t.reviewConclusion?.layoutRating === "good" ? 3 :
                      t.reviewConclusion?.layoutRating === "fair" ? 2 : 1;
                    return sum + (score || 0);
                  }, 0) / Math.max(1, reviewTasks.filter((t) => t.reviewConclusion).length)
                ).toFixed(1)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-cold-800/50 rounded-xl p-1.5 border border-ice-500/10">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const count = tab.key === "all"
              ? reviewTasks.length
              : reviewTasks.filter((t) => t.reviewStatus === tab.key).length;
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
            placeholder="搜索任务号、车牌号..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input-field pl-10 w-72"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => navigate(`/reviews/${task.id}`)}
            className="glass-card p-5 cursor-pointer hover:shadow-xl hover:shadow-ice-500/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-7 h-7 text-purple-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-ice-300 transition-colors">
                      {task.taskNo}
                    </h3>
                    <span className={cn(
                      "tag",
                      task.reviewStatus === "reviewed"
                        ? "bg-success-500/10 text-success-400 border border-success-500/30"
                        : "bg-warning-500/10 text-warning-400 border border-warning-500/30"
                    )}>
                      {task.reviewStatus === "reviewed" ? "已复盘" : "待复盘"}
                    </span>
                    {task.reviewConclusion && (
                      <span className={`text-sm font-medium ${getRatingColor(task.reviewConclusion.layoutRating)}`}>
                        评级: {getRatingLabel(task.reviewConclusion.layoutRating)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      {task.vehicleNo}
                    </span>
                    <span>·</span>
                    <span>{task.templateName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      运输时长 {formatDuration(task.startTime, task.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">探头数:</span>
                      <span className="text-sm text-ice-400 font-num">{task.probeData.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">事件数:</span>
                      <span className="text-sm text-purple-400 font-num">{task.events.length}</span>
                    </div>
                    {task.reviewConclusion && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">有效点位:</span>
                        <span className="text-sm text-success-400 font-num">
                          {task.reviewConclusion.effectivePoints.length}
                        </span>
                      </div>
                    )}
                    {task.reviewConclusion && task.reviewConclusion.blindSpots.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">盲区:</span>
                        <span className="text-sm text-danger-400 font-num">
                          {task.reviewConclusion.blindSpots.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <p className="text-xs text-gray-500">发车时间</p>
                <p className="text-sm text-gray-300 font-num">{formatDate(task.startTime)}</p>
                <p className="text-xs text-gray-600 mt-2">抵达时间</p>
                <p className="text-sm text-gray-400 font-num">{formatDate(task.endTime)}</p>
              </div>
            </div>

            <div className="mt-4 h-16 bg-cold-900/50 rounded-lg overflow-hidden px-3 py-2">
              <div className="flex items-end gap-1 h-full">
                {task.probeData[0]?.temperatures.slice(0, 40).map((temp, idx) => {
                  const minTemp = Math.min(...task.probeData[0].temperatures);
                  const maxTemp = Math.max(...task.probeData[0].temperatures);
                  const range = maxTemp - minTemp || 1;
                  const height = ((temp - minTemp) / range) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 rounded-t"
                      style={{
                        height: `${Math.max(10, height)}%`,
                        background: `linear-gradient(to top, rgba(0, 212, 255, 0.3), rgba(0, 212, 255, 0.6))`,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end">
              <span className="text-sm text-ice-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                查看详情 <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">暂无复盘任务</p>
          </div>
        )}
      </div>
    </div>
  );
}
