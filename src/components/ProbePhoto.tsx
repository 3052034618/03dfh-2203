import { useState } from "react";
import { Camera, ImageOff, RefreshCw, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProbePhotoProps {
  probeNo: string;
  pointName: string;
  seed?: string;
  className?: string;
}

const photoThemes = [
  { bg: "cold-blue", title: "制冷机组附近" },
  { bg: "cold-white", title: "车厢顶部视角" },
  { bg: "sensor", title: "探头设备特写" },
  { bg: "goods", title: "货物堆叠处" },
  { bg: "door", title: "车门口" },
  { bg: "back", title: "车厢后部" },
];

export default function ProbePhoto({ probeNo, pointName, seed, className }: ProbePhotoProps) {
  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [showZoom, setShowZoom] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // 生成确定性的随机主题，用 probeNo 作为 seed
  const themeIdx = Math.abs(
    (seed || probeNo)
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % photoThemes.length;
  const theme = photoThemes[themeIdx];

  const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(seed || probeNo)}-${attempt}/800/500`;

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgStatus("loading");
    setAttempt((a) => a + 1);
  };

  return (
    <>
      <div
        className={cn(
          "relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br group cursor-pointer select-none",
          className
        )}
        onClick={() => setShowZoom(true)}
      >
        {/* 背景层（模拟冷链现场主题覆盖层，加载前显示 */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity transition-all duration-500",
            imgStatus === "loaded" ? "opacity-0" : "opacity-100"
          )}
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-cold-700 via-cold-800 to-cold-900"></div>
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 30%, rgba(0,212,255,0.3), transparent 50%), radial-gradient(circle at 70% 70%, rgba(124,58,237,0.2), transparent 60%)",
            }}
          ></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {imgStatus === "loading" && (
              <div className="animate-spin w-10 h-10 rounded-full border-2 border-ice-400 border-t-transparent"></div>
            )}
            {imgStatus === "error" && (
              <>
                <ImageOff className="w-14 h-14 text-danger-400/60" />
                <div className="text-center">
                  <p className="text-sm text-danger-300">照片加载失败</p>
                  <button
                    onClick={handleRetry}
                    className="mt-3 inline-flex items-center gap-1 text-xs text-ice-300 hover:text-ice-200 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    重新加载
                  </button>
                </div>
              </>
            )}
            {imgStatus === "loading" && (
              <p className="text-xs text-ice-300/70">加载现场照片中...</p>
            )}
          </div>

          {/* 模拟探头信息文字水印 */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div>
              <div className="text-xs text-ice-300/50 font-mono">{probeNo}</div>
              <div className="text-lg font-bold text-white/90">{theme.title}</div>
            </div>
            <div className="text-[10px] text-white/40">{pointName}</div>
          </div>

          {/* 模拟探头图标 */}
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Camera className="w-4 h-4 text-white/70" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-ice-500/30 backdrop-blur-sm flex items-center justify-center">
              <ZoomIn className="w-4 h-4 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* 真实图片 */}
        <img
          src={imageUrl}
          alt={`${pointName}-${probeNo}`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            imgStatus === "loaded" ? "opacity-100" : "opacity-0 absolute inset-0"
          )}
          onLoad={() => setImgStatus("loaded")}
          onError={() => setImgStatus("error")}
          draggable={false}
        />

        {/* 加载完成后叠加上层信息 */}
        {imgStatus === "loaded" && (
          <>
            <div className="absolute inset-x-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
              <div>
                <div className="text-xs text-ice-300/80 font-mono bg-black/30 px-2 py-0.5 rounded">
                  {probeNo}
                </div>
                <div className="text-sm font-semibold text-white mt-1 drop-shadow-lg">
                  {pointName}
                </div>
              </div>
              <div className="text-[10px] text-white/70 bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                {theme.title}
              </div>
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <ZoomIn className="w-4 h-4 text-white" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 放大弹窗 */}
      {showZoom && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setShowZoom(false)}
        >
          <div className="relative max-w-5xl max-h-[85vh] w-full rounded-2xl overflow-hidden bg-cold-800 border border-ice-500/20 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-cold-900/50">
              <div>
                <div className="text-white font-semibold">{pointName} - 现场布控照片</div>
                <div className="text-xs text-gray-400 font-mono">探头编号: {probeNo}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowZoom(false);
                }}
                className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded hover:bg-white/10 transition"
              >
                关闭
              </button>
            </div>

            <div className="p-0">
              {imgStatus === "error" ? (
                <div className="aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-cold-800 to-cold-900">
                  <ImageOff className="w-20 h-20 text-danger-400/40 mb-4" />
                  <p className="text-lg text-danger-300 mb-2">照片加载失败</p>
                  <p className="text-sm text-gray-500 mb-4">
                    请检查网络连接，或联系现场人员重新上传。
                  </p>
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 text-sm text-ice-300 hover:text-ice-200 px-4 py-2 rounded-lg bg-ice-500/20 hover:bg-ice-500/30 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新加载照片
                  </button>
                </div>
              ) : (
                <div className="aspect-video bg-black">
                  <img
                    src={imageUrl}
                    alt={`${pointName}-${probeNo}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
