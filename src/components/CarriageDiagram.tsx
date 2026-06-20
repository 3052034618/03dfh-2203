import type { TemperatureZone, ProbePoint, DeployedProbe } from "@/types";
import { MapPin, AlertCircle } from "lucide-react";

interface CarriageDiagramProps {
  zones: TemperatureZone[];
  points: ProbePoint[];
  deployedProbes?: DeployedProbe[];
  missingPoints?: string[];
  showLabels?: boolean;
  interactive?: boolean;
  onPointClick?: (point: ProbePoint) => void;
  selectedPointId?: string;
  width?: number;
  height?: number;
}

export default function CarriageDiagram({
  zones,
  points,
  deployedProbes = [],
  missingPoints = [],
  showLabels = true,
  interactive = false,
  onPointClick,
  selectedPointId,
  width = 600,
  height = 280,
}: CarriageDiagramProps) {
  const getProbeStatus = (pointId: string) => {
    const probe = deployedProbes.find((p) => p.pointId === pointId);
    if (!probe) return missingPoints.includes(pointId) ? "missing" : "unknown";
    return probe.deviceStatus;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "#2DD4A0";
      case "offline":
        return "#64748b";
      case "abnormal":
        return "#FF5757";
      case "missing":
        return "#FF8A3D";
      default:
        return "#00D4FF";
    }
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: height }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="carriageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 212, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 212, 255, 0.05)" />
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 212, 255, 0.05)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="10" y="10" width={width - 20} height={height - 20} rx="8" fill="url(#carriageGradient)" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="2" />
        <rect x="10" y="10" width={width - 20} height={height - 20} rx="8" fill="url(#grid)" />

        {zones.map((zone) => (
          <g key={zone.id}>
            <rect
              x={10 + (zone.bounds.x / 100) * (width - 20)}
              y={10 + (zone.bounds.y / 100) * (height - 20)}
              width={(zone.bounds.width / 100) * (width - 20)}
              height={(zone.bounds.height / 100) * (height - 20)}
              fill={zone.color}
              fillOpacity={0.15}
              stroke={zone.color}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
            {showLabels && (
              <text
                x={10 + (zone.bounds.x / 100) * (width - 20) + 10}
                y={10 + (zone.bounds.y / 100) * (height - 20) + 22}
                fill={zone.color}
                fontSize="12"
                fontWeight="500"
              >
                {zone.name} · {zone.targetTemp}°C
              </text>
            )}
          </g>
        ))}

        {points.map((point) => {
          const cx = 10 + (point.x / 100) * (width - 20);
          const cy = 10 + (point.y / 100) * (height - 20);
          const status = getProbeStatus(point.id);
          const isSelected = selectedPointId === point.id;
          const isMissing = status === "missing";
          const hasProbe = deployedProbes.some((p) => p.pointId === point.id);

          return (
            <g
              key={point.id}
              onClick={() => interactive && onPointClick?.(point)}
              className={interactive ? "cursor-pointer" : ""}
              style={{ transition: "transform 0.2s ease" }}
            >
              {isSelected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r="20"
                  fill="none"
                  stroke="#00D4FF"
                  strokeWidth="2"
                  opacity={0.5}
                  className="animate-pulse"
                />
              )}

              {hasProbe || point.type === "mandatory" ? (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill={getStatusColor(status)}
                    fillOpacity={isMissing ? 0.3 : 0.9}
                    stroke={getStatusColor(status)}
                    strokeWidth="2"
                    filter={status === "online" || status === "abnormal" ? "url(#glow)" : undefined}
                    className={status === "online" || status === "abnormal" ? "animate-pulse" : ""}
                  />
                  {isMissing && (
                    <AlertCircle
                      x={cx - 6}
                      y={cy - 6}
                      width="12"
                      height="12"
                      fill="#FF8A3D"
                      stroke="#0a1628"
                    />
                  )}
                </>
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r="10"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              )}

              {showLabels && (
                <text
                  x={cx}
                  y={cy + 28}
                  textAnchor="middle"
                  fill={isMissing ? "#FF8A3D" : "#94a3b8"}
                  fontSize="11"
                  fontWeight={point.type === "mandatory" ? "500" : "400"}
                >
                  {point.name}
                  {point.type === "mandatory" && " *"}
                </text>
              )}
            </g>
          );
        })}

        <text x={width - 20} y={height - 20} textAnchor="end" fill="rgba(100, 116, 139, 0.5)" fontSize="10">
          车厢俯视图
        </text>
      </svg>

      {deployedProbes.length > 0 && (
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success-500 animate-pulse"></span>
            <span className="text-gray-400">在线</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
            <span className="text-gray-400">离线</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-danger-500 animate-pulse"></span>
            <span className="text-gray-400">异常</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-warning-500"></span>
            <span className="text-gray-400">缺失</span>
          </div>
        </div>
      )}
    </div>
  );
}
