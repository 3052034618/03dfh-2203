import {
  ClipboardList,
  Clock,
  AlertTriangle,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useAppStore } from "@/store/appStore";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { dashboardStats, auditTasks } = useAppStore();
  const navigate = useNavigate();

  const stats = [
    {
      label: "今日运输任务",
      value: dashboardStats.totalTasks,
      unit: "单",
      icon: ClipboardList,
      color: "from-ice-500 to-ice-300",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "待审核布控",
      value: dashboardStats.pendingAudits,
      unit: "单",
      icon: Clock,
      color: "from-warning-500 to-warning-400",
      trend: "+2",
      trendUp: true,
    },
    {
      label: "异常探头",
      value: dashboardStats.abnormalCount,
      unit: "个",
      icon: AlertTriangle,
      color: "from-danger-500 to-danger-400",
      trend: "-1",
      trendUp: false,
    },
    {
      label: "在用模板",
      value: dashboardStats.templateCount,
      unit: "套",
      icon: MapPin,
      color: "from-success-500 to-success-400",
      trend: "稳定",
      trendUp: true,
    },
  ];

  const recentTasks = auditTasks.slice(0, 5);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "待审核",
      approved: "已通过",
      rejected: "已退回",
      resubmitted: "重新提交",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card p-5 hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-num text-white">
                      {stat.value}
                    </span>
                    <span className="text-sm text-gray-400">{stat.unit}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {stat.trendUp ? (
                  <ArrowUpRight className="w-4 h-4 text-success-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-danger-500" />
                )}
                <span className={`text-sm ${stat.trendUp ? "text-success-500" : "text-danger-500"}`}>
                  {stat.trend}
                </span>
                <span className="text-xs text-gray-500">较昨日</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">任务趋势</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-xs rounded-lg bg-ice-500/15 text-ice-400 border border-ice-500/20">
                近7天
              </button>
              <button className="px-3 py-1 text-xs rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                近30天
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardStats.taskTrend}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17, 34, 64, 0.9)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#00D4FF"
                  strokeWidth={2}
                  fill="url(#colorTasks)"
                  name="任务数"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">待办审核</h3>
            <button
              onClick={() => navigate("/audits")}
              className="text-xs text-ice-400 hover:text-ice-300 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentTasks.filter((t) => t.status === "pending" || t.status === "resubmitted").map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/audits/${task.id}`)}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{task.taskNo}</span>
                  <span className={`tag tag-${task.status}`}>{getStatusLabel(task.status)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{task.templateName}</span>
                  <span>{task.vehicleNo}</span>
                </div>
              </div>
            ))}
            {recentTasks.filter((t) => t.status === "pending" || t.status === "resubmitted").length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">暂无待办审核</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">快速操作</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/templates/new")}
            className="p-4 rounded-xl bg-gradient-to-br from-ice-500/10 to-purple-500/10 border border-ice-500/20 hover:border-ice-500/40 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-ice-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-ice-400" />
            </div>
            <p className="text-sm font-medium text-white">新建线路模板</p>
            <p className="text-xs text-gray-400 mt-1">创建探头布控方案</p>
          </button>

          <button
            onClick={() => navigate("/audits")}
            className="p-4 rounded-xl bg-gradient-to-br from-warning-500/10 to-orange-500/10 border border-warning-500/20 hover:border-warning-500/40 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-warning-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5 text-warning-400" />
            </div>
            <p className="text-sm font-medium text-white">处理审核</p>
            <p className="text-xs text-gray-400 mt-1">待审核 {dashboardStats.pendingAudits} 单</p>
          </button>

          <button
            onClick={() => navigate("/reviews")}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-sm font-medium text-white">异常复盘</p>
            <p className="text-xs text-gray-400 mt-1">分析温度数据</p>
          </button>

          <button
            onClick={() => navigate("/templates")}
            className="p-4 rounded-xl bg-gradient-to-br from-success-500/10 to-emerald-500/10 border border-success-500/20 hover:border-success-500/40 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-success-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-success-400" />
            </div>
            <p className="text-sm font-medium text-white">模板库</p>
            <p className="text-xs text-gray-400 mt-1">{dashboardStats.templateCount} 套模板可用</p>
          </button>
        </div>
      </div>
    </div>
  );
}
