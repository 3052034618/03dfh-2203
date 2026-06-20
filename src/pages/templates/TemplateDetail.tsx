import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Edit, Eye, Plus, Trash2, Settings, Thermometer } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import CarriageDiagram from "@/components/CarriageDiagram";
import type { LineTemplate, ProbePoint, TemperatureZone } from "@/types";
import { cn } from "@/lib/utils";

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
          zones: [...template.zones],
          points: [...template.points],
          sensitivityLevel: template.sensitivityLevel,
        });
      }
    } else if (isNew) {
      setFormData((prev) => ({
        ...prev,
        zones: [
          {
            id: "zone-default",
            name: "冷藏区",
            color: "#00D4FF",
            targetTemp: 4,
            tempRange: { min: 2, max: 8 },
            bounds: { x: 0, y: 0, width: 100, height: 100 },
          },
        ],
        points: [
          { id: "p1", name: "前顶部", type: "mandatory", x: 15, y: 20, zoneId: "zone-default", description: "靠近制冷机组" },
          { id: "p2", name: "中部", type: "mandatory", x: 50, y: 50, zoneId: "zone-default", description: "车厢中心位置" },
          { id: "p3", name: "后底部", type: "mandatory", x: 85, y: 80, zoneId: "zone-default", description: "靠近尾部车门" },
        ],
      }));
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
        volume: field === "length" || field === "width" || field === "height"
          ? Number(((field === "length" ? value : prev.carriage.length) *
              (field === "width" ? value : prev.carriage.width) *
              (field === "height" ? value : prev.carriage.height)).toFixed(1))
          : prev.carriage.volume,
      },
    }));
  };

  const addPoint = () => {
    const newPoint: ProbePoint = {
      id: `p-${Date.now()}`,
      name: `点位${formData.points.length + 1}`,
      type: "optional",
      x: 50,
      y: 50,
      zoneId: formData.zones[0]?.id,
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
    }
  };

  const handleDiagramClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isEditMode || !activeTab) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (selectedPointId && activeTab === "points") {
      updatePoint(selectedPointId, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    }
  };

  const handleSave = () => {
    if (isNew) {
      addTemplate(formData);
      navigate("/templates");
    } else if (id) {
      updateTemplate(id, formData);
      navigate(`/templates/${id}`);
    }
  };

  const selectedPoint = formData.points.find((p) => p.id === selectedPointId);

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
              {isNew ? "新建线路模板" : formData.name}
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
            <div
              className="bg-cold-900/50 rounded-xl p-6 cursor-crosshair"
              onClick={(e) => {
                const svg = e.currentTarget.querySelector("svg");
                if (svg) handleDiagramClick(e as unknown as React.MouseEvent<SVGSVGElement>);
              }}
            >
              <CarriageDiagram
                zones={formData.zones}
                points={formData.points}
                showLabels={true}
                interactive={isEditMode && activeTab === "points"}
                onPointClick={handleDiagramPointClick}
                selectedPointId={selectedPointId}
                width={600}
                height={280}
              />
            </div>
            {isEditMode && activeTab === "points" && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                点击平面图添加点位，拖动或点击选中点位后可编辑位置
              </p>
            )}
          </div>

          {isEditMode && selectedPoint && (
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-warning-400" />
                点位属性 - {selectedPoint.name}
              </h3>
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
                    onChange={(e) => updatePoint(selectedPoint.id, { type: e.target.value as "mandatory" | "optional" })}
                    className="input-field w-full"
                  >
                    <option value="mandatory">必放点位</option>
                    <option value="optional">可选点位</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">X 坐标 (%)</label>
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
                  <label className="block text-sm text-gray-400 mb-1.5">Y 坐标 (%)</label>
                  <input
                    type="number"
                    value={selectedPoint.y}
                    onChange={(e) => updatePoint(selectedPoint.id, { y: Number(e.target.value) })}
                    className="input-field w-full"
                    min={0}
                    max={100}
                  />
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
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => deletePoint(selectedPoint.id)}
                  className="px-3 py-1.5 text-sm text-danger-400 hover:bg-danger-500/10 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  删除点位
                </button>
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
                  <label className="block text-sm text-gray-400 mb-1.5">模板名称</label>
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
                {formData.zones.map((zone) => (
                  <div key={zone.id} className="p-3 rounded-lg bg-cold-800/30 border border-ice-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: zone.color }}
                      ></div>
                      <span className="text-sm font-medium text-white flex-1">{zone.name}</span>
                      {isEditMode && (
                        <button className="text-gray-400 hover:text-danger-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>目标温度: {zone.targetTemp}°C</p>
                      <p>温度范围: {zone.tempRange.min} ~ {zone.tempRange.max}°C</p>
                    </div>
                  </div>
                ))}
                {isEditMode && (
                  <button className="w-full py-2 border border-dashed border-ice-500/30 rounded-lg text-sm text-ice-400 hover:bg-ice-500/5 flex items-center justify-center gap-1">
                    <Plus className="w-4 h-4" />
                    添加温区
                  </button>
                )}
              </div>
            )}

            {activeTab === "points" && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {formData.points.map((point) => (
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          point.type === "mandatory" ? "bg-ice-400" : "bg-gray-500"
                        )}></span>
                        <span className="text-sm text-white">{point.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        ({point.x.toFixed(0)}, {point.y.toFixed(0)})
                      </span>
                    </div>
                    {point.description && (
                      <p className="text-xs text-gray-500 mt-1.5 ml-4">{point.description}</p>
                    )}
                  </div>
                ))}
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
                <p className="text-2xl font-bold font-num text-warning-400">{formData.points.filter((p) => p.type === "mandatory").length}</p>
                <p className="text-xs text-gray-500 mt-1">必放点位</p>
              </div>
              <div className="text-center p-3 bg-cold-800/30 rounded-lg">
                <p className="text-2xl font-bold font-num text-success-400">{formData.points.filter((p) => p.type === "optional").length}</p>
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
