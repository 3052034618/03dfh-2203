import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Edit, Eye, Plus, Trash2, Settings, Thermometer, PaintBucket, Ruler } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import CarriageDiagram from "@/components/CarriageDiagram";
import type { LineTemplate, ProbePoint, TemperatureZone } from "@/types";
import { cn } from "@/lib/utils";

const presetColors = [
  "#00D4FF",
  "#7C3AED",
  "#FF8A3D",
  "#2DD4A0",
  "#FF5757",
  "#FBBF24",
  "#A78BFA",
  "#F472B6",
];

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getTemplateById, updateTemplate, addTemplate } = useAppStore();
  const isNew = id === "new";
  const isEditMode = searchParams.get("edit") === "true" || isNew;

  const [formData, setFormData] = useState<Omit<LineTemplate, "id" | "createdAt" | "updatedAt" | "usageCount">>({
    name: "",
    category: "trunk",
    categoryName: "干线运输",
    status: "inactive",
    description: "",
    carriage: { length: 9.6, width: 2.4, height: 2.6, volume: 59.9 },
    zones: [],
    points: [],
    sensitivityLevel: "normal",
  });

  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "zones" | "points">("basic");

  useEffect(() => {
    if (!isNew && id) {
      const template = getTemplateById(id);
      if (template) {
        setFormData({
          name: template.name,
          category: template.category,
          categoryName: template.categoryName,
          status: template.status,
          description: template.description,
          carriage: { ...template.carriage },
          zones: template.zones.map((z) => ({ ...z, bounds: { ...z.bounds }, tempRange: { ...z.tempRange } })),
          points: template.points.map((p) => ({ ...p })),
          sensitivityLevel: template.sensitivityLevel,
        });
        if (template.zones.length > 0) {
          setSelectedZoneId(template.zones[0].id);
        }
      }
    } else if (isNew) {
      const defaultZones: TemperatureZone[] = [
        {
          id: "zone-default",
          name: "冷藏区",
          color: "#00D4FF",
          targetTemp: 4,
          tempRange: { min: 2, max: 8 },
          bounds: { x: 0, y: 0, width: 100, height: 100 },
        },
      ];
      const defaultPoints: ProbePoint[] = [
        { id: "p1", name: "前顶部", type: "mandatory", x: 15, y: 20, zoneId: "zone-default", description: "靠近制冷机组" },
        { id: "p2", name: "中部", type: "mandatory", x: 50, y: 50, zoneId: "zone-default", description: "车厢中心位置" },
        { id: "p3", name: "后底部", type: "mandatory", x: 85, y: 80, zoneId: "zone-default", description: "靠近尾部车门" },
      ];
      setFormData((prev) => ({
        ...prev,
        zones: defaultZones,
        points: defaultPoints,
      }));
      setSelectedZoneId("zone-default");
    }
  }, [id, isNew, getTemplateById]);

  const categoryOptions = [
    { value: "trunk", label: "干线运输" },
    { value: "city", label: "城市配送" },
    { value: "pharmacy", label: "医药专线" },
    { value: "custom", label: "自定义" },
  ];

  const sensitivityOptions = [
    { value: "normal", label: "普通" },
    { value: "sensitive", label: "敏感" },
    { value: "highly-sensitive", label: "高敏感" },
  ];

  const handleCategoryChange = (value: string) => {
    const option = categoryOptions.find((o) => o.value === value);
    setFormData((prev) => ({
      ...prev,
      category: value as LineTemplate["category"],
      categoryName: option?.label || "",
    }));
  };

  const handleCarriageChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      carriage: {
        ...prev.carriage,
        [field]: value,
        volume:
          field === "length" || field === "width" || field === "height"
            ? Number(
                (
                  (field === "length" ? value : prev.carriage.length) *
                  (field === "width" ? value : prev.carriage.width) *
                  (field === "height" ? value : prev.carriage.height)
                ).toFixed(1)
              )
            : prev.carriage.volume,
      },
    }));
  };

  // ========== 温区操作 ==========
  const addZone = () => {
    const newId = `zone-${Date.now()}`;
    // 计算新温区位置 - 默认占据右侧一半的一半
    const existingZones = formData.zones;
    const totalWidth = existingZones.reduce((sum, z) => sum + z.bounds.width, 0);
    const remainingWidth = 100 - totalWidth;

    if (existingZones.length === 0) {
      const newZone: TemperatureZone = {
        id: newId,
        name: "新温区",
        color: presetColors[0],
        targetTemp: 4,
        tempRange: { min: 0, max: 8 },
        bounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      setFormData((prev) => ({ ...prev, zones: [...prev.zones, newZone] }));
      setSelectedZoneId(newId);
      return;
    }

    // 找到最后一个温区，缩小它，在右边加新的
    const lastZone = existingZones[existingZones.length - 1];
    const newWidth = Math.max(15, Math.floor(lastZone.bounds.width / 2));
    const oldWidth = lastZone.bounds.width - newWidth;

    const updatedZones = existingZones.map((z, idx) => {
      if (idx === existingZones.length - 1) {
        return { ...z, bounds: { ...z.bounds, width: oldWidth } };
      }
      return z;
    });

    const newZone: TemperatureZone = {
      id: newId,
      name: `温区${existingZones.length + 1}`,
      color: presetColors[existingZones.length % presetColors.length],
      targetTemp: lastZone.targetTemp,
      tempRange: { ...lastZone.tempRange },
      bounds: {
        x: lastZone.bounds.x + oldWidth,
        y: lastZone.bounds.y,
        width: newWidth,
        height: lastZone.bounds.height,
      },
    };

    updatedZones.push(newZone);
    setFormData((prev) => ({ ...prev, zones: updatedZones }));
    setSelectedZoneId(newId);
  };

  const updateZone = (zoneId: string, updates: Partial<TemperatureZone>) => {
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.id === zoneId ? { ...z, ...updates } : z)),
    }));
  };

  const updateZoneBounds = (zoneId: string, boundUpdates: Partial<TemperatureZone["bounds"]>) => {
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones.map((z) =>
        z.id === zoneId
          ? { ...z, bounds: { ...z.bounds, ...boundUpdates } }
          : z
      ),
    }));
  };

  const deleteZone = (zoneId: string) => {
    if (formData.zones.length <= 1) {
      alert("至少需要保留一个温区");
      return;
    }
    const zoneToDelete = formData.zones.find((z) => z.id === zoneId);
    if (!zoneToDelete) return;

    // 找到相邻温区（优先左边），把删除的温区空间给它
    const idx = formData.zones.findIndex((z) => z.id === zoneId);
    const adjacentIdx = idx > 0 ? idx - 1 : idx + 1;

    setFormData((prev) => {
      const newZones = prev.zones.filter((z) => z.id !== zoneId);
      if (adjacentIdx >= 0 && adjacentIdx < newZones.length) {
        const adjacent = newZones[idx > 0 ? idx - 1 : idx];
        newZones[idx > 0 ? idx - 1 : idx] = {
          ...adjacent,
          bounds: {
            ...adjacent.bounds,
            x: Math.min(adjacent.bounds.x, zoneToDelete.bounds.x),
            width: adjacent.bounds.width + zoneToDelete.bounds.width,
          },
        };
      }
      // 同时更新点位的 zoneId 引用
      const newPoints = prev.points.map((p) =>
        p.zoneId === zoneId ? { ...p, zoneId: newZones[0]?.id } : p
      );
      return { ...prev, zones: newZones, points: newPoints };
    });

    if (selectedZoneId === zoneId) {
      setSelectedZoneId(formData.zones.find((z) => z.id !== zoneId)?.id || null);
    }
  };

  // ========== 点位操作 ==========
  const addPoint = () => {
    const newPoint: ProbePoint = {
      id: `p-${Date.now()}`,
      name: `点位${formData.points.length + 1}`,
      type: "optional",
      x: 50,
      y: 50,
      zoneId: selectedZoneId || formData.zones[0]?.id,
      description: "",
    };
    setFormData((prev) => ({ ...prev, points: [...prev.points, newPoint] }));
    setSelectedPointId(newPoint.id);
  };

  const updatePoint = (pointId: string, updates: Partial<ProbePoint>) => {
    setFormData((prev) => ({
      ...prev,
      points: prev.points.map((p) => (p.id === pointId ? { ...p, ...updates } : p)),
    }));
  };

  const deletePoint = (pointId: string) => {
    setFormData((prev) => ({
      ...prev,
      points: prev.points.filter((p) => p.id !== pointId),
    }));
    if (selectedPointId === pointId) {
      setSelectedPointId(null);
    }
  };

  const handleDiagramPointClick = (point: ProbePoint) => {
    if (isEditMode) {
      setSelectedPointId(point.id);
      // 如果在点位tab，自动选中
      if (activeTab === "points") {
        setActiveTab("points");
      }
    }
  };

  const selectedZone = formData.zones.find((z) => z.id === selectedZoneId);
  const selectedPoint = formData.points.find((p) => p.id === selectedPointId);

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("请填写模板名称");
      return;
    }
    if (formData.zones.length === 0) {
      alert("至少需要一个温区");
      return;
    }
    if (isNew) {
      addTemplate(formData);
      navigate("/templates");
    } else if (id) {
      updateTemplate(id, formData);
      navigate(`/templates/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/templates")}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? "新建线路模板" : formData.name || "加载中..."}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {isNew ? "创建新的探头布控方案" : formData.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              onClick={() => navigate(`/templates/${id}?edit=${isEditMode ? "false" : "true"}`)}
              className="px-4 py-2 rounded-lg border border-ice-500/30 text-ice-400 hover:bg-ice-500/10 transition-colors flex items-center gap-2"
            >
              {isEditMode ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditMode ? "预览模式" : "编辑模式"}
            </button>
          )}
          {(isEditMode || isNew) && (
            <button onClick={handleSave} className="btn-glow px-5 py-2 flex items-center gap-2">
              <Save className="w-5 h-5" />
              保存模板
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-ice-400" />
                车厢平面图
              </h3>
              <div className="flex items-center gap-3">
                {isEditMode && activeTab === "zones" && (
                  <button
                    onClick={addZone}
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    添加温区
                  </button>
                )}
                {isEditMode && activeTab === "points" && (
                  <button
                    onClick={addPoint}
                    className="text-sm text-ice-400 hover:text-ice-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    添加点位
                  </button>
                )}
              </div>
            </div>

            <div className="bg-cold-900/50 rounded-xl p-6">
              {/* 自定义平面图：在温区选中模式下支持点击添加/编辑 */}
              <CarriageDiagramWithZoneSelect
                zones={formData.zones}
                points={formData.points}
                showLabels={true}
                interactive={isEditMode}
                onPointClick={handleDiagramPointClick}
                selectedPointId={selectedPointId}
                selectedZoneId={selectedZoneId}
                onZoneClick={(zone) => {
                  if (isEditMode && activeTab === "zones") {
                    setSelectedZoneId(zone.id);
                  }
                }}
                width={600}
                height={280}
              />
            </div>

            {isEditMode && activeTab === "zones" && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                选择温区后可在右侧编辑属性；点击「添加温区」自动在右侧生成新分区
              </p>
            )}
            {isEditMode && activeTab === "points" && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                点击平面图选中点位，选中后可在右侧编辑属性
              </p>
            )}
          </div>

          {isEditMode && selectedZone && activeTab === "zones" && (
            <div className="glass-card p-5 border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <PaintBucket className="w-5 h-5" style={{ color: selectedZone.color }} />
                  温区属性 - {selectedZone.name}
                </h3>
                <button
                  onClick={() => deleteZone(selectedZone.id)}
                  className="px-3 py-1.5 text-sm text-danger-400 hover:bg-danger-500/10 rounded-lg flex items-center gap-1"
                  disabled={formData.zones.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                  删除温区
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">温区名称</label>
                  <input
                    type="text"
                    value={selectedZone.name}
                    onChange={(e) => updateZone(selectedZone.id, { name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">目标温度 (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedZone.targetTemp}
                    onChange={(e) => updateZone(selectedZone.id, { targetTemp: Number(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">温度下限 (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedZone.tempRange.min}
                    onChange={(e) =>
                      updateZone(selectedZone.id, {
                        tempRange: { ...selectedZone.tempRange, min: Number(e.target.value) },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">温度上限 (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedZone.tempRange.max}
                    onChange={(e) =>
                      updateZone(selectedZone.id, {
                        tempRange: { ...selectedZone.tempRange, max: Number(e.target.value) },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-2">温区颜色</label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateZone(selectedZone.id, { color })}
                      className={cn(
                        "w-8 h-8 rounded-lg border-2 transition-all",
                        selectedZone.color === color
                          ? "border-white scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-ice-500/10">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-ice-400" />
                  区域占比（相对车厢百分比）
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">X 起点 (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedZone.bounds.x}
                      onChange={(e) => updateZoneBounds(selectedZone.id, { x: Number(e.target.value) })}
                      className="input-field w-full text-sm py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Y 起点 (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedZone.bounds.y}
                      onChange={(e) => updateZoneBounds(selectedZone.id, { y: Number(e.target.value) })}
                      className="input-field w-full text-sm py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">宽度 (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={selectedZone.bounds.width}
                      onChange={(e) => updateZoneBounds(selectedZone.id, { width: Number(e.target.value) })}
                      className="input-field w-full text-sm py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">高度 (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={selectedZone.bounds.height}
                      onChange={(e) => updateZoneBounds(selectedZone.id, { height: Number(e.target.value) })}
                      className="input-field w-full text-sm py-1.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEditMode && selectedPoint && activeTab === "points" && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-warning-400" />
                  点位属性 - {selectedPoint.name}
                </h3>
                <button
                  onClick={() => deletePoint(selectedPoint.id)}
                  className="px-3 py-1.5 text-sm text-danger-400 hover:bg-danger-500/10 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  删除点位
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">点位名称</label>
                  <input
                    type="text"
                    value={selectedPoint.name}
                    onChange={(e) => updatePoint(selectedPoint.id, { name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">点位类型</label>
                  <select
                    value={selectedPoint.type}
                    onChange={(e) =>
                      updatePoint(selectedPoint.id, { type: e.target.value as "mandatory" | "optional" })
                    }
                    className="input-field w-full"
                  >
                    <option value="mandatory">必放点位</option>
                    <option value="optional">可选点位</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">所属温区</label>
                  <select
                    value={selectedPoint.zoneId || ""}
                    onChange={(e) => updatePoint(selectedPoint.id, { zoneId: e.target.value })}
                    className="input-field w-full"
                  >
                    {formData.zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">X (%)</label>
                    <input
                      type="number"
                      value={selectedPoint.x}
                      onChange={(e) => updatePoint(selectedPoint.id, { x: Number(e.target.value) })}
                      className="input-field w-full"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Y (%)</label>
                    <input
                      type="number"
                      value={selectedPoint.y}
                      onChange={(e) => updatePoint(selectedPoint.id, { y: Number(e.target.value) })}
                      className="input-field w-full"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1.5">点位说明</label>
                  <input
                    type="text"
                    value={selectedPoint.description}
                    onChange={(e) => updatePoint(selectedPoint.id, { description: e.target.value })}
                    className="input-field w-full"
                    placeholder="描述点位用途或注意事项"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5">
            <div className="flex gap-1 mb-5 bg-cold-800/50 rounded-lg p-1">
              {[
                { key: "basic", label: "基本信息" },
                { key: "zones", label: "温区设置" },
                { key: "points", label: "点位管理" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                    activeTab === tab.key
                      ? "bg-ice-500/15 text-ice-400"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "basic" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">模板名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditMode && !isNew}
                    className="input-field w-full"
                    placeholder="请输入模板名称"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">模板分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    disabled={!isEditMode && !isNew}
                    className="input-field w-full"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">敏感等级</label>
                  <select
                    value={formData.sensitivityLevel}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sensitivityLevel: e.target.value as LineTemplate["sensitivityLevel"],
                      }))
                    }
                    disabled={!isEditMode && !isNew}
                    className="input-field w-full"
                  >
                    {sensitivityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">模板描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    disabled={!isEditMode && !isNew}
                    className="input-field w-full h-20 resize-none"
                    placeholder="描述模板适用场景"
                  />
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-400 mb-3">车厢尺寸</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">长度 (m)</label>
                      <input
                        type="number"
                        value={formData.carriage.length}
                        onChange={(e) => handleCarriageChange("length", Number(e.target.value))}
                        disabled={!isEditMode && !isNew}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">宽度 (m)</label>
                      <input
                        type="number"
                        value={formData.carriage.width}
                        onChange={(e) => handleCarriageChange("width", Number(e.target.value))}
                        disabled={!isEditMode && !isNew}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">高度 (m)</label>
                      <input
                        type="number"
                        value={formData.carriage.height}
                        onChange={(e) => handleCarriageChange("height", Number(e.target.value))}
                        disabled={!isEditMode && !isNew}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">容积 (m³)</label>
                      <input
                        type="number"
                        value={formData.carriage.volume}
                        readOnly
                        className="input-field w-full bg-cold-900/50 text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "zones" && (
              <div className="space-y-3">
                {formData.zones.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-6">暂无温区，点击添加</p>
                )}
                {formData.zones.map((zone) => (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all",
                      selectedZoneId === zone.id
                        ? "bg-ice-500/10 border border-ice-500/30"
                        : "bg-cold-800/30 border border-transparent hover:border-ice-500/20"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: zone.color }}
                      ></div>
                      <span className="text-sm text-white font-medium flex-1 truncate">
                        {zone.name}
                      </span>
                      <span className="text-xs text-gray-400 font-num">
                        {zone.targetTemp}°C
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <span>
                        范围: {zone.tempRange.min}~{zone.tempRange.max}°C
                      </span>
                      <span>
                        占比: {zone.bounds.width}×{zone.bounds.height}%
                      </span>
                    </div>
                  </div>
                ))}
                {isEditMode && (
                  <button
                    onClick={addZone}
                    className="w-full py-2.5 border border-dashed border-ice-500/30 rounded-lg text-sm text-ice-400 hover:bg-ice-500/5 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    添加温区
                  </button>
                )}
              </div>
            )}

            {activeTab === "points" && (
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                {formData.points.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-6">暂无点位，点击添加</p>
                )}
                {formData.points.map((point, idx) => {
                  const zone = formData.zones.find((z) => z.id === point.zoneId);
                  return (
                    <div
                      key={point.id}
                      onClick={() => setSelectedPointId(point.id)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all",
                        selectedPointId === point.id
                          ? "bg-ice-500/10 border border-ice-500/30"
                          : "bg-cold-800/30 border border-transparent hover:border-ice-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              point.type === "mandatory" ? "bg-ice-400" : "bg-gray-500"
                            )}
                          ></span>
                          <span className="text-sm text-white">
                            {idx + 1}. {point.name}
                          </span>
                        </div>
                        {zone && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${zone.color}20`,
                              color: zone.color,
                            }}
                          >
                            {zone.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-3">
                        <span>
                          {point.type === "mandatory" ? "必放" : "可选"}
                        </span>
                        <span className="font-num">
                          ({point.x.toFixed(0)}, {point.y.toFixed(0)})
                        </span>
                      </div>
                      {point.description && (
                        <p className="text-xs text-gray-500 mt-1.5 truncate">{point.description}</p>
                      )}
                    </div>
                  );
                })}
                {isEditMode && (
                  <button
                    onClick={addPoint}
                    className="w-full py-2.5 border border-dashed border-ice-500/30 rounded-lg text-sm text-ice-400 hover:bg-ice-500/5 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    添加点位
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">统计信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-cold-800/30 rounded-lg">
                <p className="text-2xl font-bold font-num text-ice-400">{formData.zones.length}</p>
                <p className="text-xs text-gray-500 mt-1">温区数量</p>
              </div>
              <div className="text-center p-3 bg-cold-800/30 rounded-lg">
                <p className="text-2xl font-bold font-num text-warning-400">
                  {formData.points.filter((p) => p.type === "mandatory").length}
                </p>
                <p className="text-xs text-gray-500 mt-1">必放点位</p>
              </div>
              <div className="text-center p-3 bg-cold-800/30 rounded-lg">
                <p className="text-2xl font-bold font-num text-success-400">
                  {formData.points.filter((p) => p.type === "optional").length}
                </p>
                <p className="text-xs text-gray-500 mt-1">可选点位</p>
              </div>
              <div className="text-center p-3 bg-cold-800/30 rounded-lg">
                <p className="text-2xl font-bold font-num text-purple-400">{formData.points.length}</p>
                <p className="text-xs text-gray-500 mt-1">总点位</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== 扩展组件：支持温区选择的平面图 ==========
interface CarriageDiagramWithZoneSelectProps {
  zones: TemperatureZone[];
  points: ProbePoint[];
  deployedProbes?: any[];
  missingPoints?: string[];
  showLabels?: boolean;
  interactive?: boolean;
  onPointClick?: (point: ProbePoint) => void;
  onZoneClick?: (zone: TemperatureZone) => void;
  selectedPointId?: string | null;
  selectedZoneId?: string | null;
  width?: number;
  height?: number;
}

function CarriageDiagramWithZoneSelect({
  zones,
  points,
  deployedProbes = [],
  missingPoints = [],
  showLabels = true,
  interactive = false,
  onPointClick,
  onZoneClick,
  selectedPointId,
  selectedZoneId,
  width = 600,
  height = 280,
}: CarriageDiagramWithZoneSelectProps) {
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
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="carriageGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 212, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 212, 255, 0.05)" />
          </linearGradient>
          <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 212, 255, 0.05)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect
          x="10"
          y="10"
          width={width - 20}
          height={height - 20}
          rx="8"
          fill="url(#carriageGradient2)"
          stroke="rgba(0, 212, 255, 0.3)"
          strokeWidth="2"
        />
        <rect
          x="10"
          y="10"
          width={width - 20}
          height={height - 20}
          rx="8"
          fill="url(#grid2)"
        />

        {zones.map((zone) => {
          const isSelected = zone.id === selectedZoneId;
          return (
            <g
              key={zone.id}
              onClick={() => interactive && onZoneClick?.(zone)}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              <rect
                x={10 + (zone.bounds.x / 100) * (width - 20)}
                y={10 + (zone.bounds.y / 100) * (height - 20)}
                width={(zone.bounds.width / 100) * (width - 20)}
                height={(zone.bounds.height / 100) * (height - 20)}
                fill={zone.color}
                fillOpacity={isSelected ? 0.28 : 0.15}
                stroke={zone.color}
                strokeWidth={isSelected ? 3 : 1}
                strokeDasharray={isSelected ? "none" : "4 2"}
                className={isSelected ? "animate-pulse" : ""}
              />
              {showLabels && (
                <text
                  x={10 + (zone.bounds.x / 100) * (width - 20) + 10}
                  y={10 + (zone.bounds.y / 100) * (height - 20) + 22}
                  fill={zone.color}
                  fontSize="12"
                  fontWeight={isSelected ? "700" : "500"}
                >
                  {zone.name} · {zone.targetTemp}°C
                </text>
              )}
            </g>
          );
        })}

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
              onClick={(e) => {
                e.stopPropagation();
                interactive && onPointClick?.(point);
              }}
              style={{ cursor: interactive ? "pointer" : "" }}
            >
              {isSelected && (
                <>
                  <circle cx={cx} cy={cy} r="22" fill="none" stroke="#00D4FF" strokeWidth="1.5" opacity="0.4" />
                  <circle cx={cx} cy={cy} r="16" fill="none" stroke="#00D4FF" strokeWidth="2" opacity="0.7" className="animate-pulse" />
                </>
              )}

              {hasProbe || point.type === "mandatory" ? (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 14 : 12}
                    fill={getStatusColor(status)}
                    fillOpacity={isMissing ? 0.3 : 0.95}
                    stroke={isSelected ? "#ffffff" : getStatusColor(status)}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={status === "online" || status === "abnormal" ? "url(#glow)" : undefined}
                    className={status === "online" || status === "abnormal" ? "animate-pulse" : ""}
                  />
                </>
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 12 : 10}
                  fill="none"
                  stroke={isSelected ? "#ffffff" : "#64748b"}
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              )}

              {showLabels && (
                <text
                  x={cx}
                  y={cy + 30}
                  textAnchor="middle"
                  fill={isMissing ? "#FF8A3D" : isSelected ? "#fff" : "#94a3b8"}
                  fontSize="11"
                  fontWeight={point.type === "mandatory" || isSelected ? "600" : "400"}
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
